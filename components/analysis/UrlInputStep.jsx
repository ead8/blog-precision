"use client"


import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Globe, Target, Trophy, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function UrlInputStep({ data = {}, updateData, onNext }) {
  const [errors, setErrors] = useState({});

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!data.client_url) {
      newErrors.client_url = "Your blog URL is required";
    } else if (!validateUrl(data.client_url)) {
      newErrors.client_url = "Please enter a valid URL";
    }

    if (!data.competitor_url) {
      newErrors.competitor_url = "Competitor URL is required";
    } else if (!validateUrl(data.competitor_url)) {
      newErrors.competitor_url = "Please enter a valid URL";
    }

    // New validation for second competitor URL
    if (!data.competitor_url_2) {
      newErrors.competitor_url_2 = "Second competitor URL is required";
    } else if (!validateUrl(data.competitor_url_2)) {
      newErrors.competitor_url_2 = "Please enter a valid URL";
    }

    if (!data.industry_leader_url) {
      newErrors.industry_leader_url = "Industry leader URL is required";
    } else if (!validateUrl(data.industry_leader_url)) {
      newErrors.industry_leader_url = "Please enter a valid URL";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  const handleInputChange = (field, value) => {
    updateData({ [field]: value });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
            Website URLs
          </CardTitle>
          <p className="text-slate-900">
            Enter the blog URLs you want to analyze for competitive insights
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Your Blog URL */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <Globe className="w-4 h-4 text-blue-600" />
                Your Blog URL
              </Label>
              <div className="relative">
                <Input
                  placeholder="https://yourblog.com"
                  value={data.client_url || ''}
                  onChange={(e) => handleInputChange('client_url', e.target.value)}
                  className={`pl-4 pr-10 py-3 text-base ${
                    errors.client_url ? "border-red-300 focus:border-red-500" : ""
                  }`}
                />
                <ExternalLink className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              {errors.client_url && (
                <p className="text-red-600 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.client_url}
                </p>
              )}
              <p className="text-sm text-slate-900">
                The primary blog we'll analyze for content gaps and opportunities
              </p>
            </div>

            {/* Competitor URL */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <Target className="w-4 h-4 text-orange-600" />
                Direct Competitor URL
              </Label>
              <div className="relative">
                <Input
                  placeholder="https://competitor.com"
                  value={data.competitor_url || ''}
                  onChange={(e) => handleInputChange('competitor_url', e.target.value)}
                  className={`pl-4 pr-10 py-3 text-base ${
                    errors.competitor_url ? "border-red-300 focus:border-red-500" : ""
                  }`}
                />
                <ExternalLink className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              {errors.competitor_url && (
                <p className="text-red-600 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.competitor_url}
                </p>
              )}
              <p className="text-sm text-slate-900">
                A direct competitor in your industry or niche
              </p>
            </div>

            {/* Second Competitor URL */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <Target className="w-4 h-4 text-orange-600" />
                Second Competitor URL
              </Label>
              <div className="relative">
                <Input
                  placeholder="https://another-competitor.com"
                  value={data.competitor_url_2 || ''}
                  onChange={(e) => handleInputChange('competitor_url_2', e.target.value)}
                  className={`pl-4 pr-10 py-3 text-base ${
                    errors.competitor_url_2 ? "border-red-300 focus:border-red-500" : ""
                  }`}
                />
                <ExternalLink className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              {errors.competitor_url_2 && (
                <p className="text-red-600 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.competitor_url_2}
                </p>
              )}
              <p className="text-sm text-slate-900">
                A second direct competitor for a deeper analysis
              </p>
            </div>

            {/* Industry Leader URL */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <Trophy className="w-4 h-4 text-yellow-600" />
                Industry Leader URL
              </Label>
              <div className="relative">
                <Input
                  placeholder="https://industryleader.com"
                  value={data.industry_leader_url || ''}
                  onChange={(e) => handleInputChange('industry_leader_url', e.target.value)}
                  className={`pl-4 pr-10 py-3 text-base ${
                    errors.industry_leader_url ? "border-red-300 focus:border-red-500" : ""
                  }`}
                />
                <ExternalLink className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              {errors.industry_leader_url && (
                <p className="text-red-600 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.industry_leader_url}
                </p>
              )}
              <p className="text-sm text-slate-900">
                A top-performing blog or thought leader in your industry
              </p>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Tip:</strong> Choose blogs that target similar audiences but have different content strategies. This will give you the best competitive insights.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 text-base font-semibold"
              >
                Continue to Keywords
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
