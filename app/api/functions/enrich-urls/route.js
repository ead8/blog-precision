import { NextResponse } from 'next/server';
import { enrichUrls } from '@/utils/scrape';

export async function POST(request) {
  try {
    const { urls = [], max = 1000 } = await request.json();
    
    const articles = await enrichUrls(urls, Math.min(+max || 1000, 2000));
    
    return NextResponse.json({ articles });
  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}

