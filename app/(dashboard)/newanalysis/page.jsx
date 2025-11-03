"use client"

import React, { useState, useEffect, useCallback } from "react";
import { User, Analysis, Article, Recommendation } from "@/lib/entities";
import { useRouter } from "next/navigation";
import { createPageUrl } from "@/lib/utils-router";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";

import UrlInputStep from "@/components/analysis/UrlInputStep";
import KeywordsStep from "@/components/analysis/KeywordsStep";
import AudienceStep from "@/components/analysis/AudienceStep";
import ReviewStep from "@/components/analysis/ReviewStep";
import ProgressHeader from "@/components/analysis/ProgressHeader";
import AnalysisProgress from "@/components/results/AnalysisProgress";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Helper functions to call API endpoints
const discoverUrls = async (payload) => {
  const response = await fetch('/api/functions/discover-urls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Discover URLs failed: ${response.statusText}`);
  return response.json();
};

const enrichUrls = async (payload) => {
  const response = await fetch('/api/functions/enrich-urls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Enrich URLs failed: ${response.statusText}`);
  return response.json();
};

const InvokeLLM = async (payload) => {
  const response = await fetch('/api/functions/invoke-llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = response.statusText || 'Unknown error';
    }
    throw new Error(`LLM invocation failed: ${errorMessage}`);
  }
  return response.json();
};

const STEPS = [
  { id: 'urls', title: 'Website URLs', description: 'Enter your blog and competitor URLs' },
  { id: 'keywords', title: 'Target Keywords', description: 'Add keywords with search volumes' },
  { id: 'audience', title: 'Target Audience', description: 'Select your target audience and location' },
  { id: 'review', title: 'Review & Launch', description: 'Confirm details and start analysis' }
];

const EMPTY_FORM_DATA = {
  client_url: '',
  competitor_url: '',
  competitor_url_2: '',
  industry_leader_url: '',
  keywords: [],
  target_location: 'Global',
  target_audience: 'general_public'
};

// HELPER FUNCTION FOR VERIFICATION - SIMPLIFIED
const verifyRecordCreation = async (recordId) => {
  const maxRetries = 10;
  const delay = 500;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const record = await Analysis.get(recordId);
      if (record) {
        console.log(`[NewAnalysis.js] Verification successful for record ${recordId} on attempt ${i + 1}.`);
        return true;
      }
    } catch (error) {
      console.warn(`[NewAnalysis.js] Verification attempt ${i + 1} for record ${recordId} failed. Error: ${error.message}. Retrying...`);
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return false;
};

function NewAnalysisContent() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPreviousData, setIsLoadingPreviousData] = useState(true);
  const [hasPreviousData, setHasPreviousData] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM_DATA);
  const [currentUser, setCurrentUser] = useState(null);

  // New state for running the analysis directly on this page
  const [analysisState, setAnalysisState] = useState({
    isRunning: false,
    analysisRecord: null,
    error: null,
    analysisStartTime: null,
  });

  // --- REBUILT startAnalysis function with new architecture ---
  const startAnalysis = useCallback(async (analysisData) => {
    console.log(`[${new Date().toISOString()}] --- startAnalysis function has been called. ---`);

    try {
        console.log(`[${new Date().toISOString()}] Received analysisData:`, JSON.stringify(analysisData, null, 2));

        const functionStartTime = Date.now();
        console.log(`[${new Date().toISOString()}] >>> Analysis started for record: ${analysisData.id}`);

        setAnalysisState(prev => ({
            ...prev,
            isRunning: true,
            analysisRecord: analysisData,
            analysisStartTime: functionStartTime
        }));

        const updateProgressAndStep = async (stepDescription, progressPercentage) => {
          console.log(`[${new Date().toISOString()}] Progress: ${progressPercentage}% - ${stepDescription}`);
          const currentAnalysisRecordInDB = await Analysis.get(analysisData.id);
          const currentAnalysisResultsInDB = currentAnalysisRecordInDB?.analysis_results || {};

          await Analysis.update(analysisData.id, {
            progress: progressPercentage,
            analysis_results: { ...currentAnalysisResultsInDB, current_step: stepDescription }
          });
          setAnalysisState(prev => ({
            ...prev,
            analysisRecord: {
              ...prev.analysisRecord,
              progress: progressPercentage,
              analysis_results: { ...(prev.analysisRecord?.analysis_results || {}), current_step: stepDescription }
            }
          }));
        };

        const sites = [
          { key: 'client', url: analysisData.client_url, name: 'your blog' },
          { key: 'competitor', url: analysisData.competitor_url, name: 'competitor' },
          { key: 'leader', url: analysisData.industry_leader_url, name: 'industry leader' }
        ];
        if (analysisData.competitor_url_2) {
          sites.push({ key: 'competitor_2', url: analysisData.competitor_url_2, name: 'second competitor' });
        }
        console.log(`[${new Date().toISOString()}] Constructed sites array:`, JSON.stringify(sites, null, 2));

        await updateProgressAndStep('Preparing analysis...', 5);
        
        // --- STAGE 1: URL DISCOVERY using new backend function ---
        await updateProgressAndStep('Discovering articles via sitemaps & crawls...', 10);
        let allDiscoveredUrlsBySiteKey = {};
        
        // PARALLEL discovery for all sites - much faster!
        console.log(`[STAGE 1] Starting parallel discovery for ${sites.length} sites...`);
        const discoveryPromises = sites.map(site => 
            discoverUrls({ siteUrl: site.url, analysisId: analysisData.id, siteKey: site.key })
                .then((response) => {
                    // API returns { urls: [...] } directly, not { data: { urls: [...] } }
                    const urls = response?.urls || [];
                    console.log(`[STAGE 1] ✓ Found ${urls.length} URLs for ${site.name}`);
                    return { siteKey: site.key, urls };
                })
                .catch(e => {
                    console.error(`[STAGE 1] ✗ Discovery failed for ${site.name}:`, e.message);
                    return { siteKey: site.key, urls: [] };
                })
        );
        
        const discoveryResults = await Promise.all(discoveryPromises);
        discoveryResults.forEach(result => {
            allDiscoveredUrlsBySiteKey[result.siteKey] = result.urls;
        });
        
        await updateProgressAndStep('Discovery complete, preparing enrichment...', 40);
        
        const allUniqueDiscoveredUrls = [...new Set(Object.values(allDiscoveredUrlsBySiteKey).flat())];
        console.log(`[STAGE 1] Total unique URLs found across all sites: ${allUniqueDiscoveredUrls.length}`);
        
        // --- STAGE 2: URL ENRICHMENT using new backend function ---
        await updateProgressAndStep('Enriching discovered URLs with titles...', 50);
        let enrichedArticles = [];
        if (allUniqueDiscoveredUrls.length > 0) {
            try {
                console.log(`[STAGE 2] Enriching ${allUniqueDiscoveredUrls.length} URLs...`);
                console.log(`[DEBUG] Sample URLs to enrich:`, allUniqueDiscoveredUrls.slice(0, 5));
                const enrichResponse = await enrichUrls({ urls: allUniqueDiscoveredUrls, analysisId: analysisData.id });
                console.log(`[DEBUG] Enrich response:`, enrichResponse);
                enrichedArticles = enrichResponse.data?.articles || enrichResponse.articles || [];
                console.log(`[STAGE 2] Successfully enriched ${enrichedArticles.length} URLs.`);
                if (enrichedArticles.length > 0) {
                    console.log(`[DEBUG] Sample enriched articles:`, enrichedArticles.slice(0, 3));
                }
            } catch (e) {
                console.error(`[STAGE 2] Failed to enrich URLs:`, e);
                console.error(`[DEBUG] Enrichment error details:`, e.message, e.stack);
            }
        } else {
            console.warn('[STAGE 2] No URLs to enrich.');
        }

        // Re-organize enriched articles by site
        // Helper function to extract base domain (e.g., "hubspot.com" from "blog.hubspot.com" or "www.hubspot.com")
        const getBaseDomain = (url) => {
            try {
                const hostname = new URL(url).hostname.toLowerCase();
                const parts = hostname.split('.');
                
                // Handle multi-part TLDs like .co.nz, .co.uk, .com.au
                const multiPartTLDs = ['co.nz', 'org.nz', 'ac.nz', 'co.uk', 'org.uk', 'com.au', 'co.za'];
                const lastTwo = parts.slice(-2).join('.');
                
                if (multiPartTLDs.includes(lastTwo) && parts.length >= 3) {
                    // For multi-part TLDs, get last 3 parts (e.g., example.co.nz)
                    return parts.slice(-3).join('.');
                } else if (parts.length >= 2) {
                    // For regular TLDs, get last 2 parts (e.g., example.com)
                    return parts.slice(-2).join('.');
                }
                return hostname;
            } catch (e) {
                return null;
            }
        };
        
        let allArticles = {};
        
        // Debug: Log all enriched article URLs
        console.log(`[DEBUG] Total enriched articles: ${enrichedArticles.length}`);
        if (enrichedArticles.length > 0) {
            console.log(`[DEBUG] Sample enriched articles:`, enrichedArticles.slice(0, 5).map(a => ({ url: a.url, title: a.title })));
        }
        
        sites.forEach(site => {
            const siteBaseDomain = getBaseDomain(site.url);
            console.log(`[DEBUG] Processing site: ${site.name}, URL: ${site.url}, Base domain: ${siteBaseDomain}`);
            
            if (!siteBaseDomain) {
                console.warn(`[${new Date().toISOString()}] Invalid URL "${site.url}" for site ${site.key}. Skipping enrichment mapping.`);
                allArticles[site.key] = [];
                return;
            }
            
            let debugMismatchCount = 0; // Track how many mismatches we've logged
            const articlesForSite = enrichedArticles.filter(art => {
                try {
                    if (typeof art.url !== 'string') {
                        console.log(`[DEBUG] Article URL is not a string:`, art);
                        return false;
                    }
                    const articleBaseDomain = getBaseDomain(art.url);
                    const matches = articleBaseDomain === siteBaseDomain;
                    
                    // Only log first few mismatches to avoid console spam and avoid temporal dead zone
                    if (!matches && debugMismatchCount < 3) {
                        console.log(`[DEBUG] Article domain mismatch: ${articleBaseDomain} !== ${siteBaseDomain} for ${art.url}`);
                        debugMismatchCount++;
                    }
                    
                    return matches;
                } catch (e) {
                    console.warn(`[${new Date().toISOString()}] Invalid article URL "${art.url}" during domain filtering for ${site.name}. Skipping. Error: ${e.message}`);
                    return false;
                }
            });
            allArticles[site.key] = articlesForSite;
            console.log(`[${new Date().toISOString()}] Enriched articles for ${site.name} (${siteBaseDomain}): ${articlesForSite.length}`);
            
            if (articlesForSite.length > 0) {
                console.log(`[DEBUG] Sample articles for ${site.name}:`, articlesForSite.slice(0, 3).map(a => a.url));
            }
        });

        // --- Update analysis record with discovery summary ---
        const client_posts_found = allArticles.client?.length || 0;
        const competitor_posts_found = (allArticles.competitor?.length || 0) + (allArticles.competitor_2?.length || 0);
        const leader_posts_found = allArticles.leader?.length || 0;

        const discovery_summary = {
            client_posts_found,
            competitor_posts_found,
            leader_posts_found,
            total_posts_analyzed: client_posts_found + competitor_posts_found + leader_posts_found
        };

        const currentAnalysisRecordInDB = await Analysis.get(analysisData.id);
        const currentAnalysisResultsInDB = currentAnalysisRecordInDB?.analysis_results || {};
        
        await Analysis.update(analysisData.id, {
            analysis_results: {
                ...currentAnalysisResultsInDB,
                discovery_summary
            }
        });

        setAnalysisState(prev => {
            const updatedAnalysisResults = {
                ...(prev.analysisRecord?.analysis_results || {}),
                discovery_summary
            };
            return {
                ...prev,
                analysisRecord: {
                    ...prev.analysisRecord,
                    analysis_results: updatedAnalysisResults
                }
            };
        });

        // --- VALIDATION ---
        await updateProgressAndStep('Validating results...', 70);
        const issues = [];
        
        // Client site can have 0 posts (may be a new blog)
        // We'll note it but not mark as critical
        if (client_posts_found < 5) {
            issues.push({ siteKey: 'client_url', url: analysisData.client_url, count: client_posts_found, critical: false });
            console.log(`[${new Date().toISOString()}] Client site has ${client_posts_found} posts (acceptable for new blogs)`);
        }
        
        // Competitors MUST have content for meaningful gap analysis
        const totalCompetitorPosts = (allArticles.competitor || []).length + 
                                      (allArticles.competitor_2 || []).length + 
                                      (allArticles.leader || []).length;
        
        // Mark competitor sites with insufficient content as critical
        if ((allArticles.competitor || []).length < 5) {
            issues.push({ siteKey: 'competitor_url', url: analysisData.competitor_url, count: (allArticles.competitor || []).length, critical: true });
        }
        if (analysisData.competitor_url_2 && (allArticles.competitor_2 || []).length < 5) {
            issues.push({ siteKey: 'competitor_url_2', url: analysisData.competitor_url_2, count: (allArticles.competitor_2 || []).length, critical: true });
        }
        if ((allArticles.leader || []).length < 5) {
            issues.push({ siteKey: 'industry_leader_url', url: analysisData.industry_leader_url, count: (allArticles.leader || []).length, critical: true });
        }

        // Validation fails ONLY if competitors don't have enough content
        // Need at least 15 total competitor posts for meaningful analysis
        const criticalIssues = issues.filter(issue => issue.critical);
        const hasEnoughCompetitorContent = totalCompetitorPosts >= 15;
        
        if (criticalIssues.length > 0 || !hasEnoughCompetitorContent) {
          console.warn(`[${new Date().toISOString()}] Validation failed: Insufficient competitor content.`, { issues, totalCompetitorPosts });
          const validationResult = { is_valid: false, issues };
          const failedAnalysisRecord = await Analysis.get(analysisData.id);
          const failedAnalysisResults = failedAnalysisRecord?.analysis_results || {};
          await Analysis.update(analysisData.id, { status: 'failed', analysis_results: { ...failedAnalysisResults, validation_result: validationResult, current_step: 'Content validation failed' } });
          setAnalysisState(prev => ({...prev, isRunning: false, error: 'Validation failed: Competitor sites must have at least 5 blog posts each. Your blog can have 0 posts (if new), but we need competitor content for gap analysis.' }));
          router.push(createPageUrl(`Results?id=${analysisData.id}`));
          return;
        }
        
        // Log info for sites with low content but continue
        if (issues.length > 0) {
            console.log(`[${new Date().toISOString()}] Note: Client site has ${client_posts_found} posts. Analysis will focus on competitor gaps.`);
        }

        await updateProgressAndStep('Saving discovered articles...', 85);
        const articlesToCreate = Object.entries(allArticles).flatMap(([source, articles]) =>
          (articles || []).map(a => ({ ...a, analysis_id: analysisData.id, source_site: source.replace('_url', '') }))
        );
        if (articlesToCreate.length > 0) {
          console.log(`[${new Date().toISOString()}] Attempting to bulk create ${articlesToCreate.length} articles.`);
          await Article.bulkCreate(articlesToCreate);
          console.log(`[${new Date().toISOString()}] Articles saved successfully.`);
        } else {
          console.log(`[${new Date().toISOString()}] No articles to save.`);
        }
        
        // --- STAGE 3: FINAL ANALYSIS using InvokeLLM ---
        await updateProgressAndStep('Generating final recommendations...', 90);
        const recGenStartTime = Date.now();
        console.log(`[${new Date().toISOString()}] ---> Starting recommendation generation.`);

        const allPreviousRecommendations = await Recommendation.filter({});
        console.log(`[${new Date().toISOString()}] Found ${allPreviousRecommendations.length} previously generated recommendations to check against.`);

        const filterDuplicateRecommendations = async (recommendations, clientArticles, previousRecommendations) => {
            if (!recommendations || recommendations.length === 0) return [];
            
            const hasClientArticles = clientArticles && clientArticles.length > 0;
            const hasPreviousRecs = previousRecommendations && previousRecommendations.length > 0;

            if (!hasClientArticles && !hasPreviousRecs) {
                return recommendations;
            }
        
            const duplicateCheckPrompt = `You are a world-class SEO strategist tasked with intelligently identifying duplicate content recommendations. Your goal is to catch true duplicates on the same specific topic while allowing fresh angles and unique formats to pass through. You must check the proposed recommendations against two lists: published articles and previously suggested ideas.

**REFERENCE LIST 1: EXISTING PUBLISHED ARTICLES (${hasClientArticles ? clientArticles.length : 0} total)**
${hasClientArticles ? clientArticles.map(a => `- Title: ${a.title}\n  H1: ${a.h1 || 'N/A'}\n  Meta: ${a.metaDescription || 'N/A'}`).join('\n\n') : 'None provided.'}

**REFERENCE LIST 2: PREVIOUSLY RECOMMENDED IDEAS (${hasPreviousRecs ? previousRecommendations.length : 0} total)**
${hasPreviousRecs ? previousRecommendations.map(rec => `- ${rec.title}`).join('\n') : 'None provided.'}

**PROPOSED NEW RECOMMENDATIONS:**
${recommendations.map((r, i) => `${i + 1}. ${r.title}`).join('\n')}

---
**DUPLICATE DETECTION RULES:**

**Rule #1: The Cross-Reference Check.**
For each "Proposed New Recommendation," you must compare it against **BOTH** "Reference List 1" and "Reference List 2".

**Rule #2: The 3-Factor Test.**
Compare using these three factors:
1.  **SPECIFIC TOPIC:** Do they cover the exact same narrow subject?
2.  **USER INTENT:** Is the primary goal the same (e.g., Informational guide vs. Transactional service page)?
3.  **ACTIONABLE TAKEAWAY:** After reading, would the user have learned or be able to do the exact same thing?

**Rule #3: Decision Logic.**
-   Mark as a **DUPLICATE** if it substantially overlaps with an item from **EITHER** Reference List 1 or Reference List 2 on **TWO OR MORE** of the three factors.
-   If only one factor overlaps, it is likely a unique angle. Mark as **NOT a duplicate**.
-   When in doubt, if you estimate over 65% of the content would be identical to an existing article or a previous idea, mark it as a duplicate. Otherwise, let it pass.

---
Return a valid JSON array with one entry per recommendation. The "similar_to" field is critical.
- If it's a duplicate of a published article, populate "similar_to" with the title of that article.
- If it's a duplicate of a previous recommendation, populate "similar_to" with the title of that recommendation.`;
        
            const duplicateCheckResults = await InvokeLLM({
                prompt: duplicateCheckPrompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        results: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    recommendation_number: { type: "number" },
                                    is_duplicate: { type: "boolean" },
                                    reason: { type: "string" },
                                    similar_to: { type: "string", description: "The title of the existing article or previous recommendation it is similar to." }
                                },
                                required: ["recommendation_number", "is_duplicate", "reason"]
                            }
                        }
                    },
                    required: ["results"]
                },
                model: "gpt-4o-mini"
            });
        
            console.log(`[${new Date().toISOString()}] Duplicate check results:`, JSON.stringify(duplicateCheckResults, null, 2));
        
            const uniqueRecommendations = recommendations.filter((rec, index) => {
                const checkResult = duplicateCheckResults.results?.[index];
                if (checkResult?.is_duplicate) {
                    console.log(`[${new Date().toISOString()}] FILTERED OUT duplicate: "${rec.title}" (similar to: ${checkResult.similar_to || 'existing content'})`);
                    return false;
                }
                return true;
            });
        
            console.log(`[${new Date().toISOString()}] Kept ${uniqueRecommendations.length} unique recommendations out of ${recommendations.length} generated.`);
            
            return uniqueRecommendations;
        };

        const generateRecommendations = async (analysisData, clientArticles, competitorArticles, leaderArticles) => {
            const prompt = `You are an expert SEO strategist. Analyze the provided article titles from a client, their competitors, and an industry leader. Based on this, generate exactly 12 unique, actionable blog post recommendations for the client.

**CURRENT DATE: ${new Date().toLocaleDateString('en-NZ', { year: 'numeric', month: 'long', day: 'numeric' })} (2025)**

CRITICAL QUALITY RULES:
- All recommendations must be current and relevant to 2025
- Never suggest titles with years before 2025
- Use current SEO terminology (e.g., "Google E-E-A-T" not "E-A-T")
- Ensure all industry terms and concepts are up-to-date

IMPORTANT: Some recommendations may be filtered out as duplicates, so generate 12 to ensure we have at least 6 after filtering.

CONTEXT:
- **Client's Site:** ${analysisData.client_url}
- **Client's Existing Articles (${clientArticles.length} found):** ${clientArticles.slice(0, 50).map(a => a.h1 || a.title).join(', ')}
- **Competitors' Articles (${competitorArticles.length} found):** ${competitorArticles.slice(0, 50).map(a => a.h1 || a.title).join(', ')}
- **Leader's Articles (${leaderArticles.length} found):** ${leaderArticles.slice(0, 50).map(a => a.h1 || a.title).join(', ')}
- **Target Audience:** ${analysisData.target_audience} in ${analysisData.target_location}

For each of the 12 recommendations, you MUST provide:
1.  **title**: A compelling, SEO-friendly headline.
2.  **description**: A 1-2 sentence explanation of the content opportunity.
3.  **why_this_works**: A brief strategic justification (e.g., "Targets a clear content gap").
4.  **opportunity_score**: 'high', 'medium', or 'low'.
5.  **competition_level**: 'high', 'medium', 'low', or 'very_low'.
6.  **recommended_length**: An estimated word count (e.g., "1200-1500 words").
7.  **target_keywords**: An array of 3-5 relevant keywords.`;

            console.log(`[${new Date().toISOString()}] --- Invoking LLM for recommendation generation.`);
            const results = await InvokeLLM({
              prompt: prompt,
              response_json_schema: {
                  type: "object",
                  properties: {
                    recommendations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          description: { type: "string" },
                          why_this_works: { type: "string" },
                          opportunity_score: { type: "string", enum: ["high", "medium", "low"] },
                          competition_level: { type: "string", enum: ["high", "medium", "low", "very_low"] },
                          recommended_length: { type: "string" },
                          target_keywords: { type: "array", items: { type: "string" } }
                        },
                        required: ["title", "description", "why_this_works", "opportunity_score", "competition_level", "recommended_length", "target_keywords"]
                      }
                    }
                  },
                  required: ["recommendations"]
              }
            });
            console.log(`[${new Date().toISOString()}] --- LLM invocation complete for recommendation generation. Found ${results?.recommendations?.length || 0} recommendations.`);
            return results.recommendations;
        };

        const initialRecommendations = await generateRecommendations(
          analysisData,
          allArticles.client || [],
          [...(allArticles.competitor || []), ...(allArticles.competitor_2 || [])],
          allArticles.leader || []
        );

        console.log(`[${new Date().toISOString()}] Generated ${initialRecommendations?.length || 0} initial recommendations. Now checking for duplicates...`);

        const recommendationsFromAI = await filterDuplicateRecommendations(
          initialRecommendations,
          allArticles.client || [],
          allPreviousRecommendations || []
        );

        console.log(`[${new Date().toISOString()}] After duplicate filtering: ${recommendationsFromAI?.length || 0} unique recommendations remain.`);

        if (recommendationsFromAI.length < 6) {
            console.log(`[${new Date().toISOString()}] WARNING: Only ${recommendationsFromAI.length} unique recommendations after filtering. Consider this acceptable or regenerate.`);
        }
        
        console.log(`[${new Date().toISOString()}] <--- Finished recommendation generation in ${((Date.now() - recGenStartTime) / 1000).toFixed(2)}s.`);

        async function validateTerminology(recommendationsToValidate) {
            if (!recommendationsToValidate || recommendationsToValidate.length === 0) {
                return [];
            }
            const currentDate = new Date().toLocaleDateString('en-NZ', {
                year: 'numeric',
                month: 'long'
            });
            const validationPrompt = `You are an expert SEO content validator. Today's date is ${currentDate}. Your task is to review the following blog post recommendations and correct any outdated information.

Review these ${recommendationsToValidate.length} blog post recommendations and check for:
1. **Outdated Years:** Any reference to 2024 or earlier when discussing current or future topics. These should be updated to ${new Date().getFullYear()} or made evergreen.
2. **Outdated SEO Terminology:** For example, "E-A-T" must be corrected to "E-E-A-T". Check for old algorithm names or deprecated practices.
3. **Outdated Industry Terms:** Look for old product names, superseded regulations, or any other terms that are no longer current.

For each recommendation, you MUST return a corrected version, even if no changes were made.

RECOMMENDATIONS TO VALIDATE:
${recommendationsToValidate.map((r, i) => `${i + 1}. Title: "${r.title}"\n   Keywords: ${r.target_keywords?.join(', ') || 'N/A'}`).join('\n\n')}
---
Return a valid JSON object containing a single key "corrected_recommendations", which is an array. Each object in the array must correspond to one of the original recommendations and include these fields:
- "title": The corrected (or original) title.
- "target_keywords": The corrected (or original) array of keywords.
- "correction_made": A boolean (true if you changed anything, false otherwise).
- "correction_note": A brief string explaining your correction, or null if no correction was made.`;

            console.log(`[${new Date().toISOString()}] --- Invoking LLM for terminology validation.`);
            const validationResult = await InvokeLLM({
                prompt: validationPrompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        corrected_recommendations: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    target_keywords: { "type": "array", "items": { "type": "string" } },
                                    correction_made: { type: "boolean" },
                                    correction_note: { type: ["string", "null"] }
                                },
                                required: ["title", "target_keywords", "correction_made"]
                            }
                        }
                    },
                    required: ["corrected_recommendations"]
                }
            });

            if (validationResult?.corrected_recommendations && validationResult.corrected_recommendations.length === recommendationsToValidate.length) {
                console.log(`[${new Date().toISOString()}] --- Terminology validation complete. Merging results.`);
                return recommendationsToValidate.map((originalRec, index) => {
                    const correction = validationResult.corrected_recommendations[index];
                    if (correction.correction_made) {
                        console.log(`[Validation] Correction applied to "${originalRec.title}": ${correction.correction_note}`);
                    }
                    return {
                        ...originalRec,
                        title: correction.title,
                        target_keywords: correction.target_keywords,
                        correction_made: correction.correction_made,
                        correction_note: correction.correction_note
                    };
                });
            }
            console.warn(`[${new Date().toISOString()}] Terminology validation failed or returned mismatched data. Skipping corrections.`);
            return recommendationsToValidate;
        }

        const validatedRecs = await validateTerminology(recommendationsFromAI || []);
        
        const recommendationsToSave = validatedRecs.slice(0, 6).map((rec, index) => ({
          ...rec, priority_rank: index + 1, analysis_id: analysisData.id
        }));

        if (recommendationsToSave.length > 0) {
          console.log(`[${new Date().toISOString()}] Data for bulkCreate:`, JSON.stringify(recommendationsToSave, null, 2));
          console.log(`[${new Date().toISOString()}] Attempting to bulk create ${recommendationsToSave.length} recommendations.`);
          await Recommendation.bulkCreate(recommendationsToSave);
          console.log(`[${new Date().toISOString()}] Recommendations saved successfully.`);
        } else {
          console.warn(`[${new Date().toISOString()}] No recommendations generated by AI.`);
        }
        
        await updateProgressAndStep('Compiling final report...', 95);

        const finalAnalysisRecordInDB = await Analysis.get(analysisData.id);
        const finalAnalysisResultsInDB = finalAnalysisRecordInDB?.analysis_results || {};
        await Analysis.update(analysisData.id, { status: 'completed', progress: 100, analysis_results: { ...finalAnalysisResultsInDB, current_step: 'Analysis completed' } });

        setAnalysisState(prev => ({
            ...prev,
            isRunning: false,
            analysisRecord: {
                ...prev.analysisRecord,
                status: 'completed',
                progress: 100,
                analysis_results: {
                    ...(prev.analysisRecord?.analysis_results || {}),
                    current_step: 'Analysis completed'
                }
            }
        }));

        const elapsedMs = Date.now() - functionStartTime;
        const minDurationMs = 75 * 1000;
        if (elapsedMs < minDurationMs) {
            const delayMs = minDurationMs - elapsedMs;
            console.log(`[NewAnalysis.js] Analysis finished in ${(elapsedMs / 1000).toFixed(2)}s. Waiting for an additional ${(delayMs / 1000).toFixed(2)}s to meet minimum duration.`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        const totalDuration = ((Date.now() - functionStartTime) / 1000).toFixed(2);
        console.log(`[${new Date().toISOString()}] <<< Analysis complete for record ${analysisData.id} in ${totalDuration}s.`);

        router.push(createPageUrl(`Results?id=${analysisData.id}`));

    } catch (error) {
        console.error(`[${new Date().toISOString()}] XXX A FATAL and UNEXPECTED error occurred during analysis:`, error);
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        console.error("Error Stack:", error.stack);

        const userFacingErrorMessage = `A critical error occurred during the analysis: ${error.message}. Please review your input or contact support.`;

        setAnalysisState(prev => ({
          ...prev,
          isRunning: false,
          error: userFacingErrorMessage
        }));

        if (analysisData?.id) {
          try {
            const errorAnalysisRecordInDB = await Analysis.get(analysisData.id);
            const errorAnalysisResultsInDB = errorAnalysisRecordInDB?.analysis_results || {};

            await Analysis.update(analysisData.id, {
              status: 'failed',
              analysis_results: {
                ...errorAnalysisResultsInDB,
                error: `Critical failure: ${error.message}`,
                current_step: 'Analysis failed due to an unexpected error'
              }
            });
            console.log(`[${new Date().toISOString()}] Analysis record ${analysisData.id} updated with status 'failed' due to critical error.`);
          } catch (updateError) {
            console.error(`[${new Date().toISOString()}] XXX Failed to update analysis record ${analysisData.id} with 'failed' status:`, updateError);
          }
        } else {
          console.error(`[${new Date().toISOString()}] Cannot update analysis record because analysisData.id is missing.`);
        }
    }
  }, [router]);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Get current user
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
        }
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };

    getUser();

    const handleRetry = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const retryId = urlParams.get('retry_id');
        if (retryId) {
            try {
                console.log(`[NewAnalysis.js] Retry detected for analysis ID: ${retryId}. Fetching record...`);
                const analysisRecord = await Analysis.get(retryId);
                if (analysisRecord) {
                    startAnalysis(analysisRecord);
                } else {
                    throw new Error(`Analysis record with ID ${retryId} not found.`);
                }
            } catch (error) {
                console.error(`[NewAnalysis.js] Failed to handle retry for ID ${retryId}:`, error);
                setAnalysisState(prev => ({ ...prev, isRunning: false, error: error.message, analysisStartTime: null }));
            }
        }
    };

    const loadPreviousData = async () => {
      // console.log('[NewAnalysis] 🔍 loadPreviousData() called - starting data load process');
      setIsLoadingPreviousData(true);
      try {
        // Check localStorage first - if it has data, use it (user's most recent form input)
        console.log('[NewAnalysis] 📦 Checking localStorage for saved form data...');
        const saved = localStorage.getItem('blogPrecision_formData');
        console.log('[NewAnalysis] localStorage.getItem result:', saved ? 'Found data' : 'No data found');
        
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            console.log('[NewAnalysis] ✅ Parsed localStorage data:', {
              client_url: parsed.client_url || '(empty)',
              competitor_url: parsed.competitor_url || '(empty)',
              competitor_url_2: parsed.competitor_url_2 || '(empty)',
              industry_leader_url: parsed.industry_leader_url || '(empty)',
              keywords_count: Array.isArray(parsed.keywords) ? parsed.keywords.length : 0,
              target_location: parsed.target_location || '(empty)',
              target_audience: parsed.target_audience || '(empty)'
            });
            
            const hasData = parsed.client_url?.trim() || 
                           parsed.competitor_url?.trim() || 
                           parsed.competitor_url_2?.trim() || 
                           parsed.industry_leader_url?.trim();
            console.log('[NewAnalysis] hasData check:', hasData, {
              client_url: !!parsed.client_url?.trim(),
              competitor_url: !!parsed.competitor_url?.trim(),
              competitor_url_2: !!parsed.competitor_url_2?.trim(),
              industry_leader_url: !!parsed.industry_leader_url?.trim()
            });
            
            if (hasData) {
              console.log('[NewAnalysis] ✅ Loading form data from localStorage (priority) - setting formData and hasPreviousData=true');
              setFormData(parsed);
              setHasPreviousData(true);
              setIsLoadingPreviousData(false);
              console.log('[NewAnalysis] ✅ localStorage load complete');
              return;
            } else {
              console.log('[NewAnalysis] ⚠️ localStorage has data but no URLs found, will try database fallback');
            }
          } catch (parseError) {
            console.error('[NewAnalysis] ❌ Error parsing localStorage data:', parseError);
          }
        } else {
          console.log('[NewAnalysis] ℹ️ No localStorage data found, will try database fallback');
        }
        
        // Fallback: Load from database (most recent completed analysis)
        console.log('[NewAnalysis] 🗄️ Checking database for most recent analysis...');
        const recentAnalyses = await Analysis.list('-created_date', 1);
        console.log('[NewAnalysis] Database query result:', {
          found: recentAnalyses?.length > 0,
          count: recentAnalyses?.length || 0
        });
        
        if (recentAnalyses?.[0]) {
          const last = recentAnalyses[0];
          console.log('[NewAnalysis] 📋 Most recent analysis from DB:', {
            id: last.id,
            client_url: last.client_url || '(empty)',
            competitor_url: last.competitor_url || '(empty)',
            competitor_url_2: last.competitor_url_2 || '(empty)',
            industry_leader_url: last.industry_leader_url || '(empty)',
            created_date: last.created_date
          });
          
          const dbHasData = last.client_url?.trim() || 
                           last.competitor_url?.trim() || 
                           last.competitor_url_2?.trim() || 
                           last.industry_leader_url?.trim();
          console.log('[NewAnalysis] dbHasData check:', dbHasData, {
            client_url: !!last.client_url?.trim(),
            competitor_url: !!last.competitor_url?.trim(),
            competitor_url_2: !!last.competitor_url_2?.trim(),
            industry_leader_url: !!last.industry_leader_url?.trim()
          });
          
          if (dbHasData) {
            console.log('[NewAnalysis] ✅ Loading form data from database (fallback) - setting formData and hasPreviousData=true');
            const dbFormData = {
              client_url: last.client_url || '',
              competitor_url: last.competitor_url || '',
              competitor_url_2: last.competitor_url_2 || '',
              industry_leader_url: last.industry_leader_url || '',
              keywords: Array.isArray(last.keywords) ? last.keywords.map(k => typeof k === 'object' && k !== null && 'keyword' in k ? k.keyword : String(k)) : [],
              target_location: last.target_location || 'Global',
              target_audience: last.target_audience || 'general_public'
            };
            console.log('[NewAnalysis] Prepared DB formData:', dbFormData);
            setFormData(dbFormData);
            setHasPreviousData(true);
          } else {
            console.log('[NewAnalysis] ⚠️ Database analysis found but no URLs present');
          }
        } else {
          console.log('[NewAnalysis] ℹ️ No analyses found in database');
        }
      } catch (error) {
        console.error('[NewAnalysis] ❌ Error loading previous data:', error);
        console.error('[NewAnalysis] Error stack:', error.stack);
      }
      console.log('[NewAnalysis] 🏁 loadPreviousData() complete - setting isLoadingPreviousData=false');
      setIsLoadingPreviousData(false);
    };

    const urlParams = new URLSearchParams(window.location.search);
    const hasRetryId = urlParams.has('retry_id');
    console.log('[NewAnalysis] 🔄 Component mount effect - hasRetryId:', hasRetryId);
    
    handleRetry().then(() => {
        if (!hasRetryId) {
            console.log('[NewAnalysis] 🚀 No retry_id, calling loadPreviousData()...');
            loadPreviousData();
        } else {
            console.log('[NewAnalysis] ⏭️ Has retry_id, skipping loadPreviousData()');
            // If retrying, still finish loading state
            setIsLoadingPreviousData(false);
        }
    });

  }, [startAnalysis]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [currentStep]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    console.log('[NewAnalysis] 💾 Form data changed, checking if save needed...', {
      client_url: formData.client_url || '(empty)',
      competitor_url: formData.competitor_url || '(empty)',
      competitor_url_2: formData.competitor_url_2 || '(empty)',
      industry_leader_url: formData.industry_leader_url || '(empty)',
      keywords_count: Array.isArray(formData.keywords) ? formData.keywords.length : 0
    });
    
    // Only save if at least one URL field has a non-empty value
    const hasData = formData.client_url?.trim() || 
                   formData.competitor_url?.trim() || 
                   formData.competitor_url_2?.trim() || 
                   formData.industry_leader_url?.trim();
    
    // console.log('[NewAnalysis] hasData check for save:', hasData);
    
    if (hasData) {
      try {
        const dataToSave = JSON.stringify(formData);
        console.log('[NewAnalysis] ✅ Saving form data to localStorage, size:', dataToSave.length, 'bytes');
        localStorage.setItem('blogPrecision_formData', dataToSave);
        console.log('[NewAnalysis] ✅ Save complete');
        
        // Verify save
        const verify = localStorage.getItem('blogPrecision_formData');
        console.log('[NewAnalysis] 🔍 Verification - localStorage has:', verify ? 'data' : 'nothing', 'after save');
      } catch (error) {
        console.error('[NewAnalysis] ❌ Error saving to localStorage:', error);
      }
    } else {
      console.log('[NewAnalysis] ⏭️ Skipping save - no URL data present');
    }
  }, [formData]);

  const updateFormData = (data) => setFormData(prev => ({ ...prev, ...data }));
  const clearAllData = () => { setFormData(EMPTY_FORM_DATA); setHasPreviousData(false); setCurrentStep(0); };
  const nextStep = () => { if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1); };
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setAnalysisState(prev => ({...prev, error: null}));

    try {
      // Map form fields (snake_case) to API fields (camelCase)
      const response = await Analysis.start({ 
        clientUrl: formData.client_url,
        competitorUrl: formData.competitor_url,
        leaderUrl: formData.industry_leader_url,
        keywords: formData.keywords,
        targetAudience: formData.target_audience,
        targetLocation: formData.target_location,
        userId: currentUser?.email || currentUser?.id || 'demo-user'
      });
      
      // API returns { analysisId, message, status }
      if (!response?.analysisId) {
        throw new Error("Failed to create analysis record: No ID was returned from the creation step.");
      }
      
      const analysisId = response.analysisId;
      console.log(`[NewAnalysis.js] Record created with ID: ${analysisId}. Verifying...`);

      const isVerified = await verifyRecordCreation(analysisId);

      if (!isVerified) {
        throw new Error("Verification failed: The newly created analysis record could not be read back from the database. This might be a temporary replication delay.");
      }

      console.log(`[NewAnalysis.js] Verification successful. Starting analysis process.`);
      
      // Fetch the full analysis record to pass to startAnalysis
      const newAnalysisRecord = await Analysis.get(analysisId);
      startAnalysis(newAnalysisRecord);

    } catch (error) {
      console.error("[NewAnalysis.js] Error in handleSubmit:", error);
      setAnalysisState({ isRunning: false, error: error.message, analysisRecord: null, analysisStartTime: null });
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    const safeFormData = { ...formData, keywords: Array.isArray(formData.keywords) ? formData.keywords : [] };
    switch (currentStep) {
      case 0: return <UrlInputStep data={safeFormData} updateData={updateFormData} onNext={nextStep} />;
      case 1: return <KeywordsStep data={safeFormData} updateData={updateFormData} onNext={nextStep} onBack={prevStep} />;
      case 2: return <AudienceStep data={safeFormData} updateData={updateFormData} onNext={nextStep} onBack={prevStep} />;
      case 3: return <ReviewStep data={safeFormData} onSubmit={handleSubmit} onBack={prevStep} isSubmitting={isSubmitting} />;
      default: return null;
    }
  };

  if (analysisState.isRunning) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-6xl">
           <AnalysisProgress
              analysis={analysisState.analysisRecord}
              startTime={analysisState.analysisStartTime ? new Date(analysisState.analysisStartTime) : null}
            />
        </div>
      </div>
    );
  }

  if (isLoadingPreviousData) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading previous settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <Button variant="outline" size="sm" onClick={() => router.push(createPageUrl("Dashboard"))} className="hover:bg-slate-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            {hasPreviousData && (
              <Button variant="outline" size="sm" onClick={clearAllData} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
            )}
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">New Competitive Analysis</h1>
            <p className="text-slate-700 text-lg max-w-2xl mx-auto">Discover content gaps and opportunities by analyzing your blog against competitors.</p>
          </div>
          {hasPreviousData && (
            <Alert className="mt-6 bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-700">
                <strong>Previous data loaded:</strong> Your settings from the last analysis have been pre-filled.
              </AlertDescription>
            </Alert>
          )}
        </motion.div>

        {analysisState.error && !analysisState.isRunning && (
            <Alert variant="destructive" className="my-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Analysis Failed to Start</AlertTitle>
                <AlertDescription>{analysisState.error}</AlertDescription>
            </Alert>
        )}

        <ProgressHeader steps={STEPS} currentStep={currentStep} />
        <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="mt-8">
          {renderStep()}
        </motion.div>
      </div>
    </div>
  );
}

export default function NewAnalysis() {
    return (
        <ProtectedRoute>
            <NewAnalysisContent />
        </ProtectedRoute>
    )
}