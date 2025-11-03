import { NextResponse } from 'next/server';
import { discoverUrlsForSite } from '@/utils/scrape';

export async function POST(request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }
    
    const urls = await discoverUrlsForSite(url, 200);
    
    return NextResponse.json({ 
      url, 
      discovered: urls.slice(0, 50), 
      totalDiscovered: urls.length, 
      methodsUsed: ['sitemaps_or_homepage'] 
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'Discovery test failed', details: e.message },
      { status: 500 }
    );
  }
}

