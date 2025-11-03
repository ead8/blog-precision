import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { items = [] } = await request.json();
    
    const seen = new Set();
    const deduped = [];
    
    for (const item of items) {
      const key = (item.title || item.url || JSON.stringify(item)).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
    }
    
    return NextResponse.json({ items: deduped });
  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}

