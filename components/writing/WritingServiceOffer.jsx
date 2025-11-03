"use client"


import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { PenTool, CheckCircle, Send } from "lucide-react"; // Removed Sparkles import

export default function WritingServiceOffer({ analysis, recommendations, onRequestWriting }) {
  // Fix: Initialize selectedTopics as an empty array.
  // This ensures that no topics are pre-selected by default when the component mounts.
  const [selectedTopics, setSelectedTopics] = useState([]);

  // Fix: Synchronize selected topics with current recommendations when recommendations change.
  // This ensures that if recommendations are added or removed, selectedTopics only contains valid IDs.
  useEffect(() => {
    const currentRecommendationIds = new Set((recommendations || []).map(r => r.id));
    setSelectedTopics(prevSelected =>
      prevSelected.filter(id => currentRecommendationIds.has(id))
    );
  }, [recommendations]);

  // --- ADDED: Sorting logic to match the RecommendationsGrid component ---
  const sortRecommendations = (recs) => {
    if (!recs) return [];
    const opportunityValues = { 'high': 3, 'medium': 2, 'low': 1 };
    const competitionValues = { 'very_low': 4, 'low': 3, 'medium': 2, 'high': 1 };
    
    return [...recs].sort((a, b) => {
      const aScore = (opportunityValues[a.opportunity_score] || 0) * 10 + (competitionValues[a.competition_level] || 0);
      const bScore = (opportunityValues[b.opportunity_score] || 0) * 10 + (competitionValues[b.competition_level] || 0);
      return bScore - aScore;
    });
  };

  const sortedRecommendations = sortRecommendations(recommendations);

  const handleSelectAll = (checked) => {
    if (checked) {
      // UPDATED: Use sorted recommendations
      setSelectedTopics((sortedRecommendations || []).map(r => r.id));
    } else {
      setSelectedTopics([]);
    }
  };

  const handleTopicSelect = (topicId) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleSubmit = () => {
    // This correctly filters from the original list, which is fine as it's based on ID.
    const topicsToWrite = (recommendations || []).filter(r => selectedTopics.includes(r.id));
    onRequestWriting(topicsToWrite);
  };

  const count = selectedTopics.length;
  const freeArticles = Math.floor(count / 6) * 2;
  const paidArticles = count - freeArticles;
  const totalCost = paidArticles * 9.95;

  // Ensure recommendations array is handled defensively for calculations
  const actualRecommendationsLength = (recommendations || []).length;
  const isAllSelected = selectedTopics.length === actualRecommendationsLength && actualRecommendationsLength > 0;
  const isIndeterminate = selectedTopics.length > 0 && selectedTopics.length < actualRecommendationsLength;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-xl overflow-hidden">
        <div className="bg-orange-500 p-8 text-black">
          <CardHeader className="p-0">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/30 p-3 rounded-full">
                <PenTool className="w-6 h-6" />
              </div>
              <CardTitle className="text-3xl font-bold">
                AI Article Generation Available
              </CardTitle>
            </div>
            <p className="max-w-3xl font-medium text-black">
              Turn these recommendations into high-quality, SEO-friendly articles. Let our AI writing assistant do the heavy lifting for you.
            </p>
          </CardHeader>
        </div>

        <div className="p-8 border-b border-slate-200/60 bg-white">
          <div className="flex items-center space-x-4">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b3d8ac0857424eb77e380e/1c38ed4f1_SpecialOffericon.jpg" 
              alt="Special Offer"
              className="w-20 h-20 flex-shrink-0"
            />
            <div>
              <p className="font-bold text-black text-lg">
                Get 2 Articles FREE — Choose 6, Pay for 4. Save $19.90 (33% off), applied automatically at checkout.
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-8 grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900">Why Use Our AI Writer?</h3>
            <ul className="space-y-3 text-slate-800">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-900">Human-Like Quality</h4>
                  <p className="text-slate-900">We've engineered our AI to write with a natural flow and depth that engages real readers. By infusing your unique company data and credentials, the articles develop a credible voice that stands far apart from soulless, robotic content.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-900">Google E-E-A-T Optimized Content</h4>
                  <p className="text-slate-900">Articles are infused with your company's authority and team credentials to build trust.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-900">Flexible Topic Selection</h4>
                  <p className="text-slate-900">Choose one, some, or all of our recommendations to be written for you.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-900">Ready in Minutes</h4>
                  <p className="text-slate-900">Get high-quality articles generated in just a few minutes.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-900">100% Money-Back Guarantee</h4>
                  <p className="text-slate-900">Get a full refund if you are not happy with the quality of your article.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Select Topics to Write</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b">
                <Checkbox
                  id="select-all"
                  checked={isAllSelected ? true : (isIndeterminate ? "indeterminate" : false)}
                  onCheckedChange={handleSelectAll}
                  disabled={actualRecommendationsLength === 0} // Disable select all if no recommendations
                />
                <label htmlFor="select-all" className="font-medium text-slate-800">
                  Select All
                </label>
              </div>
              {/* UPDATED: Map over sortedRecommendations instead of recommendations */}
              {(sortedRecommendations || []).map(rec => (
                <div key={rec.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`topic-${rec.id}`}
                    checked={selectedTopics.includes(rec.id)}
                    onCheckedChange={() => handleTopicSelect(rec.id)}
                  />
                  <label htmlFor={`topic-${rec.id}`} className="text-slate-700">
                    {rec.title}
                  </label>
                </div>
              ))}
            </div>

            {selectedTopics.length > 0 && (
              <div className="mt-6 space-y-2 border-t border-slate-200 pt-4">
                <div className="flex justify-between items-center text-slate-800">
                  <span className="font-medium">Price per article:</span>
                  <span className="font-bold">$9.95</span>
                </div>
                
                {freeArticles > 0 && (
                  <div className="flex justify-between items-center text-green-600 font-medium">
                    <span>"Buy 4, Get 2" Discount:</span>
                    <span className="font-bold">- ${((freeArticles * 9.95)).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-lg text-slate-900">
                  <span className="font-bold">Total Cost:</span>
                  <span className="font-extrabold text-green-600">
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={selectedTopics.length === 0}
              className={`w-full ${selectedTopics.length > 0 ? 'mt-4' : 'mt-6'} bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 font-semibold`}
            >
              <Send className="w-4 h-4 mr-2" />
              Continue with {selectedTopics.length} topic(s)
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
