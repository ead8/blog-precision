import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

const okOrThrow = (resp) => {
  if (resp.error) throw new Error(resp.error.message);
  return resp.data;
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const created_by = searchParams.get('created_by');
    const order = searchParams.get('order');
    const limit = searchParams.get('limit');
    
    const filters = {};
    for (const [key, value] of searchParams.entries()) {
      if (!['id', 'created_by', 'order', 'limit'].includes(key)) {
        filters[key] = value;
      }
    }
    
    if (id) {
      const data = okOrThrow(
        await supabaseAdmin.from('writing_requests').select('*').eq('id', id).single()
      );
      return NextResponse.json(data);
    }
    
    let q = supabaseAdmin.from('writing_requests').select('*');
    if (created_by) q = q.eq('created_by', created_by);
    
    for (const [k, v] of Object.entries(filters)) {
      q = q.eq(k, v);
    }
    
    if (order) {
      const ascending = !order.startsWith('-');
      const field = order.replace('-', '');
      q = q.order(field, { ascending });
    }
    if (limit) q = q.limit(Number(limit));
    
    const rows = okOrThrow(await q);
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.created_by) {
      body.created_by = 'demo-user';
    }
    
    const data = okOrThrow(
      await supabaseAdmin.from('writing_requests').insert(body).select('*').single()
    );
    
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

