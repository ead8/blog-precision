import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// Helper function
const okOrThrow = (resp) => {
  if (resp.error) throw new Error(resp.error.message);
  return resp.data;
};

// GET /api/analysis/crud - List or get single analysis
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const data = okOrThrow(
        await supabaseAdmin.from('analyses').select('*').eq('id', id).single()
      );
      return NextResponse.json(data);
    }
    
    // Filter by created_by and ordering
    const created_by = searchParams.get('created_by');
    const order = searchParams.get('order');
    const limit = searchParams.get('limit');
    
    let q = supabaseAdmin.from('analyses').select('*');
    if (created_by) q = q.eq('created_by', created_by);
    if (order) {
      const ascending = !order.startsWith('-');
      const field = order.replace('-', '');
      q = q.order(field, { ascending });
    }
    if (limit) q = q.limit(Number(limit));
    
    const rows = okOrThrow(await q);
    return NextResponse.json(rows);
  } catch (e) {
    console.error('[Entities] GET /analysis/crud error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

// POST /api/analysis/crud - Create analysis
export async function POST(request) {
  try {
    const payload = await request.json();
    
    if (!payload.created_by) {
      return NextResponse.json(
        { error: 'created_by field is required' },
        { status: 400 }
      );
    }
    
    const data = okOrThrow(
      await supabaseAdmin.from('analyses').insert(payload).select('*').single()
    );
    
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

