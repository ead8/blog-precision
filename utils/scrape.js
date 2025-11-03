import { XMLParser } from 'fast-xml-parser';
import { load as loadHtml } from 'cheerio';
import pLimit from 'p-limit';

const parser = new XMLParser({ ignoreAttributes: false });

const DEFAULT_TIMEOUT_MS = 6000; // Reduced from 12000 - fail faster
const CONCURRENCY = Number(process.env.CRAWL_CONCURRENCY || 5);
const MAX_FAILURES_PER_DOMAIN = 3; // Allow 3 failures before blocking (timeouts aren't permanent failures)
const MAX_RETRIES = 1; // Reduced from 3 - only retry once
const MAX_SECTION_PAGES = 2; // Only probe 1-2 pages per section unless success

// Broaden discovery to common content hubs beyond just "/blog"
const SECTION_PATHS = [
  'blog',
  'articles',
  'insights',
  'resources',
  'news',
  'learn',
  'guides',
  'knowledge',
  'knowledge-base',
  'case-studies',
  'stories',
  'topics',
  'updates'
];

const COMMON_SITEMAPS = [
  'sitemap.xml',
  'post-sitemap.xml',
  'wp-sitemap-posts-post-1.xml',
  'sitemap-posts.xml',
  'blog-sitemap.xml',
  'news-sitemap.xml',
  'sitemap-blog.xml',
  'articles-sitemap.xml'
];

function yearMonthVariants(baseUrl) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return [
    `sitemap-${y}.xml`,
    `sitemap-posts-${y}.xml`,
    `sitemap-${y}-${m}.xml`
  ];
}

function normalizeBase(url) {
  const u = new URL(url);
  u.hash = '';
  u.search = '';
  return `${u.protocol}//${u.host}`;
}

// Track failures per domain for early stopping
const domainFailureCount = new Map();

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function isDomainBlocked(domain) {
  const failures = domainFailureCount.get(domain) || 0;
  return failures >= MAX_FAILURES_PER_DOMAIN;
}

function recordDomainFailure(domain, errorMessage = '') {
  const current = domainFailureCount.get(domain) || 0;
  const newCount = current + 1;
  const isTimeout = errorMessage && (errorMessage.includes('aborted') || errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT'));
  
  // For timeouts, increase failure count but be more lenient (require more failures)
  // For other errors, use normal threshold
  const threshold = isTimeout ? MAX_FAILURES_PER_DOMAIN + 1 : MAX_FAILURES_PER_DOMAIN;
  
  domainFailureCount.set(domain, newCount);
  
  if (newCount >= threshold) {
    console.log(`[Scrape] Domain ${domain} blocked after ${newCount} failures${isTimeout ? ' (mostly timeouts)' : ''}. Skipping future requests.`);
  } else if (isTimeout) {
    console.log(`[Scrape] Domain ${domain} timeout error (${newCount}/${threshold}). Continuing...`);
  }
}

function recordDomainSuccess(domain) {
  // Reset failure count on success
  domainFailureCount.delete(domain);
}

async function safeFetch(url, retries = MAX_RETRIES) {
  const domain = getDomain(url);
  
  // Early exit if domain is blocked
  if (isDomainBlocked(domain)) {
    throw new Error(`Domain ${domain} is blocked (too many failures)`);
  }
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  
  // More realistic browser headers to avoid bot detection
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0'
  };
  
  try {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const res = await fetch(url, { 
          redirect: 'follow', 
          signal: controller.signal, 
          headers 
        });
        
        // If successful, record success and return
        if (res.ok || res.status === 404) {
          recordDomainSuccess(domain);
          return res;
        }
        
        // If rate limited or server error, wait and retry
        if (res.status === 429 || res.status >= 500) {
          if (attempt < retries - 1) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff
            console.log(`[Scrape] Status ${res.status} for ${url}, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        recordDomainSuccess(domain);
        return res;
      } catch (fetchError) {
        // Network errors, timeouts, etc.
        if (attempt < retries - 1) {
          const delay = Math.min(500 * Math.pow(2, attempt), 2000); // Reduced delays
          console.log(`[Scrape] Fetch error for ${url} (${fetchError.message}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        // Record failure and throw
        recordDomainFailure(domain, fetchError.message || fetchError.cause?.message || '');
        throw fetchError;
      }
    }
  } finally {
    clearTimeout(id);
  }
}

export async function discoverUrlsForSite(siteUrl, maxCount = 200, minRequired = 0) {
  const urls = new Set();
  
  // minRequired: 0 for client sites (can stop early), 5+ for competitors (must find at least this many)
  const isClientSite = minRequired === 0;
  const MIN_REQUIRED_POSTS = minRequired;
  
  console.log(`[Scrape] Starting discovery for: ${siteUrl} (min required: ${MIN_REQUIRED_POSTS}, is client: ${isClientSite})`);
  const base = normalizeBase(siteUrl);

  // Step 1: Start with /robots.txt to discover declared sitemaps (primary method)
  console.log(`[Scrape] Checking /robots.txt first...`);
  const robotsSitemaps = await discoverSitemapsFromRobots(base).catch(() => []);
  const robotsCandidates = Array.isArray(robotsSitemaps) ? robotsSitemaps : [];
  
  if (robotsCandidates.length > 0) {
    console.log(`[Scrape] Found ${robotsCandidates.length} sitemap(s) in robots.txt`);
    // Process all sitemaps from robots.txt first (with timeout check)
    try {
      const sitemapUrls = await Promise.race([
        processSitemaps(robotsCandidates, urls, maxCount),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sitemap processing timeout')), 30000)
        )
      ]);
      console.log(`[Scrape] robots.txt sitemaps yielded ${urls.size} URLs`);
    } catch (e) {
      console.log(`[Scrape] Sitemap processing failed or timed out: ${e.message}`);
    }
    
    // If we got enough URLs from robots.txt sitemaps, return early
    // BUT: For competitors (minRequired > 0), ensure we have at least minRequired posts
    if (urls.size >= 10 && (isClientSite || urls.size >= MIN_REQUIRED_POSTS)) {
      console.log(`[Scrape] Successfully discovered ${urls.size} URLs from robots.txt sitemaps`);
      return Array.from(urls).slice(0, maxCount);
    }
    
    // If domain is blocked during sitemap processing, stop here
    if (isDomainBlocked(getDomain(siteUrl))) {
      console.log(`[Scrape] Domain blocked during sitemap processing, stopping`);
      return Array.from(urls).slice(0, maxCount);
    }
  } else {
    console.log(`[Scrape] No sitemaps found in robots.txt, trying common sitemap locations...`);
  }

  // Step 2: Fallback - Try common sitemap filenames (only if robots.txt didn't help)
  // LIMIT to first 3 most common sitemaps to fail fast
  const fallbackCandidates = [
    ...COMMON_SITEMAPS.slice(0, 3).map(path => `${base}/${path}`),
    ...yearMonthVariants(base).slice(0, 1).map(path => `${base}/${path}`)
  ];

  console.log(`[Scrape] Trying ${fallbackCandidates.length} fallback sitemap locations...`);
  for (const sitemapUrl of fallbackCandidates) {
    if (urls.size >= maxCount) break;
    if (isDomainBlocked(getDomain(siteUrl))) break; // Early exit if blocked
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay
      
      const res = await safeFetch(sitemapUrl);
      if (!res.ok) {
        if (res.status >= 500) break; // Server error - stop trying sitemaps
        continue;
      }
      
      console.log(`[Scrape] Found sitemap at: ${sitemapUrl}`);
      const text = await res.text();
      const xml = parser.parse(text);
      
      // urlset/url or sitemapindex/sitemap/loc
      const urlset = xml.urlset?.url;
      if (Array.isArray(urlset)) {
        for (const u of urlset) {
          const loc = u.loc || u?.['#text'];
          if (loc && typeof loc === 'string') urls.add(loc);
        }
        console.log(`[Scrape] Found ${urlset.length} URLs in sitemap`);
      }
      
      const sitemapIndex = xml.sitemapindex?.sitemap;
      if (Array.isArray(sitemapIndex)) {
        console.log(`[Scrape] Found sitemap index with ${sitemapIndex.length} sitemaps`);
        const childSitemaps = sitemapIndex.map(s => s.loc || s?.['#text']).filter(Boolean).slice(0, 5); // Limit to 5 child sitemaps
        await processSitemaps(childSitemaps, urls, maxCount, 5);
      }
      
      if (urls.size >= maxCount) break;
      if (urls.size >= 20) break; // If we found enough from sitemaps, don't try more
      
    } catch (sitemapError) {
      // If domain blocked, stop trying
      if (isDomainBlocked(getDomain(siteUrl))) {
        console.log(`[Scrape] Domain blocked while trying sitemaps, stopping`);
        break;
      }
    }
  }
  
  console.log(`[Scrape] Sitemap discovery found ${urls.size} URLs`);
  
  // Step 3: Last resort - Only if sitemaps didn't find enough, try direct page crawling
  // Early exit if domain already blocked
  if (isDomainBlocked(getDomain(siteUrl))) {
    console.log(`[Scrape] Domain blocked, skipping direct crawling`);
    return Array.from(urls).slice(0, maxCount);
  }
  
  // For client sites: if we found 10+ URLs, that's enough (can have 0 posts)
  // For competitors: we need to find at least MIN_REQUIRED_POSTS (usually 5)
  const needsMoreDiscovery = isClientSite ? urls.size < 10 : urls.size < MIN_REQUIRED_POSTS;
  
  if (needsMoreDiscovery) {
    console.log(`[Scrape] Sitemaps found ${urls.size} URLs (need ${MIN_REQUIRED_POSTS} for ${isClientSite ? 'client' : 'competitor'}), trying direct crawling...`);
    try {
      // Start with the provided URL first (don't assume /blog)
      const discovered = new Set();
      const directUrls = await crawlBlogPages(siteUrl, maxCount - discovered.size, MIN_REQUIRED_POSTS);
      directUrls.forEach(url => {
        urls.add(url);
        discovered.add(url);
      });
      
      // If still not enough and URL looks like a listing page, try common paths
      // For client sites: limit to 2 sections (early stop is fine)
      // For competitors: try more sections until we find minimum required posts
      const maxSectionsToTry = isClientSite ? 2 : 4; // Try harder for competitors
      const stillNeedMore = isClientSite ? discovered.size < 5 : urls.size < MIN_REQUIRED_POSTS;
      
      if (stillNeedMore && !isDomainBlocked(getDomain(siteUrl))) {
        const sectionUrls = guessSectionListingUrls(siteUrl, base).slice(0, maxSectionsToTry);
        for (const su of sectionUrls) {
          if (urls.size >= maxCount) break;
          if (isDomainBlocked(getDomain(siteUrl))) break;
          
          // For competitors: keep trying until we have minimum required
          // For client: early exit is fine
          if (!isClientSite && urls.size >= MIN_REQUIRED_POSTS) break;
          
          const additionalUrls = await crawlBlogPages(su, maxCount - urls.size, MIN_REQUIRED_POSTS);
          additionalUrls.forEach(url => urls.add(url));
          
          // Early exit if we found enough or domain blocked
          // For competitors: ensure we have at least MIN_REQUIRED_POSTS
          const hasEnough = isClientSite ? urls.size >= maxCount : urls.size >= MIN_REQUIRED_POSTS;
          if (hasEnough || isDomainBlocked(getDomain(siteUrl))) break;
        }
      }
      
      console.log(`[Scrape] Direct crawling found ${Array.from(discovered).length} URLs`);
    } catch (error) {
      console.error(`[Scrape] Direct crawling failed:`, error.message);
    }
  }
  
  console.log(`[Scrape] Total URLs found: ${urls.size}`);
  return Array.from(urls).slice(0, maxCount);
}

// Discover sitemaps from robots.txt (Sitemap: ... lines)
// Handles both absolute URLs and relative paths
async function discoverSitemapsFromRobots(base) {
  const sitemapUrls = [];
  try {
    const res = await safeFetch(`${base}/robots.txt`);
    if (!res.ok) {
      console.log(`[Scrape] robots.txt not found or not accessible (${res.status})`);
      return sitemapUrls;
    }
    const text = await res.text();
    const baseUrlObj = new URL(base);
    
    text.split(/\r?\n/).forEach(line => {
      // Match both absolute URLs and relative paths
      const absoluteMatch = line.match(/^\s*Sitemap:\s*(https?:\/\/\S+)/i);
      if (absoluteMatch && absoluteMatch[1]) {
        sitemapUrls.push(absoluteMatch[1].trim());
        return;
      }
      
      // Try relative path
      const relativeMatch = line.match(/^\s*Sitemap:\s*(\/\/?[^\s]+)/i);
      if (relativeMatch && relativeMatch[1]) {
        try {
          const relativePath = relativeMatch[1].trim();
          // If it starts with //, it's protocol-relative, keep as is with protocol
          if (relativePath.startsWith('//')) {
            sitemapUrls.push(`${baseUrlObj.protocol}${relativePath}`);
          } else {
            // Relative path, combine with base
            const sitemapUrl = new URL(relativePath, base);
            sitemapUrls.push(sitemapUrl.toString());
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    });
    
    if (sitemapUrls.length > 0) {
      console.log(`[Scrape] Discovered ${sitemapUrls.length} sitemap(s) from robots.txt:`, sitemapUrls);
    }
  } catch (error) {
    console.log(`[Scrape] Error reading robots.txt:`, error.message);
  }
  return sitemapUrls;
}

// Process multiple sitemap URLs and extract all URLs from them
async function processSitemaps(sitemapUrls, urlsSet, maxCount, maxChildSitemaps = 5) {
  const processed = new Set();
  
  for (const sitemapUrl of sitemapUrls) {
    if (urlsSet.size >= maxCount) break;
    if (processed.has(sitemapUrl)) continue;
    processed.add(sitemapUrl);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between requests
      
      const res = await safeFetch(sitemapUrl);
      if (!res.ok) continue;
      
      console.log(`[Scrape] Processing sitemap: ${sitemapUrl}`);
      const text = await res.text();
      const xml = parser.parse(text);
      
      // Handle urlset (direct list of URLs)
      const urlset = xml.urlset?.url;
      if (Array.isArray(urlset)) {
        for (const u of urlset) {
          if (urlsSet.size >= maxCount) break;
          const loc = u.loc || u?.['#text'];
          if (loc && typeof loc === 'string') urlsSet.add(loc);
        }
        console.log(`[Scrape] Found ${urlset.length} URLs in sitemap`);
      }
      
      // Handle sitemapindex (index of child sitemaps)
      const sitemapIndex = xml.sitemapindex?.sitemap;
      if (Array.isArray(sitemapIndex)) {
        console.log(`[Scrape] Found sitemap index with ${sitemapIndex.length} child sitemaps`);
        // REDUCED: Limit to first 3 child sitemaps for faster processing
        const childSitemaps = sitemapIndex
          .map(s => s.loc || s?.['#text'])
          .filter(Boolean)
          .slice(0, Math.min(3, maxChildSitemaps));
        
        // Recursively process child sitemaps (with reduced limit)
        await processSitemaps(childSitemaps, urlsSet, maxCount, 3);
      }
      
      if (urlsSet.size >= maxCount) break;
      
    } catch (sitemapError) {
      console.log(`[Scrape] Failed to process sitemap ${sitemapUrl}:`, sitemapError.message);
    }
  }
}

// Generate likely section listing URLs (blog, articles, insights, etc.)
function guessSectionListingUrls(siteUrl, base) {
  const list = new Set();
  try {
    const u = new URL(siteUrl);
    list.add(u.toString());
    const path = u.pathname.replace(/^\/+|\/+$/g, '');
    const last = path.split('/').filter(Boolean).pop() || '';
    // If current path already looks like a section hub, prefer it first
    if (SECTION_PATHS.includes(last)) {
      list.add(`${base}/${last}`);
    }
  } catch {
    // ignore
  }
  // Add common section hubs
  SECTION_PATHS.forEach(p => list.add(`${base}/${p}`));
  return Array.from(list);
}

// Probe a small number of section pages quickly to see if there are posts
async function probeSections(sectionUrls, maxPages = MAX_SECTION_PAGES, maxCount = 60) {
  const found = new Set();
  for (const su of sectionUrls.slice(0, 2)) { // Only try first 2 sections
    const domain = getDomain(su);
    if (isDomainBlocked(domain)) continue; // Skip blocked domains
    
    let foundInSection = false;
    for (let i = 1; i <= maxPages; i++) {
      if (found.size >= maxCount) break;
      if (isDomainBlocked(domain)) break; // Early exit
      
      const pageUrl = i === 1 ? su : `${su.replace(/\/$/, '')}/page/${i}`;
      try {
        const res = await safeFetch(pageUrl);
        if (!res.ok) {
          if (i === 1) break; // Fail fast if first page fails
          continue;
        }
        const html = await res.text();
        const $ = loadHtml(html);
        const base = `${new URL(su).protocol}//${new URL(su).host}`;
        const extracted = extractArticleUrls($, base, su);
        extracted.forEach(u => found.add(u));
        
        if (extracted.length > 0) {
          foundInSection = true;
        } else if (i === 1) {
          break; // No articles on first page, skip this section
        }
      } catch (e) {
        // On timeout/unreachable, stop probing this section immediately
        if (i === 1 || isDomainBlocked(domain)) break;
      }
    }
    
    // Early exit if we found enough or domain blocked
    if (found.size >= maxCount || isDomainBlocked(domain)) break;
  }
  return Array.from(found);
}

async function crawlBlogPages(siteUrl, maxCount = 200, minRequired = 0) {
  const urls = new Set();
  const urlObj = new URL(siteUrl);
  const base = `${urlObj.protocol}//${urlObj.host}`;
  const domain = getDomain(siteUrl);
  const isClientSite = minRequired === 0;
  
  // Check if domain is already blocked
  if (isDomainBlocked(domain)) {
    console.log(`[Scrape] Domain ${domain} is blocked, skipping crawl`);
    return [];
  }
  
  // Define pagination patterns to try
  const paginationPatterns = [
    { base: siteUrl, pattern: '', page: 1 }, // First page (the URL itself)
    { base: siteUrl, pattern: '/page/{n}', page: 2 },
    { base: siteUrl, pattern: '?page={n}', page: 2 },
    { base: siteUrl, pattern: '/p/{n}', page: 2 }
  ];
  
  let consecutiveFailures = 0;
  let foundAnySuccess = false;
  
  // For client sites: only try 2 pages (early stop is fine)
  // For competitors: try up to 4 pages to find minimum required posts
  let maxPages = isClientSite ? MAX_SECTION_PAGES : Math.max(MAX_SECTION_PAGES, 4);
  
  // Try first few pages
  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    if (urls.size >= maxCount) break;
    if (isDomainBlocked(domain) || consecutiveFailures >= 2) break; // Fail fast
    
    for (const pattern of paginationPatterns) {
      if (urls.size >= maxCount) break;
      if (pageNum === 1 && pattern.pattern !== '') continue; // Skip non-first patterns for page 1
      if (pageNum > 1 && pattern.pattern === '') continue; // Skip first pattern for page > 1
      
      try {
        let pageUrl;
        if (pageNum === 1) {
          pageUrl = siteUrl;
        } else {
          pageUrl = pattern.base + pattern.pattern.replace('{n}', pageNum);
        }
        
        console.log(`[Scrape] Trying page: ${pageUrl}`);
        
        // Add small delay between requests to avoid rate limiting (except first request)
        if (pageNum > 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const res = await safeFetch(pageUrl);
        
        if (!res.ok) {
          console.log(`[Scrape] Page returned status ${res.status}`);
          if (pageNum > 1) break; // Stop this pattern if page doesn't exist
          continue;
        }
        
        const html = await res.text();
        const $ = loadHtml(html);
        
        // Extract article URLs using multiple strategies
        const pageUrls = extractArticleUrls($, base, siteUrl);
        
        if (pageUrls.length === 0) {
          consecutiveFailures++;
          // For client sites: fail fast after first page or 2 failures
          // For competitors: be more persistent - only stop if we have enough posts OR domain blocked
          if (isClientSite && (pageNum === 1 || consecutiveFailures >= 2)) {
            console.log(`[Scrape] No articles found on page ${pageNum}, stopping (consecutive failures: ${consecutiveFailures})`);
            break;
          } else if (!isClientSite && consecutiveFailures >= 2 && urls.size >= minRequired) {
            // For competitors: if we already have minimum required, we can stop
            console.log(`[Scrape] Found ${urls.size} posts (min required: ${minRequired}), stopping`);
            break;
          }
        } else {
          consecutiveFailures = 0; // Reset on success
          foundAnySuccess = true;
        }
        
        pageUrls.forEach(url => urls.add(url));
        console.log(`[Scrape] Page ${pageNum}: Found ${pageUrls.length} articles (${urls.size} total, need ${minRequired})`);
        
        // For competitors: if we found minimum required posts, we can stop early
        if (!isClientSite && urls.size >= minRequired) {
          console.log(`[Scrape] Found minimum required ${minRequired} posts, stopping crawl`);
          break;
        }
        
        // If first page succeeded and we haven't hit max, allow one more page
        if (pageUrls.length > 0 && pageNum === 1 && maxPages < 4 && !isClientSite) {
          // Allow more pages for competitors if first succeeded
          maxPages = 4;
          continue;
        }
        
      } catch (error) {
        consecutiveFailures++;
        console.error(`[Scrape] Error on page ${pageNum}:`, error.message, error.cause?.code || '');
        
        // Fail fast for client sites
        // For competitors: only stop if we have enough OR domain blocked OR too many failures
        const hasEnoughPosts = !isClientSite && urls.size >= minRequired;
        if (isDomainBlocked(domain) || (isClientSite && consecutiveFailures >= 2) || hasEnoughPosts) {
          if (hasEnoughPosts) {
            console.log(`[Scrape] Stopping crawl - found ${urls.size} posts (required: ${minRequired})`);
          } else {
            console.log(`[Scrape] Stopping crawl due to failures or blocked domain`);
          }
          break;
        }
        
        // For client sites: stop on any error after first page
        if (isClientSite && pageNum > 1) break;
      }
    }
  }
  
  return Array.from(urls);
}

function extractArticleUrls($, base, originalUrl) {
  const urls = [];
  const seen = new Set();
  const urlObj = new URL(originalUrl);
  const host = urlObj.host;
  
  // Strategy 1: Look for article-specific selectors
  const articleSelectors = [
    'article a',
    '.post a',
    '.blog-post a',
    '.entry a',
    '.post-title a',
    '.entry-title a',
    'h2 a',
    'h3 a',
    '.article-link',
    '.post-link',
    'main a', // Often articles are in main content area
    '.content a',
    '.blog-list a',
    '.articles-list a',
    '[class*="article"] a', // Any element with "article" in class
    '[class*="post"] a', // Any element with "post" in class
    'ul a', // Lists often contain article links
    'ol a'
  ];
  
  articleSelectors.forEach(selector => {
    $(selector).each((_i, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      
      try {
        const fullUrl = new URL(href, base);
        if (fullUrl.host !== host) return; // Must be same domain
        
        const pathname = fullUrl.pathname.toLowerCase();
        
        // Check if it looks like an article
        if (isArticleUrl(pathname, fullUrl.toString()) && !seen.has(fullUrl.toString())) {
          urls.push(fullUrl.toString());
          seen.add(fullUrl.toString());
        }
      } catch {}
    });
  });
  
  // Strategy 2: If we didn't find much, scan all links
  // For pages under /articles/ or /blog/, be more aggressive
  const isContentListingPage = /\/articles\/?$|\/blog\/?$|\/posts\/?$|\/news\/?$/i.test(originalUrl);
  
  if (urls.length < 5 || isContentListingPage) {
    $('a[href]').each((_i, el) => {
      const href = $(el).attr('href');
      if (!href || seen.has(href)) return;
      
      try {
        const fullUrl = new URL(href, base);
        if (fullUrl.host !== host) return;
        
        const pathname = fullUrl.pathname.toLowerCase();
        if (isArticleUrl(pathname, fullUrl.toString()) && !seen.has(fullUrl.toString())) {
          urls.push(fullUrl.toString());
          seen.add(fullUrl.toString());
        }
      } catch {}
    });
  }
  
  return urls;
}

function isArticleUrl(pathname, fullUrl) {
  // Must contain blog-related keywords OR be under a content directory
  const hasContentKeyword = /blog|post|article|news|insight|guide|tutorial|story|content/i.test(pathname);
  
  // Check if it's under a known content path (even if keyword not in URL itself)
  const pathParts = pathname.split('/').filter(p => p.length > 0);
  const isUnderContentPath = pathParts.length >= 2 && 
    /^(blog|articles|posts|news|insights|guides|resources|content|stories)$/i.test(pathParts[0]);
  
  if (!hasContentKeyword && !isUnderContentPath) {
    return false;
  }
  
  // Must NOT be pagination, category, tag, etc.
  if (/page\/\d+|\/page\?|category|tag|author|search|feed|rss|sitemap|archive|wp-content|wp-includes|login|admin|contact|about|privacy|terms/i.test(pathname)) {
    return false;
  }
  
  // Should have some depth (not just /blog or /blog/ or /articles/)
  // But allow /articles/slug even if it's only 2 parts
  if (pathParts.length < 2) {
    return false;
  }
  
  // If it's under /articles/ or similar, and has a slug, it's likely an article
  if (isUnderContentPath && pathParts.length >= 2) {
    const slug = pathParts[pathParts.length - 1];
    // Exclude single-letter or numeric-only slugs
    if (slug.length >= 3 && !/^\d+$/.test(slug)) {
      return true;
    }
  }
  
  // Should look like an actual article (has a slug or ID)
  const lastPart = pathParts[pathParts.length - 1];
  if (lastPart.length < 3) {
    return false;
  }
  
  return true;
}

async function crawlWithPagination(siteUrl, maxCount = 200) {
  const urls = new Set();
  const base = normalizeBase(siteUrl);
  
  // Check for known blog platforms first
  const knownPlatformUrls = await tryKnownPlatforms(siteUrl, maxCount);
  if (knownPlatformUrls.length > 0) {
    console.log(`[Scrape] Found ${knownPlatformUrls.length} URLs using known platform detection`);
    return knownPlatformUrls;
  }
  
  // Common pagination patterns
  const paginationPatterns = [
    // Page-based pagination
    { pattern: '/page/{page}', start: 1, maxPages: 20 },
    { pattern: '/p/{page}', start: 1, maxPages: 20 },
    { pattern: '/?page={page}', start: 1, maxPages: 20 },
    { pattern: '/blog/page/{page}', start: 1, maxPages: 20 },
    { pattern: '/blog/p/{page}', start: 1, maxPages: 20 },
    { pattern: '/blog/?page={page}', start: 1, maxPages: 20 },
    { pattern: '/insights/page/{page}', start: 1, maxPages: 20 },
    { pattern: '/news/page/{page}', start: 1, maxPages: 20 },
    { pattern: '/content/page/{page}', start: 1, maxPages: 20 },
    // Offset-based pagination
    { pattern: '/?offset={offset}', start: 0, maxPages: 20, step: 10 },
    { pattern: '/blog/?offset={offset}', start: 0, maxPages: 20, step: 10 },
    { pattern: '/?start={offset}', start: 0, maxPages: 20, step: 10 },
    // Year/month pagination
    { pattern: '/{year}/{month}', start: new Date().getFullYear(), maxPages: 12, step: -1, isYearMonth: true },
    { pattern: '/blog/{year}/{month}', start: new Date().getFullYear(), maxPages: 12, step: -1, isYearMonth: true },
    { pattern: '/insights/{year}/{month}', start: new Date().getFullYear(), maxPages: 12, step: -1, isYearMonth: true }
  ];

  for (const pagination of paginationPatterns) {
    if (urls.size >= maxCount) break;
    
    try {
      const foundUrls = await tryPaginationPattern(base, pagination, maxCount - urls.size);
      foundUrls.forEach(url => urls.add(url));
      
      // If we found a good pattern, continue with it
      if (foundUrls.length > 5) {
        console.log(`[Scrape] Found good pagination pattern: ${pagination.pattern} with ${foundUrls.length} URLs`);
        break;
      }
    } catch (error) {
      console.log(`[Scrape] Pagination pattern ${pagination.pattern} failed:`, error.message);
    }
  }

  return Array.from(urls);
}

async function tryPaginationPattern(base, pagination, maxUrls) {
  const urls = new Set();
  const { pattern, start, maxPages, step = 1, isYearMonth = false } = pagination;
  
  for (let i = 0; i < maxPages; i++) {
    if (urls.size >= maxUrls) break;
    
    let pageValue;
    if (isYearMonth) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      pageValue = `${year}/${month}`;
    } else {
      pageValue = start + (i * step);
    }
    
    let url;
    if (isYearMonth) {
      const year = pageValue.split('/')[0];
      const month = pageValue.split('/')[1];
      url = `${base}${pattern.replace('{year}', year).replace('{month}', month)}`;
    } else {
      url = `${base}${pattern.replace('{page}', pageValue).replace('{offset}', pageValue)}`;
    }
    
    try {
      const res = await safeFetch(url);
      if (!res.ok) break;
      
      const html = await res.text();
      const $ = loadHtml(html);
      
      // Look for article links with comprehensive selectors
      const articleLinks = [];
      
      // First, try specific selectors that indicate blog posts
      const specificSelectors = [
        'article a[href]',
        '.post a[href]',
        '.blog-post a[href]',
        '.entry a[href]',
        '.post-title a[href]',
        '.entry-title a[href]',
        '.blog-post-title a[href]',
        '.wp-post-title a[href]',
        '.post-link a[href]',
        '.article-link a[href]',
        '.content-item a[href]',
        '.news-item a[href]',
        '.insight-item a[href]'
      ];
      
      specificSelectors.forEach(selector => {
        $(selector).each((_i, el) => {
          const href = $(el).attr('href');
          if (!href) return;
          
          try {
            const fullUrl = new URL(href, base);
            if (fullUrl.host === new URL(base).host) {
              articleLinks.push(fullUrl.toString());
            }
          } catch {}
        });
      });
      
      // If we didn't find enough with specific selectors, try general link analysis
      if (articleLinks.length < 5) {
        $('a[href]').each((_i, el) => {
          const href = $(el).attr('href');
          if (!href) return;
          
          try {
            const fullUrl = new URL(href, base);
            if (fullUrl.host === new URL(base).host) {
              // Check if it looks like a blog post
              const pathname = fullUrl.pathname.toLowerCase();
              if (/blog|post|article|news|insights|content|story|guide|tutorial|how-to/i.test(pathname) && 
                  !/page|category|tag|author|search|feed|rss|sitemap|archive|about|contact|privacy|terms/i.test(pathname)) {
                articleLinks.push(fullUrl.toString());
              }
            }
          } catch {}
        });
      }
      
      articleLinks.forEach(link => urls.add(link));
      
      // If we didn't find any new articles on this page, we might have reached the end
      if (articleLinks.length === 0) {
        console.log(`[Scrape] No articles found on page ${i + 1}, stopping pagination`);
        break;
      }
      
      console.log(`[Scrape] Page ${i + 1}: Found ${articleLinks.length} articles (${urls.size} total)`);
      
    } catch (error) {
      console.log(`[Scrape] Error fetching page ${i + 1}:`, error.message);
      break;
    }
  }
  
  return Array.from(urls);
}

async function tryKnownPlatforms(siteUrl, maxCount = 200) {
  const base = normalizeBase(siteUrl);
  const hostname = new URL(siteUrl).hostname.toLowerCase();
  const urls = new Set();
  
  // Neil Patel blog - uses /blog/page/{page} pattern
  if (hostname.includes('neilpatel.com')) {
    console.log('[Scrape] Detected Neil Patel blog, using specialized crawling');
    for (let page = 1; page <= 10; page++) {
      try {
        const url = `${base}/blog/page/${page}`;
        const res = await safeFetch(url);
        if (!res.ok) break;
        
        const html = await res.text();
        const $ = loadHtml(html);
        
        $('article a[href], .post-title a[href], .entry-title a[href]').each((_i, el) => {
          const href = $(el).attr('href');
          if (href) {
            try {
              const fullUrl = new URL(href, base);
              if (fullUrl.host === new URL(base).host) {
                urls.add(fullUrl.toString());
              }
            } catch {}
          }
        });
        
        if (urls.size >= maxCount) break;
      } catch (error) {
        console.log(`[Scrape] Error on Neil Patel page ${page}:`, error.message);
        break;
      }
    }
  }
  
  // Semrush blog - uses /blog/page/{page} pattern
  else if (hostname.includes('semrush.com')) {
    console.log('[Scrape] Detected Semrush blog, using specialized crawling');
    for (let page = 1; page <= 10; page++) {
      try {
        const url = `${base}/blog/page/${page}`;
        const res = await safeFetch(url);
        if (!res.ok) break;
        
        const html = await res.text();
        const $ = loadHtml(html);
        
        $('article a[href], .post-title a[href], .entry-title a[href], .blog-post a[href]').each((_i, el) => {
          const href = $(el).attr('href');
          if (href) {
            try {
              const fullUrl = new URL(href, base);
              if (fullUrl.host === new URL(base).host) {
                urls.add(fullUrl.toString());
              }
            } catch {}
          }
        });
        
        if (urls.size >= maxCount) break;
      } catch (error) {
        console.log(`[Scrape] Error on Semrush page ${page}:`, error.message);
        break;
      }
    }
  }
  
  // Google Ads blog - uses different structure
  else if (hostname.includes('google.com') && siteUrl.includes('/products/ads')) {
    console.log('[Scrape] Detected Google Ads blog, using specialized crawling');
    try {
      const res = await safeFetch(siteUrl);
      if (res.ok) {
        const html = await res.text();
        const $ = loadHtml(html);
        
        // Google uses specific selectors
        $('a[href*="/products/ads/"]').each((_i, el) => {
          const href = $(el).attr('href');
          if (href) {
            try {
              const fullUrl = new URL(href, base);
              if (fullUrl.host === new URL(base).host && 
                  fullUrl.pathname.includes('/products/ads/') &&
                  !fullUrl.pathname.endsWith('/products/ads/')) {
                urls.add(fullUrl.toString());
              }
            } catch {}
          }
        });
      }
    } catch (error) {
      console.log('[Scrape] Error on Google Ads blog:', error.message);
    }
  }
  
  // WordPress sites - try common WordPress patterns
  else {
    console.log('[Scrape] Trying WordPress patterns');
    const wpPatterns = [
      { pattern: '/page/{page}', start: 1, maxPages: 10 },
      { pattern: '/?paged={page}', start: 1, maxPages: 10 },
      { pattern: '/blog/page/{page}', start: 1, maxPages: 10 },
      { pattern: '/blog/?paged={page}', start: 1, maxPages: 10 },
      { pattern: '/insights/page/{page}', start: 1, maxPages: 10 },
      { pattern: '/news/page/{page}', start: 1, maxPages: 10 }
    ];
    
    for (const pattern of wpPatterns) {
      if (urls.size >= maxCount) break;
      
      for (let page = pattern.start; page <= pattern.maxPages; page++) {
        try {
          const url = `${base}${pattern.pattern.replace('{page}', page)}`;
          const res = await safeFetch(url);
          if (!res.ok) break;
          
          const html = await res.text();
          const $ = loadHtml(html);
          
          // WordPress specific selectors
          $('article a[href], .post a[href], .entry a[href], .blog-post a[href], .wp-post-title a[href]').each((_i, el) => {
            const href = $(el).attr('href');
            if (href) {
              try {
                const fullUrl = new URL(href, base);
                if (fullUrl.host === new URL(base).host) {
                  const pathname = fullUrl.pathname.toLowerCase();
                  if (/blog|post|article|news|insights|content/i.test(pathname) && 
                      !/page|category|tag|author|search|feed|rss|sitemap/i.test(pathname)) {
                    urls.add(fullUrl.toString());
                  }
                }
              } catch {}
            }
          });
          
          if (urls.size >= maxCount) break;
        } catch (error) {
          console.log(`[Scrape] Error on WordPress page ${page}:`, error.message);
          break;
        }
      }
    }
  }
  
  return Array.from(urls);
}

export async function enrichUrls(urls, maxCount = 200) {
  const limit = pLimit(CONCURRENCY);
  // Ensure we don't process more than maxCount URLs
  const urlsToProcess = Array.isArray(urls) ? urls.slice(0, maxCount) : [];
  const tasks = urlsToProcess.map(url => limit(async () => {
    try {
      const r = await safeFetch(url);
      const html = await r.text();
      const $ = loadHtml(html);
      const title = $('title').first().text().trim() || null;
      const metaDesc = $('meta[name="description"]').attr('content') || null;
      const h1 = $('h1').first().text().trim() || null;
      const headings = $('h2').map((_i, el) => $(el).text().trim()).get().slice(0, 20);
      return { url, title, meta_description: metaDesc, h1, h2: headings };
    } catch {
      return { url, title: null };
    }
  }));
  return Promise.all(tasks);
}


