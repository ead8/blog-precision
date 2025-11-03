"use client"


import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ExternalLink, 
  Search, 
  Users, 
  MapPin, 
  Zap,
  Clock,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";

export default function ReviewStep({ data = {}, onSubmit, onBack, isSubmitting }) {
  const getAudienceLabel = (audienceId) => {
    const labels = {
      'beginner': 'Beginner/Novice',
      'intermediate': 'Intermediate',
      'advanced': 'Advanced/Expert',
      'mixed': 'Mixed Audience',
      'general_public': 'General Public',
      'business_decision_makers': 'Business Decision Makers',
      'technical_professionals': 'Technical Professionals',
      'industry_specialists': 'Industry Specialists'
    };
    return labels[audienceId] || audienceId;
  };

  const keywordsArray = Array.isArray(data.keywords) ? data.keywords : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
            Review & Launch Analysis
          </CardTitle>
          <p className="text-slate-900">
            Confirm your analysis settings and launch discovery.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 grid md:grid-cols-2 gap-6">
            {/* Column 1: URLs and Keywords */}
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  Website URLs
                </h3>
                <div className="space-y-2 text-sm pl-4">
                  <p><strong className="text-slate-800">Your Blog:</strong> {data.client_url || 'N/A'}</p>
                  <p><strong className="text-slate-800">Competitor 1:</strong> {data.competitor_url || 'N/A'}</p>
                  <p><strong className="text-slate-800">Competitor 2:</strong> {data.competitor_url_2 || 'N/A'}</p>
                  <p><strong className="text-slate-800">Industry Leader:</strong> {data.industry_leader_url || 'N/A'}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4 text-green-600" />
                  Target Keywords ({keywordsArray.length})
                </h3>
                <div className="flex flex-wrap gap-2 pl-4">
                  {keywordsArray.map((keyword, index) => (
                    <Badge key={index} className="bg-white border border-slate-300 text-slate-800">{keyword}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: Audience and Location */}
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  Target Audience
                </h3>
                <div className="pl-4">
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                    {getAudienceLabel(data.target_audience)}
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  Target Location
                </h3>
                <div className="pl-4">
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {data.target_location || 'Global'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>


          <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <Zap className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>What happens next:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" />
                  Discover blog content via multiple sitemap detection methods
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" />
                  AI-powered competitive content gap analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" />
                  Generate prioritized recommendations tailored to your audience
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Analysis typically takes 3-6 minutes for comprehensive discovery
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
              className="px-8 py-3"
            >
              Back
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 font-semibold"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  Launching...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Launch
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
