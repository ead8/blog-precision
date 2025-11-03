import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    }
    
    const { data, error } = await supabaseClient.auth.getUser(token);
    
    if (error || !data?.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      id: data.user.id, 
      email: data.user.email, 
      welcome_email_sent: false 
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to get user', details: e.message },
      { status: 500 }
    );
  }
}

