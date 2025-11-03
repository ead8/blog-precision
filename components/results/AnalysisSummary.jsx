import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, Lightbulb, BarChart3, Search, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function AnalysisSummary({ analysis, recommendations }) {
  const summary = analysis?.analysis_results?.summary || {};
  // FIX: Ensure discovery_summary is safely accessed, defaulting to an empty object.
  const discoveryInfo = analysis?.analysis_results?.discovery_summary || {};
  const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];
  
  // Calculate total blog posts analyzed - only if data is available
  const clientPosts = discoveryInfo.client_posts_found || 0;
  const competitorPosts = discoveryInfo.competitor_posts_found || 0;
  const competitor2Posts = discoveryInfo.competitor_2_posts_found || 0; // Added for Competitor 2
  const leaderPosts = discoveryInfo.leader_posts_found || 0;
  const totalPostsAnalyzed = clientPosts + competitorPosts + competitor2Posts + leaderPosts;
  
  // FIX: Strengthened the condition to ensure discovery info exists before showing the summary.
  // This prevents rendering with incomplete data that could cause a crash.
  const hasDiscoveryData = analysis?.status === 'completed' && totalPostsAnalyzed > 0 && discoveryInfo.google_search_used;

  return (
    <div className="space-y-8">
      {/* Prominent Total Posts Counter - only show when data is loaded */}
      {hasDiscoveryData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="py-12"
        >
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
            <CardContent className="flex items-center justify-center gap-6 md:gap-8 p-8">
              <div className="flex-shrink-0 w-28 h-28 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-4xl font-bold">
                  {totalPostsAnalyzed}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 text-left">
                Blog Posts Were
                <br />
                Analyzed
              </h2>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Discovery Summary - only show when we have meaningful data */}
      {hasDiscoveryData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-blue-900 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Enhanced Discovery Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {clientPosts}
                  </div>
                  <p className="text-blue-700">Your blog posts analyzed</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {competitorPosts}
                  </div>
                  <p className="text-blue-700">Competitor 1 posts</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {competitor2Posts}
                  </div>
                  <p className="text-blue-700">Competitor 2 posts</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {leaderPosts}
                  </div>
                  <p className="text-blue-700">Leader posts analyzed</p>
                </div>
              </div>
              <p className="text-blue-800 text-sm mt-4 text-center">
                ✓ Used advanced Google search to ensure comprehensive content discovery
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}