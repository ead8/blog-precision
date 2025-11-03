import { supabase } from './supabase';

// In Next.js, API routes are served from the same origin
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// Helper to call backend with JSON and authentication
export async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  
  // Get the current session token from Supabase
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers = { 
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  // Add Authorization header if user is authenticated
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    let details = null;
    let hint = null;
    try { 
      const j = await res.json(); 
      message = j.error || message; 
      details = j.details;
      hint = j.hint;
    } catch {}
    
    // Create more descriptive error message
    const fullMessage = [message, details, hint].filter(Boolean).join(' - ');
    console.error(`[apiFetch] Error fetching ${url}:`, fullMessage);
    throw new Error(fullMessage);
  }
  return res.json();
}
