"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/lib/utils-router';
import { motion } from 'framer-motion';

export default function StartPage() {
  const router = useRouter();
  
  const handleGetStarted = () => {
    // Redirect to auth page - ProtectedRoute will handle authentication
    router.push(createPageUrl('newanalysis'));
  };

  const featuresLeft = [
    { text: 'Analyse competitors' },
    { text: 'Get strategic insights' },
    { text: 'Save hours of manual research time' },
    { text: 'Find low-competition, high-opportunity topics' },
    { text: 'Fill critical content gaps your competitors are missing' },
    { text: 'Save & Revisit all your analysis reports' },
    { text: "It's 100% Free – no credit card required", bold: true },
  ];

  const featuresRight = [
    'Discover content opportunities',
    'Dominate your niche with targeted content',
    'Boost your SEO and organic traffic',
    'Rank faster with strategic, not random, content',
    'Get 6 prioritised blog topics in under 2 minutes',
    'Keep Your Strategy 100% private and secure',
  ];

  return (
    <div className="grow flex items-center justify-center bg-linear-to-br from-white via-orange-50 to-orange-100 p-6 sm:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-5xl mx-auto text-center"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Stop Guessing, Start Dominating.
        </h1>
        <p className="mt-4 text-lg text-slate-700 max-w-2xl mx-auto">
          Create your free account to unlock your personal content strategy dashboard.
        </p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-left max-w-4xl mx-auto">
          <ul className="space-y-4">
            {featuresLeft.map((feature, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 shrink-0 mt-1" />
                <span className={feature.bold ? 'font-semibold text-slate-800' : 'text-slate-700'}>
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>
          <ul className="space-y-4">
            {featuresRight.map((feature, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 shrink-0 mt-1" />
                <span className="text-slate-700">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-12">
            <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-orange-500 text-black shadow-lg hover:bg-orange-600 transition-transform hover:scale-105 px-8 py-6 text-lg font-bold group"
            >
                Get Started For Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
        </div>

      </motion.div>
    </div>
  );
}