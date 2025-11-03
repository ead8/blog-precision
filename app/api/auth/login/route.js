import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    return NextResponse.json({ 
      user: data.user, 
      session: data.session 
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'Login failed', details: e.message },
      { status: 500 }
    );
  }
}

