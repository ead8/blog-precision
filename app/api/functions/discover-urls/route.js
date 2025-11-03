import { NextResponse } from 'next/server';
import { discoverUrlsForSite } from '@/utils/scrape';

export async function POST(request) {
  try {
    const { siteUrl, max = 200, siteKey } = await request.json();
    
    if (!siteUrl) {
      return NextResponse.json({ error: 'siteUrl required' }, { status: 400 });
    }
    
    // Determine if this is a client site (can have 0 posts) or competitor/leader (needs min 5 posts)
    const isClientSite = siteKey === 'client';
    const minRequired = isClientSite ? 0 : 5; // Client can have 0, others need 5
    
    const urls = await discoverUrlsForSite(siteUrl, Math.min(+max || 200, 500), minRequired);
    
    return NextResponse.json({ urls });
  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}

