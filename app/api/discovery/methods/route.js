import { NextResponse } from 'next/server';

export async function GET(request) {
  const methods = {
    sitemaps: { 
      name: 'XML Sitemaps', 
      description: 'Parses XML sitemaps and sitemap indexes', 
      effectiveness: 'Very High' 
    },
    homepage: { 
      name: 'Homepage Scrape', 
      description: 'Shallow crawl of homepage links', 
      effectiveness: 'Medium' 
    }
  };
  
  return NextResponse.json({ methods });
}

