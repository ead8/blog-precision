"use client"


import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { LogOut, UserCircle, Loader2, ChevronDown, LogIn } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/lib/utils-router';

export default function AuthStatus() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setCurrentUser(null);
      }
      setIsLoading(false);
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setCurrentUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = () => {
    router.push(createPageUrl('Login'));
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.reload(); // Reload the page to clear state and reflect logged-out status
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center px-4">
        <Loader2 className="w-5 h-5 animate-spin text-black" />
      </div>
    );
  }

  if (currentUser) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 bg-white/20 text-black border-black/30 hover:bg-white/40">
            <UserCircle className="w-5 h-5" />
            <span className="font-semibold truncate max-w-[100px]">
              {currentUser.user_metadata?.full_name?.split(' ')[0] || 
               currentUser.email?.split('@')[0] || 
               'User'}
            </span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // NEW: Display Login/Register buttons for logged-out users
  return (
    <div className="flex items-center space-x-2">
       <Button onClick={handleLogin} variant="outline" className="bg-transparent text-black border-black/30 hover:bg-white/30 font-extrabold">
          Login
       </Button>
    </div>
  );
}
