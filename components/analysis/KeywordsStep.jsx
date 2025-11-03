"use client"


import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, X, Search, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function KeywordsStep({ data = {}, updateData, onNext, onBack }) {
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [error, setError] = useState(null);

  const keywordsArray = Array.isArray(data.keywords) ? data.keywords : [];

  const addKeyword = () => {
    if (!currentKeyword.trim()) {
      setError("Keyword cannot be empty.");
      return;
    }

    const newKeyword = currentKeyword.trim();
    if (keywordsArray.includes(newKeyword)) {
      setError("This keyword has already been added.");
      return;
    }

    // New limit check
    if (keywordsArray.length >= 6) {
      setError("You can add a maximum of 6 keywords.");
      return;
    }

    updateData({
      keywords: [...keywordsArray, newKeyword]
    });

    setCurrentKeyword('');
    setError(null);
  };

  const removeKeyword = (keywordToRemove) => {
    const updatedKeywords = keywordsArray.filter((k) => k !== keywordToRemove);
    updateData({ keywords: updatedKeywords });
  };

  const handleSubmit = () => {
    if (keywordsArray.length === 0) {
      setError("At least one keyword is required.");
      return;
    }
    onNext();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
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
            Target Keywords
          </CardTitle>
          <p className="text-slate-800">
            Provide up to 6 core keywords for your business or blog
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <Label className="text-sm font-semibold text-slate-800 mb-2 block">
              Add a Keyword
            </Label>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Input
                  placeholder="e.g., content marketing, home renovation"
                  value={currentKeyword}
                  onChange={(e) => {
                    setCurrentKeyword(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyPress={handleKeyPress}
                  className={`pl-10 ${error ? "border-red-300" : ""}`}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              <Button
                type="button"
                onClick={addKeyword}
                disabled={keywordsArray.length >= 6}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Keyword
              </Button>
            </div>
            {error && (
              <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800">
              Added Keywords ({keywordsArray.length}/6)
            </h3>
            <AnimatePresence>
              {keywordsArray.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {keywordsArray.map((keyword, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Badge className="text-base py-1 px-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50">
                        {keyword}
                        <button
                          onClick={() => removeKeyword(keyword)}
                          className="ml-2 rounded-full hover:bg-red-100 text-slate-500 hover:text-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-800">
                  <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>No keywords added yet</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>How this works:</strong> Provide your core keywords and our AI will analyze their search volumes and competitive landscape to find the best content opportunities for you.
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
              Continue to Audience
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
