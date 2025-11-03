"use client"


import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { 
  Building, 
  Users, 
  Award, 
  MessageSquare, 
  ArrowLeft, 
  Send,
  AlertCircle,
  FileText,
  Target,
  Link2
} from "lucide-react";

export default function WritingRequestForm({ 
  selectedTopics, 
  analysis, 
  onBack, 
  onSubmit,
  isSubmitting = false 
}) {
  const [formData, setFormData] = useState({
    companyName: '',
    authorityInfo: '',
    teamCredentials: '',
    additionalNotes: '',
    internalLinks: ['', '']
  });
  const [errors, setErrors] = useState({});

  const allSelectedKeywords = [...new Set(selectedTopics.flatMap(t => t.target_keywords || []))];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleInternalLinkChange = (index, value) => {
    const newLinks = [...formData.internalLinks];
    newLinks[index] = value;
    setFormData(prev => ({ ...prev, internalLinks: newLinks }));
    if (errors.internalLinks?.[index]) {
      const newLinkErrors = [...(errors.internalLinks || [])];
      newLinkErrors[index] = null;
      setErrors(prev => ({...prev, internalLinks: newLinkErrors}));
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }
    if (!formData.authorityInfo.trim()) {
      newErrors.authorityInfo = "Authority information is required for E-E-A-T";
    }
    if (!formData.teamCredentials.trim()) {
      newErrors.teamCredentials = "Team credentials are required";
    }

    const linkErrors = [];
    formData.internalLinks.forEach((link, index) => {
      if (link && !validateUrl(link)) {
        linkErrors[index] = 'Please enter a valid URL';
      } else {
        linkErrors[index] = null; // Clear error if valid or empty
      }
    });

    if (linkErrors.some(e => e)) {
      newErrors.internalLinks = linkErrors;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0 || (Object.keys(newErrors).length === 1 && newErrors.internalLinks)) {
      // If no errors, or only internal link errors that are null/empty, proceed.
      // Filter out only valid, non-null errors.
      const hasRealErrors = Object.keys(newErrors).some(key => {
        if (key === 'internalLinks') {
          return newErrors.internalLinks.some(error => error !== null);
        }
        return newErrors[key] !== null;
      });

      if (!hasRealErrors) {
        onSubmit({
          ...formData,
          selectedTopics,
          internalLinks: formData.internalLinks.filter(link => link.trim() !== '')
        });
      }
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
            Article Writing Request
          </CardTitle>
          <p className="text-slate-800">
            Help us create high-quality, authoritative content for your selected topics
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selected Topics Summary */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Selected Topics ({selectedTopics.length})
              </h3>
              <div className="space-y-2">
                {selectedTopics.map((topic, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium text-slate-900">{topic.title}</div>
                    <div className="text-slate-700 text-xs mt-1">
                      Keywords: {(topic.target_keywords || []).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <Building className="w-4 h-4 text-blue-600" />
                Company Name
              </Label>
              <Input
                placeholder="e.g., Microsoft, ABC Construction Ltd"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className={errors.companyName ? "border-red-300 focus:border-red-500" : ""}
              />
              {errors.companyName && (
                <p className="text-red-600 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.companyName}
                </p>
              )}
            </div>

            {/* Authority Information */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <Award className="w-4 h-4 text-yellow-600" />
                Company & Authority Information
              </Label>
              <Textarea
                placeholder="e.g., Bill Gates, CEO of Microsoft with 40+ years of technology experience. Our company has been serving businesses since 1995..."
                value={formData.authorityInfo}
                onChange={(e) => handleInputChange('authorityInfo', e.target.value)}
                className={`h-24 ${errors.authorityInfo ? "border-red-300 focus:border-red-500" : ""}`}
              />
              {errors.authorityInfo && (
                <p className="text-red-600 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.authorityInfo}
                </p>
              )}
              <p className="text-sm text-slate-700">
                This builds E-E-A-T credibility. Include key people, years of experience, achievements, certifications.
              </p>
            </div>

            {/* Team Credentials */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <Users className="w-4 h-4 text-green-600" />
                Team Credentials
              </Label>
              <Textarea
                placeholder="e.g., 150 years combined industry experience across our team. Certified professionals with advanced qualifications in..."
                value={formData.teamCredentials}
                onChange={(e) => handleInputChange('teamCredentials', e.target.value)}
                className={`h-20 ${errors.teamCredentials ? "border-red-300 focus:border-red-500" : ""}`}
              />
              {errors.teamCredentials && (
                <p className="text-red-600 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.teamCredentials}
                </p>
              )}
              <p className="text-sm text-slate-700">
                Team qualifications, combined experience, certifications that establish expertise.
              </p>
            </div>

            {/* Additional Notes */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                Additional Notes (Optional)
              </Label>
              <Textarea
                placeholder="Any specific requirements, tone preferences, or additional context for the articles..."
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                className="h-20"
              />
            </div>

            {/* Internal Links */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <Link2 className="w-4 h-4 text-indigo-600" />
                Internal Links (Optional)
              </Label>
              <p className="text-sm text-slate-700">
                Provide up to two links to other pages on your website to include in the article.
              </p>
              <div className="space-y-2">
                {[0, 1].map(index => (
                  <div key={index}>
                    <Input
                      placeholder={`https://yourwebsite.com/page-${index + 1}`}
                      value={formData.internalLinks[index]}
                      onChange={(e) => handleInternalLinkChange(index, e.target.value)}
                      className={errors.internalLinks?.[index] ? "border-red-300 focus:border-red-500" : ""}
                    />
                    {errors.internalLinks?.[index] && (
                      <p className="text-red-600 text-sm flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.internalLinks[index]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis Data Summary */}
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>From Your Analysis:</strong> Articles will be optimized for your selected keywords ({allSelectedKeywords.join(', ')}), 
                written for a {analysis?.target_audience?.replace(/_/g, ' ')} audience, and localized for {analysis?.target_location}.
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isSubmitting}
                className="px-8 py-3"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 font-semibold"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Request Articles
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
