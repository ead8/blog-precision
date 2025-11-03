"use client"

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/lib/utils-router';

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          // Redirect to auth page immediately
          router.push(createPageUrl('Login'));
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        // Redirect to auth page on error
        router.push(createPageUrl('Login'));
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        router.push(createPageUrl('Login'));
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // While checking auth or if not authenticated (will redirect)
  if (isAuthenticated === null || !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6">
        <div className="bg-white/80 p-10 rounded-2xl shadow-2xl">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-6" />
          <h1 className="text-2xl font-bold text-slate-800">Redirecting to login...</h1>
        </div>
      </div>
    );
  }

  // If authenticated, show the page content
  return <>{children}</>;
}