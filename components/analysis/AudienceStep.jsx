"use client"


import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  UserCheck, 
  Globe2,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

const AUDIENCE_OPTIONS = [
  {
    id: 'general_public',
    title: 'General Public',
    description: 'Everyday consumers, broad accessibility required',
    icon: Users,
    color: 'text-indigo-600 bg-indigo-100'
  },
  {
    id: 'beginner',
    title: 'Beginner/Novice',
    description: 'No prior knowledge assumed, requires basic explanations',
    icon: GraduationCap,
    color: 'text-green-600 bg-green-100'
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    description: 'Some familiarity with topic, comfortable with moderate complexity',
    icon: Users,
    color: 'text-blue-600 bg-blue-100'
  },
  {
    id: 'advanced',
    title: 'Advanced/Expert',
    description: 'High technical knowledge, appreciates detailed content',
    icon: Users,
    color: 'text-purple-600 bg-purple-100'
  },
  {
    id: 'mixed',
    title: 'Mixed Audience',
    description: 'Broad appeal content accessible to multiple skill levels',
    icon: Globe2,
    color: 'text-orange-600 bg-orange-100'
  },
  {
    id: 'business_decision_makers',
    title: 'Business Decision Makers',
    description: 'C-suite, managers focusing on strategic outcomes',
    icon: Briefcase,
    color: 'text-red-600 bg-red-100'
  }
];

export default function AudienceStep({ data = {}, updateData, onNext, onBack }) {
  const [errors, setErrors] = useState({});

  const { target_audience = 'general_public', target_location = 'Global' } = data || {};

  const handleAudienceSelect = (audienceId) => {
    updateData({ target_audience: audienceId });
    if (errors.audience) {
      setErrors(prev => ({ ...prev, audience: null }));
    }
  };
  
  const handleSubmit = () => {
    const newErrors = {};
    if (!target_audience) {
      newErrors.audience = "Please select a target audience";
    }
    if (!target_location?.trim()) {
      newErrors.location = "Target location is required";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      onNext();
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
            Target Audience & Location
          </CardTitle>
          <p className="text-slate-900">
            Define your target audience and geographic focus for personalized recommendations
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Audience Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Target Audience
            </Label>
            
            <div className="grid md:grid-cols-2 gap-4">
              {AUDIENCE_OPTIONS.map((option) => {
                const IconComponent = option.icon;
                const isSelected = target_audience === option.id;
                
                return (
                  <motion.div
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-slate-200 hover:border-slate-300 bg-white hover:shadow-sm"
                    }`}
                    onClick={() => handleAudienceSelect(option.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${option.color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${
                          isSelected ? "text-blue-900" : "text-slate-900"
                        }`}>
                          {option.title}
                        </h3>
                        <p className={`text-sm mt-1 ${
                          isSelected ? "text-blue-900" : "text-slate-900"
                        }`}>
                          {option.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <UserCheck className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {errors.audience && (
              <p className="text-red-600 text-sm flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.audience}
              </p>
            )}
          </div>

          {/* Location Input - Simple Text Input */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" />
              Target Location
            </Label>
            <Input
              placeholder="e.g., United States, New York, Global"
              value={target_location}
              onChange={(e) => {
                updateData({ target_location: e.target.value });
                if (errors.location) {
                  setErrors(prev => ({ ...prev, location: null }));
                }
              }}
              className={`py-6 text-base ${errors.location ? "border-red-300 focus-visible:ring-red-500" : ""}`}
            />
            
            {errors.location && (
              <p className="text-red-600 text-sm flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.location}
              </p>
            )}
            <p className="text-sm text-slate-900">
              Enter your target geographic location (e.g., "United States", "New York", "Global")
            </p>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>AI-Powered Analysis:</strong> Our system will dynamically analyze search volumes for any location you enter using real Google data, ensuring accurate and current market insights.
            </AlertDescription>
          </Alert>

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={onBack}
              className="px-8 py-3"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3"
            >
              Review
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
