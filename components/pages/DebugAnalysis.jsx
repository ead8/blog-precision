"use client"

import React, { useState, useEffect } from 'react';

export default function DebugAnalysis() {
  const [debugInfo, setDebugInfo] = useState('Loading...');

  useEffect(() => {
    const checkDependencies = async () => {
      const info = [];
      
      // Check if we can import the required modules
      try {
        const { User, Analysis, Article, Recommendation } = await import('@/api/entities');
        info.push('✅ Entities imported successfully');
      } catch (e) {
        info.push(`❌ Entities import failed: ${e.message}`);
      }

      try {
        const { InvokeLLM } = await import('@/api/integrations');
        info.push('✅ Integrations imported successfully');
      } catch (e) {
        info.push(`❌ Integrations import failed: ${e.message}`);
      }

      try {
        const { supabase } = await import('@/lib/supabase');
        info.push('✅ Supabase imported successfully');
        
        // Test Supabase connection
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          info.push(`✅ User authenticated: ${session.user.email}`);
        } else {
          info.push('⚠️ No user session found');
        }
      } catch (e) {
        info.push(`❌ Supabase import/connection failed: ${e.message}`);
      }

      try {
        const { motion } = await import('framer-motion');
        info.push('✅ Framer Motion imported successfully');
      } catch (e) {
        info.push(`❌ Framer Motion import failed: ${e.message}`);
      }

      setDebugInfo(info.join('\n'));
    };

    checkDependencies();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Debug Analysis Page</h1>
          <p className="text-slate-700 text-lg max-w-2xl mx-auto mb-6">Checking dependencies and connections...</p>
          
          <div className="bg-white p-6 rounded-lg shadow-lg text-left">
            <h2 className="text-xl font-semibold mb-4">Debug Information:</h2>
            <pre className="whitespace-pre-wrap text-sm text-gray-700">{debugInfo}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
