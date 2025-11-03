import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request) {
  try {
    const id = new URL(request.url).pathname.split('/').pop();
    if (!id || typeof id !== 'string' || !/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid analysis id' }, { status: 400 });
    }
    const { data: analysis, error } = await supabaseAdmin
      .from('analyses')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }
    
    // Return analysis directly (not wrapped) for consistency with other endpoints
    return NextResponse.json(analysis);
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to fetch analysis', details: e.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const id = new URL(request.url).pathname.split('/').pop();
    if (!id || typeof id !== 'string' || !/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid analysis id' }, { status: 400 });
    }
    const body = await request.json();
    
    console.log(`[API PUT /analysis/${id}] Update body:`, JSON.stringify(body, null, 2));
    
    const { data: analysis, error } = await supabaseAdmin
      .from('analyses')
      .update(body)
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) {
      console.error(`[API PUT /analysis/${id}] Supabase error:`, error);
      throw error;
    }
    
    if (!analysis) {
      console.error(`[API PUT /analysis/${id}] Analysis not found after update`);
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }
    
    console.log(`[API PUT /analysis/${id}] Update successful`);
    return NextResponse.json(analysis);
  } catch (e) {
    console.error(`[API PUT /analysis] Error:`, e);
    return NextResponse.json(
      { error: 'Failed to update analysis', details: e.message, hint: e.hint },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const id = new URL(request.url).pathname.split('/').pop();
    if (!id || typeof id !== 'string' || !/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid analysis id' }, { status: 400 });
    }
    const body = await request.json();
    
    const { data: analysis, error } = await supabaseAdmin
      .from('analyses')
      .update(body)
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) throw error;
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }
    
    return NextResponse.json(analysis);
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to update analysis', details: e.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const id = new URL(request.url).pathname.split('/').pop();
    if (!id || typeof id !== 'string' || !/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid analysis id' }, { status: 400 });
    }
    
    const { error } = await supabaseAdmin
      .from('analyses')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to delete analysis', details: e.message },
      { status: 500 }
    );
  }
}

