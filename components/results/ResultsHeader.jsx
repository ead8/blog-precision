
import React from "react";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, Target, Users, MapPin, Search } from "lucide-react";
import LocalizedTimestamp from '@/components/shared/LocalizedTimestamp'; // DEFINITIVE FIX

export default function ResultsHeader({ analysis }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "analyzing": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  // REMOVED old helper function formatLocalDateTime

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Badge className={`${getStatusColor(analysis.status)} border font-medium`}>
          {analysis.status}
        </Badge>
        <div className="flex items-center gap-1 text-sm text-slate-700">
          <Calendar className="w-3 h-3" />
          {/* DEFINITIVE FIX: Use the new robust component */}
          <LocalizedTimestamp dateString={analysis.created_date} />
        </div>
      </div>
      
      <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
        Competitive Analysis Results
      </h1>
      
      <div className="space-y-4 font-semibold text-slate-800">
        <div className="flex flex-col gap-1">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><ExternalLink className="w-4 h-4" />URLs Chosen:</h3>
            <span className="text-sm ml-6"><strong className="text-slate-800">Your Blog:</strong> {new URL(analysis.client_url).hostname}</span>
            <span className="text-sm ml-6"><strong className="text-slate-800">Competitor 1:</strong> {new URL(analysis.competitor_url).hostname}</span>
            {analysis.competitor_url_2 && <span className="text-sm ml-6"><strong className="text-slate-800">Competitor 2:</strong> {new URL(analysis.competitor_url_2).hostname}</span>}
            <span className="text-sm ml-6"><strong className="text-slate-800">Industry Leader:</strong> {new URL(analysis.industry_leader_url).hostname}</span>
        </div>

        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    <span className="font-bold text-slate-900">Target Keywords:</span>
                </div>
                <div className="ml-6 flex flex-wrap gap-2">
                    {analysis.keywords && analysis.keywords.length > 0 ? (
                        analysis.keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                                {keyword}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-slate-800 text-sm">No keywords specified</span>
                    )}
                </div>
            </div>
            
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="font-bold text-slate-900">Target Audience:</span>
                </div>
                <span className="ml-6 text-slate-800 capitalize">{analysis.target_audience?.replace(/_/g, " ")}</span>
            </div>
            
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="font-bold text-slate-900">Target Location:</span>
                </div>
                <span className="ml-6 text-slate-800">{analysis.target_location}</span>
            </div>
        </div>
    </div>
    </div>
  );
}
