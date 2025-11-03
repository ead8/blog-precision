import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// Helper function
const okOrThrow = (resp) => {
  if (resp.error) throw new Error(resp.error.message);
  return resp.data;
};

// GET /api/analysis/crud/[id] - Get analysis
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    const data = okOrThrow(
      await supabaseAdmin.from('analyses').select('*').eq('id', id).single()
    );
    
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

// PATCH /api/analysis/crud/[id] - Update analysis
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const payload = await request.json();
    
    const data = okOrThrow(
      await supabaseAdmin.from('analyses').update(payload).eq('id', id).select('*').single()
    );
    
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

// DELETE /api/analysis/crud/[id] - Delete analysis
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    okOrThrow(await supabaseAdmin.from('analyses').delete().eq('id', id));
    
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

