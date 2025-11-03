import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

const okOrThrow = (resp) => {
  if (resp.error) throw new Error(resp.error.message);
  return resp.data;
};

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const data = okOrThrow(
      await supabaseAdmin.from('generated_articles').update(body).eq('id', id).select('*').single()
    );
    
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    okOrThrow(await supabaseAdmin.from('generated_articles').delete().eq('id', id));
    
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

