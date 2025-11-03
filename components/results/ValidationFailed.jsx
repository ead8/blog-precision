"use client"


import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, ExternalLink, Loader2 } from 'lucide-react';
import { Analysis } from '@/lib/entities';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/lib/utils-router';
import { motion } from 'framer-motion';

export default function ValidationFailed({ validationResult, analysisId }) {
  const router = useRouter();
  const [updatedUrls, setUpdatedUrls] = useState({});
  const [isRetrying, setIsRetrying] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Extract issues from validationResult (only show failing sites)
  const issues = validationResult?.issues || [];

  const handleUrlChange = (siteKey, value) => {
    setUpdatedUrls(prev => ({ ...prev, [siteKey]: value }));
    if (errors[siteKey]) {
      setErrors(prev => ({ ...prev, [siteKey]: null }));
    }
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleRetry = async () => {
    const newErrors = {};
    let hasError = false;

    // Validate only the URLs that have been changed
    for (const siteKey in updatedUrls) {
      if (!updatedUrls[siteKey]) {
        newErrors[siteKey] = "Please enter a new URL.";
        hasError = true;
      } else if (!validateUrl(updatedUrls[siteKey])) {
        newErrors[siteKey] = "Please enter a valid URL.";
        hasError = true;
      }
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    if (Object.keys(updatedUrls).length === 0) {
      setErrors({ general: "You must provide at least one new URL to retry." });
      return;
    }

    setIsRetrying(true);

    try {
      // Only update the URLs that were changed and reset status
      const updateData = {
        ...updatedUrls,
        status: 'pending', // Reset to pending so it can be reprocessed
        progress: 0,
      };
      
      console.log('[ValidationFailed] Updating analysis with:', updateData);
      
      await Analysis.update(analysisId, updateData);
      
      // Slight delay to ensure DB update completes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to newanalysis page with retry_id to re-trigger the analysis
      router.push(createPageUrl(`newanalysis?retry_id=${analysisId}`));
    } catch (error) {
      console.error("[ValidationFailed] Failed to retry analysis:", error);
      setErrors({ general: `Failed to update analysis: ${error.message}. Please try again.` });
      setIsRetrying(false);
    }
  };
  
  const siteKeyToLabel = {
      'client_url': 'Your Blog',
      'competitor_url': 'Direct Competitor 1',
      'competitor_url_2': 'Direct Competitor 2', // Added for second competitor
      'industry_leader_url': 'Industry Leader'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-red-50/50 border border-red-200 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <CardTitle className="text-2xl font-bold text-red-900">
                Insufficient Content Found
              </CardTitle>
              <p className="text-red-700">
                The analysis was paused because one or more sites have too few blog posts.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive" className="bg-white">
            <AlertTitle>Action Required</AlertTitle>
            <AlertDescription>
              For a meaningful analysis, each website should have at least 5 blog posts. Please provide a new URL for the sites listed below.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {issues.map(issue => (
              <div key={issue.siteKey} className="p-4 border bg-white rounded-lg">
                <h3 className="font-semibold text-slate-800">{siteKeyToLabel[issue.siteKey]}</h3>
                <p className="text-sm text-slate-500">
                  Original URL: <a href={issue.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{issue.url}</a>
                </p>
                <p className="text-sm font-bold text-red-600">Only {issue.count} post(s) found.</p>

                <div className="mt-3">
                  <Label htmlFor={issue.siteKey} className="text-slate-700">Enter Replacement URL:</Label>
                  <div className="relative mt-1">
                     <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id={issue.siteKey}
                      placeholder="https://new-example.com/blog"
                      value={updatedUrls[issue.siteKey] || ''}
                      onChange={(e) => handleUrlChange(issue.siteKey, e.target.value)}
                      className={`pl-10 ${errors[issue.siteKey] ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors[issue.siteKey] && <p className="text-red-600 text-sm mt-1">{errors[issue.siteKey]}</p>}
                </div>
              </div>
            ))}
          </div>

          {errors.general && <p className="text-red-600 text-sm text-center">{errors.general}</p>}

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3"
            >
              {isRetrying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Update URL(s) & Retry Analysis
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
