"use client"

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PenTool, 
  Search, 
  FileText, 
  Target, 
  Clock, 
  Bot, 
  Check, 
  ExternalLink,
  Sparkles 
} from "lucide-react";

const BUSINESS_ADVERTS = [
  {
    name: "New Zealand Backlinks",
    logo: "https://newzealandbacklinks.nz/wp-content/uploads/2024/09/New-Zealand-Backlinks-round-logo-300x300.webp",
    url: "https://newzealandbacklinks.nz/",
    tagline: "Top Quality New Zealand Backlinks",
  },
  {
    name: "SEOSPIKE",
    logo: "https://seospike.nz/wp-content/uploads/2025/04/SEOSPIKE-ROUND-logo.webp",
    url: "https://seospike.nz/",
    tagline: "We put our heart & soul into your business",
  }
];

const WRITING_QUOTES = [
  "The first draft of anything is garbage. But AI makes better garbage.",
  "Content is king, but engagement is queen, and the lady rules the house!",
  "Writing is thinking on paper. AI writing is thinking at light speed.",
  "The best marketing doesn't feel like marketing.",
  "Content builds relationships. Relationships are built on trust. Trust drives revenue.",
  "Every piece of content should have a purpose and drive toward an action.",
  "Write for humans, optimize for search engines.",
  "Quality content means that people want to share your content and link to your content."
];

const createCarouselItems = () => {
  const blogPrecisionItem = {
    type: 'thank_you',
    content: {
      name: "BlogPrecision",
      logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b3d8ac0857424eb77e380e/0d754e115_BlogPrecisionroundlogo.png",
      tagline: "Generating high-quality content with AI precision",
    }
  };

  const shuffledQuotes = [...WRITING_QUOTES].sort(() => Math.random() - 0.5);
  const alternatingItems = [];
  
  for (let i = 0; i < shuffledQuotes.length; i++) {
    alternatingItems.push({ type: 'quote', content: shuffledQuotes[i] });
    const advert = BUSINESS_ADVERTS[i % BUSINESS_ADVERTS.length];
    alternatingItems.push({ type: 'advert', content: advert });
  }
  
  return [blogPrecisionItem, ...alternatingItems];
};

export default function ArticleGenerationProgress({ progress, currentStep, selectedTopics }) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [carouselItems] = useState(() => createCarouselItems());

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const carouselTimer = setInterval(() => {
      setCurrentItemIndex((prev) => (prev + 1) % carouselItems.length);
    }, 8000);
    return () => clearInterval(carouselTimer);
  }, [carouselItems.length]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const currentItem = carouselItems[currentItemIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl space-y-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column: Timer & Progress */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col justify-center bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-xl">
              <CardContent className="text-center p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PenTool className="w-8 h-8 text-white" />
                </div>
                <p className="text-slate-800 text-lg font-medium mb-2">
                  Generating Articles
                </p>
                <div className="text-6xl font-bold text-green-600 mb-4">
                  {formatTime(elapsedTime)}
                </div>
                <p className="text-sm text-slate-700 mb-4">
                  {currentStep}
                </p>
                <div className="max-w-xs mx-auto space-y-2">
                  <Progress value={progress} className="h-2 bg-slate-200" />
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-700">Progress</span>
                    <span className="font-semibold text-green-600">{progress}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Carousel */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-xl overflow-hidden">
              <CardContent className="flex-1 flex flex-col justify-center items-center p-8 relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentItemIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="w-full text-center"
                  >
                    {currentItem?.type === 'quote' ? (
                      <div className="flex flex-col items-center justify-center h-full min-h-[250px]">
                        <blockquote className="text-2xl italic text-slate-800 font-medium max-w-md">
                          "{currentItem.content}"
                        </blockquote>
                      </div>
                    ) : currentItem?.type === 'thank_you' ? (
                      <div className="flex flex-col items-center justify-center h-full min-h-[250px]">
                        <img
                          src={currentItem?.content?.logo}
                          alt={`${currentItem?.content?.name} Logo`}
                          className="w-32 h-32 rounded-full shadow-md mb-4"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <p className="text-lg text-slate-900 font-semibold mt-1">
                          {currentItem?.content?.tagline}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full min-h-[250px]">
                        <img
                          src={currentItem?.content?.logo}
                          alt={`${currentItem?.content?.name} Logo`}
                          className="w-32 h-32 rounded-full shadow-md mb-1"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <p className="text-lg text-slate-900 font-semibold mt-1 mb-4">
                          "{currentItem?.content?.tagline}"
                        </p>
                        <a
                          href={currentItem?.content?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors duration-300 shadow-md hover:shadow-lg"
                        >
                          Visit Website
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
                
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex justify-center gap-2">
                  {carouselItems.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentItemIndex ? 'bg-green-600 scale-125' : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Selected Topics Summary */}
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
          <CardContent className="p-4">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green-600" />
              Generating {selectedTopics.length} Article{selectedTopics.length > 1 ? 's' : ''}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedTopics.map((topic, index) => (
                <div key={index} className="text-sm bg-slate-50 rounded-lg p-3">
                  <div className="font-medium text-slate-900">{topic.title}</div>
                  <div className="text-slate-700 text-xs mt-1">
                    {topic.recommended_length} | {(topic.target_keywords || []).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
          <div className="flex items-center justify-center gap-2 text-green-700 mb-1">
            <Clock className="w-4 h-4" />
            <span className="font-medium text-sm">Please keep this window open while articles are being generated.</span>
          </div>
          <p className="text-xs text-green-800">
            This process creates comprehensive, SEO-optimized content and typically takes 2-4 minutes per article.
          </p>
        </div>
      </motion.div>
    </div>
  );
}