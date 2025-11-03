"use client"


import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ClipboardCopy, Printer, TrendingUp, Target, Lightbulb, Search, FileText, Sparkles, PenTool } from "lucide-react";

export default function RecommendationsGrid({ recommendations = [], analysisId, onScrollToWriter }) {
  const [isCopied, setIsCopied] = useState(false);

  // Smart sorting: opportunity score first, then competition level (lower = better)
  const sortRecommendations = (recs) => {
    const opportunityValues = { 'high': 3, 'medium': 2, 'low': 1 };
    const competitionValues = { 'very_low': 4, 'low': 3, 'medium': 2, 'high': 1 };
    
    return [...recs].sort((a, b) => {
      const aScore = (opportunityValues[a.opportunity_score] || 0) * 10 + (competitionValues[a.competition_level] || 0);
      const bScore = (opportunityValues[b.opportunity_score] || 0) * 10 + (competitionValues[b.competition_level] || 0);
      return bScore - aScore;
    });
  };

  const sortedRecommendations = sortRecommendations(recommendations);

  const getOpportunityColor = (score) => {
    switch (score) {
      case 'high': return 'bg-emerald-100 text-emerald-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getCompetitionColor = (level) => {
    switch (level) {
      case 'very_low':
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const handleCopyAll = () => {
    const allResultsText = sortedRecommendations.map((rec, index) => (
`--- Recommendation #${index + 1} ---
Title: ${rec.title}
Opportunity Score: ${rec.opportunity_score}
Competition Level: ${rec.competition_level}
Recommended Length: ${rec.recommended_length} (${rec.length_justification})
Keywords: ${rec.target_keywords.join(', ')}
Why This Works: ${rec.why_this_works}
The Opportunity: ${rec.description}`
    )).join('\n\n');

    navigator.clipboard.writeText(allResultsText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  }
  
  const handlePrint = () => {
    window.print();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Top Content Opportunities</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAll}
          >
            <ClipboardCopy className="w-4 h-4 mr-2" />
            {isCopied ? 'All Results Copied!' : 'Copy All Results'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Results
          </Button>
        </div>
      </div>

      <motion.div
        className="flex justify-start py-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          whileInView={{ rotate: [0, -1, 1, -1, 1, 0] }}
          transition={{
            delay: 0.5,
            duration: 0.4,
            repeat: 2,
            repeatDelay: 0.6,
          }}
          viewport={{ once: true, amount: 0.8 }}
        >
          <Button
            onClick={onScrollToWriter}
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold shadow-lg text-lg px-6 py-3 h-auto transform hover:scale-105 transition-transform duration-300"
          >
            <PenTool className="w-5 h-5 mr-3" />
            WRITE NOW FOR JUST $9.95
          </Button>
        </motion.div>
      </motion.div>


      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedRecommendations.map((recommendation, index) => {
          const isNewDiscovery = recommendation.why_this_works?.startsWith('**NEW CONTENT TERRITORY:**');
          const isHighOpportunity = recommendation.opportunity_score === 'high';

          return (
            <motion.div
              key={recommendation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className={`h-full flex flex-col bg-white/70 backdrop-blur-sm border border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 relative ${isHighOpportunity ? 'border-t-4 border-t-emerald-400' : ''}`}>
                 {isHighOpportunity && (
                  <div className="absolute top-2 right-2 bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 z-10">
                    <TrendingUp className="w-3 h-3" />
                    HIGH POTENTIAL
                  </div>
                )}
                <CardHeader className={isHighOpportunity ? 'pt-10' : ''}>
                  <CardTitle className="text-lg font-bold text-slate-900">{recommendation.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getOpportunityColor(recommendation.opportunity_score || 'medium')}>{(recommendation.opportunity_score || 'medium')} potential</Badge>
                      <Badge className={getCompetitionColor(recommendation.competition_level || 'medium')}>{((recommendation.competition_level || 'medium').replace('_', ' '))} competition</Badge>
                      {isNewDiscovery && (
                        <Badge className="bg-purple-100 text-purple-800"><Sparkles className="w-3 h-3 mr-1" />New Discovery</Badge>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-2 text-sm"><Lightbulb className="w-4 h-4 text-yellow-500" />Why this works</h4>
                      <p className="text-slate-700 text-sm leading-relaxed">
                        {isNewDiscovery ? (
                          <>
                            <span className="font-bold text-purple-600">NEW CONTENT TERRITORY:</span>
                            {recommendation.why_this_works?.replace('**NEW CONTENT TERRITORY:**', '')}
                          </>
                        ) : (
                          recommendation.why_this_works || '—'
                        )}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-2 text-sm"><Target className="w-4 h-4 text-red-500" />The Opportunity</h4>
                      <p className="text-slate-700 text-sm leading-relaxed">{recommendation.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" />Length</h4>
                        <p className="text-slate-700 font-medium">{recommendation.recommended_length || '—'}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-2"><Search className="w-4 h-4 text-purple-500" />Keywords</h4>
                        <p className="text-slate-700">{(recommendation.target_keywords || []).slice(0, 2).join(', ') || '—'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
