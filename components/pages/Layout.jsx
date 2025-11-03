"use client"



import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/lib/utils-router';
import { supabase } from '@/lib/supabase';
import {
  Menu,
  X,
  LayoutDashboard,
  BarChart,
  Lightbulb,
  FileText,
  MessageSquare,
  Sparkles,
  Zap,
  BookOpen,
  Settings,
  HelpCircle,
  Mail, // Added for Contact
  Rss, // Added for Blog Icon
  Target, // Added for Supporters Icon
} from 'lucide-react';
import AuthStatus from '@/components/shared/AuthStatus';
import { LocaleProvider } from '@/components/context/LocaleContext';

const navigationItems = [
  { title: "Home", url: "/", type: "internal" },
  { title: "New Analysis", url: createPageUrl("newanalysis"), type: "internal" },
  { title: "Generated Articles", url: createPageUrl("GeneratedArticles"), type: "internal" },
  { title: "Dashboard", url: createPageUrl("Dashboard"), type: "internal" },
  {
    title: "Blog",
    type: "dropdown",
    items: [
      { title: "Blog", href: "//blog/", description: "Read our latest posts and articles.", icon: Rss },
      { title: "Supporters", href: "//supporters/", description: "See who supports our mission.", icon: Target },
    ]
  },
  { title: "Contact", href: "//contact/", type: "external" },
];

function Layout({ children, currentPageName }) {
    return (
      <LocaleProvider>
        <LayoutContent currentPageName={currentPageName}>{children}</LayoutContent>
      </LocaleProvider>
    );
}

function LayoutContent({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // NEW LOGIC: Trigger backend function for new users
          if (!session.user.user_metadata?.welcome_email_sent) {
            console.log("New user detected, triggering welcome process...");
            fetch('/api/functions/welcome', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            }).then(response => response.json())
              .then(data => {
                console.log("Welcome process finished:", data);
              }).catch(error => {
                console.error("Error triggering welcome process:", error);
              });
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('User check error:', e);
        setUser(null);
      }
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen w-full bg-white text-slate-800 flex flex-col" style={{ fontFamily: "'Roboto', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;600;800&display=swap');
      `}</style>
      <header className="sticky top-0 z-50 bg-orange-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[137px]"> {/* MODIFIED: Set height exactly between last two values */}
            {/* Logo */}
            <div className="shrink-0">
              <a href="//" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b3d8ac0857424eb77e380e/0d754e115_BlogPrecisionroundlogo.png"
                  alt="BlogPrecision Logo"
                  className="w-24 h-24"
                />
                <span className="font-bold text-black text-xl">BlogPrecision</span>
              </a>
            </div>

            {/* --- FIX: Group all desktop items together --- */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Desktop Navigation */}
              <nav className="flex items-center space-x-2">
                {navigationItems.map((item) => {
                  if (item.type === 'dropdown') {
                    return (
                      <div key={item.title} className="group relative">
                        <button className="text-black text-base font-extrabold tracking-tight px-4 py-2 rounded-md hover:bg-orange-600 focus:bg-orange-600 transition-colors">
                          {item.title}
                        </button>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-4 space-y-3 w-[400px]">
                            {item.items.map(subItem => (
                              <a
                                key={subItem.title}
                                href={subItem.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-3 p-3 rounded-md hover:bg-slate-100"
                              >
                                <subItem.icon className="h-5 w-5 text-blue-800 mt-1 shrink-0" />
                                <div>
                                  <p className="font-semibold text-blue-800">{subItem.title}</p>
                                  <p className="text-sm text-slate-500">{subItem.description}</p>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Handle external vs internal links
                  const isExternal = item.type === 'external';
                  const linkElement = isExternal
                    ? <a href={item.href} target="_blank" rel="noopener noreferrer">{item.title}</a>
                    : <Link href={item.url}>{item.title}</Link>;

                  const isActive = !isExternal && pathname === item.url;

                  return (
                    <div
                      key={item.title}
                      className={cn(
                        "text-black text-base font-extrabold tracking-tight px-4 py-2 rounded-md hover:bg-orange-600 transition-colors",
                        isActive && "bg-orange-600"
                      )}
                    >
                      {linkElement}
                    </div>
                  );
                })}
              </nav>

              {/* Desktop Auth Status */}
              <AuthStatus />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-black hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-8 w-8" aria-hidden="true" />
                ) : (
                  <Menu className="block h-8 w-8" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-orange-500 border-t border-orange-600">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigationItems.map((item) => {
                if (item.type === 'dropdown') {
                  return (
                    <div key={item.title}>
                      <p className="text-black block px-3 py-2 rounded-md text-base font-extrabold tracking-tight">{item.title}</p>
                      <div className="pl-4">
                        {item.items.map(subItem => (
                          <a
                            key={subItem.title}
                            href={subItem.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-black hover:bg-orange-600 block px-3 py-2 rounded-md text-base font-medium"
                          >
                            {subItem.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                }
                const isExternal = item.type === 'external';
                const linkElement = isExternal
                  ? <a href={item.href} target="_blank" rel="noopener noreferrer">{item.title}</a>
                  : <Link href={item.url}>{item.title}</Link>;

                const isActive = !isExternal && pathname === item.url;
                
                return (
                  <div
                    key={item.title}
                    className={cn(
                      "text-black hover:bg-orange-600 block px-3 py-2 rounded-md text-base font-extrabold tracking-tight",
                      isActive && "bg-orange-600"
                    )}
                  >
                    {linkElement}
                  </div>
                );
              })}
            </div>
            {/* Mobile Auth Status */}
            <div className="pt-4 pb-3 border-t border-orange-400">
              <AuthStatus />
            </div>
          </div>
        )}
      </header>
      <main className="grow flex flex-col">
        {children}
      </main>
    </div>
  );
}


export default Layout;

