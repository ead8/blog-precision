"use client"

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Analysis, Recommendation, Article } from "@/lib/entities";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { createPageUrl } from "@/lib/utils-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Loader2, AlertCircle, RefreshCw, Trash2, Clock } from "lucide-react";
import { motion } from "framer-motion";

import ResultsHeader from "@/components/results/ResultsHeader";
import RecommendationsGrid from "@/components/results/RecommendationsGrid";
import AnalysisSummary from "@/components/results/AnalysisSummary";
import ValidationFailed from "@/components/results/ValidationFailed";
import WritingServiceOffer from "@/components/writing/WritingServiceOffer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AnalysisProgress from "@/components/results/AnalysisProgress";

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const writingServiceRef = useRef(null);

  const [analysis, setAnalysis] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const analysisId = searchParams.get('id');

  const loadCompletedAnalysis = useCallback(async (id) => {
    if (!id) return;
    try {
      const [analysisData, recs, arts] = await Promise.all([
        Analysis.get(id),
        Recommendation.filter({ analysis_id: id }, 'priority_rank'),
        Article.filter({ analysis_id: id })
      ]);
      setAnalysis(analysisData);
      setRecommendations(Array.isArray(recs) ? recs : []);
      setArticles(Array.isArray(arts) ? arts : []);
    } catch (err) {
      console.error("Error loading completed analysis data:", err);
      setError("Failed to load completed analysis data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (analysisId) {
      loadCompletedAnalysis(analysisId);
    } else {
      setError("No analysis ID found in URL.");
      setIsLoading(false);
    }
  }, [analysisId, loadCompletedAnalysis]);

  const handleRequestWriting = (selectedTopics) => {
    const topicsParam = encodeURIComponent(JSON.stringify(selectedTopics.map(t => ({
      id: t.id, title: t.title, description: t.description, target_keywords: t.target_keywords, recommended_length: t.recommended_length, why_this_works: t.why_this_works
    }))));
    router.push(createPageUrl(`ArticleGeneration?analysis=${analysis.id}&topics=${topicsParam}`));
  };

  const scrollToWritingService = () => {
    if (!writingServiceRef.current) return;
    writingServiceRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!analysis) return;
    try {
      await Analysis.delete(analysis.id);
      setIsDeleteDialogOpen(false);
      router.push(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Failed to delete analysis:", error);
      // Optionally, show an error to the user
      alert("Failed to delete analysis. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-slate-800 font-semibold">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="text-center bg-white/80 p-8 rounded-xl shadow-xl">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-slate-800 mb-4 max-w-md">{error}</p>
          <Button onClick={() => router.push(createPageUrl("Dashboard"))}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }
  
  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="text-center bg-white/80 p-8 rounded-xl shadow-xl">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Analysis Not Found</h2>
          <p className="text-slate-800 mb-4">The requested analysis could not be found.</p>
          <Button onClick={() => router.push(createPageUrl("Dashboard"))}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const validationResult = analysis.analysis_results?.validation_result;
  if (validationResult?.is_valid === false) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 md:p-8 flex items-center justify-center">
            <ValidationFailed validationResult={validationResult} analysisId={analysis.id} />
        </div>
    );
  }
  
  // Handle in-progress analysis, including "stuck" ones
  if (analysis.status === 'analyzing' || analysis.status === 'setup') {
    const analysisAgeInMinutes = (Date.now() - new Date(analysis.created_date).getTime()) / (1000 * 60);
    const STUCK_THRESHOLD_MINUTES = 30; // If older than 30 mins, assume it's stuck

    if (analysisAgeInMinutes > STUCK_THRESHOLD_MINUTES) {
      // It's an old, "stuck" analysis.
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
            <div className="text-center bg-white/80 p-8 rounded-xl shadow-xl max-w-lg">
                <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Analysis Incomplete</h2>
                <p className="text-slate-700 mb-6">
                    This analysis was started but did not complete, likely because the browser window was closed.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                    <Button onClick={() => router.push(createPageUrl(`newanalysis?retry_id=${analysis.id}`))}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Analysis
                    </Button>
                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Analysis
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Are you sure?</DialogTitle>
                          <DialogDescription>
                            This will permanently delete this incomplete analysis. This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                          <Button variant="destructive" onClick={handleDelete}>Confirm Delete</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                </div>
                 <Button variant="link" onClick={() => router.push(createPageUrl("Dashboard"))} className="mt-4 text-slate-600">
                    Back to Dashboard
                </Button>
            </div>
        </div>
      );
    }

    // It's a recent analysis, show the progress screen.
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <Button variant="outline" size="sm" onClick={() => router.push(createPageUrl("Dashboard"))} className="mb-6 hover:bg-slate-100">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>
                <AnalysisProgress analysis={analysis} startTime={new Date(analysis.created_date).getTime()} />
            </div>
        </div>
    );
  }

  // Handle failed analysis
  if (analysis.status === 'failed') {
      return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
              <div className="text-center bg-white/80 p-8 rounded-xl shadow-xl max-w-lg">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-red-800 mb-2">Analysis Failed</h2>
                  <p className="text-slate-800 mb-6">
                      We're sorry, but an unexpected error occurred during the analysis. You can try running it again.
                  </p>
                  <div className="bg-red-50 border border-red-200 p-4 rounded-md text-left text-sm text-red-900">
                    <strong>Last known step:</strong> {analysis.analysis_results?.current_step || 'Unknown'}
                  </div>
                   <div className="mt-6 flex justify-center gap-4">
                      <Button variant="outline" onClick={() => router.push(createPageUrl("Dashboard"))}>
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back to Dashboard
                      </Button>
                  </div>
              </div>
          </div>
      );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="outline" size="sm" onClick={() => router.push(createPageUrl("Dashboard"))} className="mb-6 hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          {analysis.status === 'completed' && <ResultsHeader analysis={analysis} />}
        </motion.div>

        {analysis.status === 'completed' && (
          <div className="space-y-8">
            <AnalysisSummary analysis={analysis} recommendations={recommendations} />
            <RecommendationsGrid recommendations={recommendations} analysisId={analysis.id} onScrollToWriter={scrollToWritingService} />
            <div ref={writingServiceRef}>
              <WritingServiceOffer analysis={analysis} recommendations={recommendations} onRequestWriting={handleRequestWriting} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Results() {
    return (
        <ProtectedRoute>
            <ResultsContent />
        </ProtectedRoute>
    );
}
