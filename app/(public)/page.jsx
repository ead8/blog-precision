"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, BarChart, Lightbulb, FileText } from 'lucide-react';                                                                          
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/lib/utils-router';
import { motion } from 'framer-motion';

export default function HomePage() {
  const router = useRouter();

  const handleGetStarted = () => {
      router.push(createPageUrl('start'));
  }

  const Feature = ({ icon, title, description }) => (
    <div className="flex items-start gap-4">
      <div className="shrink-0 w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
        {React.cloneElement(icon, { className: "w-6 h-6" })}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <p className="mt-1 text-slate-600">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="grow flex items-center justify-center bg-linear-to-br from-white via-orange-50 to-orange-100 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header removed as requested */}

        {/* Hero Section */}
        <main className="py-16 md:py-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-950">
              Stop Guessing, Start Dominating.
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-slate-800">
              BlogPrecision reveals exactly where your competitors are winning—and where they're vulnerable. It automatically identifies the blog topics you need to cover and the gaps you can dominate. In minutes, you'll have 6 strategic blog topics to use.
            </p>
            <p className="mt-6 text-lg font-bold text-slate-900">
              Ready to transform your content strategy?
            </p>
            <div className="mt-8 flex justify-center">
              <Button size="lg" onClick={handleGetStarted} className="bg-orange-500 text-black shadow-lg hover:bg-orange-600 transition-transform hover:scale-105 px-8 py-6 text-lg font-bold group">
                GET STARTED NOW
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>
        </main>
      </div>

      {/* "How It Works" Section removed as requested */}
    </div>
  );
}