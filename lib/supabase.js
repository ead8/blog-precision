import { createClient } from '@supabase/supabase-js';

// Next.js uses process.env for environment variables
// Client-side env vars must be prefixed with NEXT_PUBLIC_
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jeqbocvcmuyyfgezqhob.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcWJvY3ZjbXV5eWZnZXpxaG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTg4NzksImV4cCI6MjA3NjY5NDg3OX0.QKE1yxTI6EL_RJlcfv2X2h-KOZpLgRBb6Rc9KOIWBOU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);