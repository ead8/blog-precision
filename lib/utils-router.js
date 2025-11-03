/**
 * Utilities for page navigation (migrated from React Router setup)
 * Maps page names to Next.js routes
 */

const pageRoutes = {
  '': '/',
  'Home': '/',
  'start': '/start',
  'Login': '/auth',
  'SimpleLogin': '/simple-login',
  'Dashboard': '/dashboard',
  'newanalysis': '/newanalysis',
  'Results': '/results',
  'ArticleGeneration': '/article-generation',
  'GeneratedArticles': '/generated-articles',
};

/**
 * Convert a page name to its URL path
 * @param {string} pageName - The name of the page
 * @returns {string} The URL path for the page
 */
export function createPageUrl(pageName) {
  // Handle query strings
  if (pageName.includes('?')) {
    const [page, query] = pageName.split('?');
    const basePath = pageRoutes[page] || `/${page.toLowerCase()}`;
    return `${basePath}?${query}`;
  }
  
  return pageRoutes[pageName] || `/${pageName.toLowerCase()}`;
}

/**
 * Get the page name from a path
 * @param {string} path - The URL path
 * @returns {string} The page name
 */
export function getPageNameFromPath(path) {
  const cleanPath = path.split('?')[0];
  const entry = Object.entries(pageRoutes).find(([, route]) => route === cleanPath);
  return entry ? entry[0] : cleanPath.replace('/', '');
}

