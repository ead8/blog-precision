"use client"


import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Search, FileText, Target, Clock, Bot, Check, ExternalLink, PenTool, Lightbulb } from "lucide-react";

const ANALYSIS_STAGES = [
  { label: "Identifying sources", threshold: 10, icon: Search },
  { label: "Extracting articles", threshold: 40, icon: FileText },
  { label: "Analyzing themes", threshold: 50, icon: Bot },
  { label: "Finding opportunities", threshold: 70, icon: Target },
  { label: "Generating ideas", threshold: 90, icon: Zap },
  { label: "Finalizing", threshold: 100, icon: Check }
];

const WRITING_STAGES = [
  { label: "Setting up", threshold: 10, icon: PenTool },
  { label: "Researching topics", threshold: 30, icon: Search },
  { label: "Writing content", threshold: 60, icon: FileText },
  { label: "Optimizing SEO", threshold: 80, icon: Target },
  { label: "Final review", threshold: 95, icon: Lightbulb },
  { label: "Complete", threshold: 100, icon: Check }
];

const SEO_QUOTES = [
  "Content is king, but engagement is queen, and the lady rules the house!",
  "The best place to hide a dead body is the second page of Google search results.",
  "SEO is a marathon, not a sprint.",
  "Good SEO work only gets better over time. It's only search engine tricks that need to keep changing.",
  "Content is fire, social media is gasoline.",
  "Your website is your digital storefront. Make sure it's always open for business.",
  "SEO is not about gaming the system anymore; it's about learning how to play by the rules.",
  "Content marketing is like a first date. If all you do is talk about yourself, there won't be a second one.",
  "The aim of marketing is to know and understand the customer so well the product or service fits perfectly.",
  "Quality content means that people want to share your content and link to your content.",
  "SEO is a lot like a relationship. It requires patience, care, effort, and time to see results.",
  "Don't optimize for conversions, optimize for conversion opportunities.",
  "The Internet has made customer service a strategic weapon, not just a cost center.",
  "Build something 100 people love, not something 1 million people kind of like.",
  "Focus on the user and all else will follow.",
  "The best marketing doesn't feel like marketing.",
  "Content is anything that adds value to the reader's life.",
  "SEO without great content is like a body without a soul.",
  "Your brand is what other people say about you when you're not in the room.",
  "Stop selling. Start helping.",
  "Marketing is no longer about the stuff you make, but about the stories you tell.",
  "The currency of the new economy is trust, and trust is built through content.",
  "Don't find customers for your products, find products for your customers.",
  "People don't buy products, they buy better versions of themselves.",
  "The goal is not to be perfect by the end. The goal is to be better today.",
  "Content builds relationships. Relationships are built on trust. Trust drives revenue.",
  "SEO is not about being found for what you do, but for what you solve.",
  "In marketing: when in doubt, always go back to the fundamentals.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Every piece of content should have a purpose and drive toward an action."
];

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

// Create a strictly alternating list of carousel items with randomized quotes
const createCarouselItems = () => {
  const blogPrecisionItem = {
    type: 'thank_you',
    content: {
      name: "BlogPrecision",
      logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b3d8ac0857424eb77e380e/0d754e115_BlogPrecisionroundlogo.png",
      tagline: "Thank you for using BlogPrecision, we appreciate your confidence in us",
    }
  };

  const shuffledQuotes = [...SEO_QUOTES].sort(() => Math.random() - 0.5);
  const alternatingItems = [];
  
  // Create alternating pattern: quote, advert, quote, advert...
  for (let i = 0; i < shuffledQuotes.length; i++) {
    alternatingItems.push({ type: 'quote', content: shuffledQuotes[i] });
    const advert = BUSINESS_ADVERTS[i % BUSINESS_ADVERTS.length];
    alternatingItems.push({ type: 'advert', content: advert });
  }
  
  return [blogPrecisionItem, ...alternatingItems];
};

export default function AnalysisProgress({ analysis, startTime, title = "Analysis in Progress", isWriting = false }) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [carouselItems] = useState(() => createCarouselItems());

  // Ensure progress is a number between 0-100 for proper rendering
  const currentProgress = Math.max(0, Math.min(100, Number(analysis?.progress) || 0));
  const progressStages = isWriting ? WRITING_STAGES : ANALYSIS_STAGES;
  
  // Use state to track displayed progress and sync it with currentProgress
  const [displayProgress, setDisplayProgress] = useState(currentProgress);
  
  // Sync displayProgress with currentProgress, but NEVER allow it to decrease (monotonic)
  useEffect(() => {
    console.log(`[AnalysisProgress] currentProgress changed: ${currentProgress}, displayProgress: ${displayProgress}`);
    // Only update if currentProgress is greater than displayProgress (monotonic - never decrease)
    if (currentProgress > displayProgress) {
      console.log(`[AnalysisProgress] Updating displayProgress: ${displayProgress} -> ${currentProgress} (monotonic update)`);
      setDisplayProgress(currentProgress);
    } else if (currentProgress < displayProgress) {
      // Log when we reject a backward update (stale data from DB)
      console.log(`[AnalysisProgress] Rejecting backward update: ${currentProgress} < ${displayProgress} (keeping ${displayProgress}%)`);
    }
  }, [currentProgress, displayProgress]);

  // Debug: Log progress changes
  useEffect(() => {
    console.log('[AnalysisProgress] Progress updated:', {
      progress: currentProgress,
      displayProgress: displayProgress,
      status: analysis?.status,
      step: analysis?.analysis_results?.current_step,
      analysisRecord: analysis // Log full record to see what we're getting
    });
  }, [currentProgress, displayProgress, analysis?.status, analysis?.analysis_results?.current_step, analysis]);
  
  // Debug: Log when Progress component receives props
  useEffect(() => {
    console.log(`[AnalysisProgress] Passing value ${displayProgress} to Progress component`);
  }, [displayProgress]);

  useEffect(() => {
    if (!startTime) {
        setElapsedTime(0);
        return;
    }

    const startTimestamp = new Date(startTime).getTime();
    
    if (isNaN(startTimestamp)) {
      console.error("Invalid start time provided to AnalysisProgress:", startTime);
      setElapsedTime(0);
      return;
    }

    const timer = setInterval(() => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startTimestamp) / 1000));
      setElapsedTime(elapsed);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    const carouselTimer = setInterval(() => {
      setCurrentItemIndex((prev) => (prev + 1) % carouselItems.length);
    }, 12000); // Rotate every 12 seconds
    return () => clearInterval(carouselTimer);
  }, [carouselItems.length]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const currentItem = carouselItems[currentItemIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6 w-full"
    >
      <p className="text-center text-sm font-medium text-slate-900">
          {isWriting 
            ? "Please keep this window open while articles are being written (2-6 minutes per topic)."
            : "Please keep this window open while the analysis runs (this can take 1-6 minutes)."
          }
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Timer */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col justify-center bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-xl">
            <CardContent className="text-center p-8">
              <p className="text-slate-800 text-lg font-medium mb-2">
                {title}
              </p>
              <div className="text-7xl font-bold text-blue-600 mb-4">
                {formatTime(elapsedTime)}
              </div>
              <div className="max-w-xs mx-auto space-y-2 mt-4">
                <Progress 
                  value={displayProgress} 
                  className="h-2" 
                />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-700">Overall Progress</span>
                  <span className="font-semibold text-blue-600">{Math.round(displayProgress)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Carousel */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-xl overflow-hidden">
            <CardContent className="flex-1 flex col justify-center items-center p-8 relative">
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
                      <p className="text-xs text-slate-700 mt-3 font-semibold">
                        (Opens in a new tab, your process is safe)
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
              
              {/* Carousel Indicators have been removed */}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Progress Stages */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {progressStages.map((stage) => {
              const IconComponent = stage.icon;
              const isCompleted = displayProgress >= stage.threshold;
              
              return (
                <div key={stage.label} className={`text-center p-3 rounded-lg transition-all duration-300 ${
                    isCompleted ? "bg-green-50" : "bg-slate-50"
                  }`}>
                  <div className={`mx-auto w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                      isCompleted ? "bg-green-100 text-green-600" : "bg-slate-200 text-slate-500"
                    }`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <p className={`text-xs font-medium ${
                      isCompleted ? "text-green-800" : "text-slate-600"
                    }`}>
                    {stage.label}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
    </motion.div>
  );
}
