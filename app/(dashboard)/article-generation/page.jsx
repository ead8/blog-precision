"use client"


import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPageUrl } from "@/lib/utils-router";
import { Analysis, WritingRequest, GeneratedArticle } from "@/lib/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Send, Building, Users, AlertCircle,
  FileText, Loader2, CheckCircle, XCircle, Copy, Download, Link as LinkIcon
} from "lucide-react";

// Helper function to call the generate article API endpoint
const generateArticleWithClaude = async (payload) => {
  const response = await fetch('/api/functions/generate-article', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Article generation failed: ${response.statusText}`);
  return response.json();
};
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLocale } from "@/components/context/LocaleContext";
import AnalysisProgress from "@/components/results/AnalysisProgress";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LanguageSelector from "@/components/shared/LanguageSelector";

const MIN_WRITING_DURATION = 135 * 1000; // 2 minutes 15 seconds per article on average
const LOCAL_STORAGE_KEY = 'blogprecision_generation_form';

// Mapping for word count options to their display ranges
const wordCountOptionsMap = {
    '600': '600-800 words',
    '800': '800-1000 words',
    '1000': '1000-1200 words',
    '1200': '1200-1500 words',
    '1500': '1500-1800 words',
    '1800': '1800-2200 words',
    '2000': '2000-2500 words',
};

// --- REBUILT Helper Function for HTML Conversion ---
const markdownToHtml = (markdown, title) => {
  const css = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem; background-color: #f9f9f9; }
    h1 { font-size: 2.5em; color: #111; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; margin-bottom: 1.5rem; }
    h2 { font-size: 2em; color: #222; margin-top: 2.5rem; margin-bottom: 1.2rem; border-bottom: 1px solid #eee; padding-bottom: 0.3rem; }
    h3 { font-size: 1.5em; color: #333; margin-top: 2rem; margin-bottom: 1rem; }
    p { margin-bottom: 1.2rem; }
    a { color: #007bff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    ul, ol { padding-left: 1.5rem; margin-bottom: 1.2rem; }
    li { margin-bottom: 0.5rem; }
    code { background-color: #f0f0f0; padding: 0.2em 0.4em; border-radius: 3px; font-family: 'Courier New', Courier, monospace; }
    pre { background-color: #f0f0f0; padding: 1em; border-radius: 5px; overflow-x: auto; margin-bottom: 1.2rem; }
    pre code { background-color: transparent; padding: 0; }
    blockquote { border-left: 4px solid #ccc; padding-left: 1rem; margin-left: 0; color: #666; font-style: italic; margin-bottom: 1.2rem; }
  `;

  if (typeof markdown !== 'string' || !markdown) {
    return `
      <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${title || 'Article'}</title><style>${css}</style></head><body><h1>${title || 'Article'}</h1><p>No content available.</p></body></html>
    `;
  }

  let processedMarkdown = markdown;

  // 1. Normalize newlines to ensure consistent block separation
  processedMarkdown = processedMarkdown.replace(/\r\n/g, '\n'); // Convert Windows newlines
  processedMarkdown = processedMarkdown.replace(/\n{3,}/g, '\n\n'); // Collapse excessive newlines

  // 2. Remove Image Suggestions (metadata, not content for final HTML)
  processedMarkdown = processedMarkdown.replace(/\[IMAGE SUGGESTION:[^\]]+\]/g, '');

  // 3. Handle Fenced Code Blocks (```language ... ```) - must be done before splitting into blocks
  processedMarkdown = processedMarkdown.replace(/```(?:\w+)?\n([\s\S]*?)```/g, (match, codeContent) => {
      // Escape HTML entities inside code block
      const escapedCode = codeContent
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      return `\n\n<pre><code>${escapedCode}</code></pre>\n\n`; // Ensure block is surrounded by \n\n
  });

  // 4. Handle Blockquotes (> Some text) - must be done before splitting into blocks
  processedMarkdown = processedMarkdown.replace(/^(>\s*.*(?:\n>\s*.*)*)(\n\n|$)/gsm, (match, p1, p2) => {
      const lines = p1.split('\n').map(line => line.replace(/^>\s*/, '').trim());
      // Inner content of blockquote also needs inline markdown processing
      const blockquoteContent = lines.map(line => {
          let formattedLine = line
              .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/`([^`]+)`/g, '<code>$1</code>');
          return `<p>${formattedLine}</p>`; // Each line within blockquote becomes a paragraph
      }).join('');
      return `\n\n<blockquote>${blockquoteContent}</blockquote>${p2}`; // Ensure block is surrounded by \n\n
  });

  // 5. Handle headings (existing logic, applied after block-level processing)
  processedMarkdown = processedMarkdown
    .replace(/^# (.*$)/gim, '\n\n<h1>$1</h1>\n\n')
    .replace(/^## (.*$)/gim, '\n\n<h2>$1</h2>\n\n')
    .replace(/^### (.*$)/gim, '\n\n<h3>$1</h3>\n\n');

  // Now, split into blocks based on double newlines
  // Filter out empty blocks created by initial processing or consecutive newlines
  const blocks = processedMarkdown.split('\n\n').filter(block => block.trim() !== '');

  let htmlContent = '';
  let inList = false;
  let currentListType = '';

  blocks.forEach(block => {
    let trimmedBlock = block.trim();

    // If block is already HTML (pre, blockquote, h1-h3 processed above), just append it.
    if (trimmedBlock.startsWith('<pre><code') || trimmedBlock.startsWith('<blockquote>') ||
        trimmedBlock.startsWith('<h1>') || trimmedBlock.startsWith('<h2>') || trimmedBlock.startsWith('<h3>')) {
        if (inList) { htmlContent += `</${currentListType}>\n`; inList = false; }
        htmlContent += trimmedBlock + '\n';
        return;
    }

    const isUlItem = trimmedBlock.match(/^\s*[-*+] (.+)/);
    const isOlItem = trimmedBlock.match(/^\s*\d+\. (.+)/);

    if (isUlItem || isOlItem) {
      const newListType = isUlItem ? 'ul' : 'ol';
      if (!inList) {
        htmlContent += `<${newListType}>\n`;
        inList = true;
        currentListType = newListType;
      } else if (currentListType !== newListType) {
        htmlContent += `</${currentListType}>\n<${newListType}>\n`;
        currentListType = newListType;
      }
      
      const itemContent = isUlItem ? isUlItem[1] : isOlItem[1];
      const formattedItemContent = itemContent
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>'); // Added inline code
      
      htmlContent += `  <li>${formattedItemContent}</li>\n`;
      return;
    } else {
      if (inList) {
        htmlContent += `</${currentListType}>\n`;
        inList = false;
      }
    }

    // Default to paragraph processing for anything not identified as a specific block type
    let paragraphContent = trimmedBlock
      .replace(/\n/g, '<br>') // Single newlines within paragraph blocks become <br>
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>'); // Added inline code

    if (paragraphContent) {
      htmlContent += `<p>${paragraphContent}</p>\n`;
    }
  });

  if (inList) {
    htmlContent += `</${currentListType}>\n`;
  }

  // Ensure there are no leftover empty blocks
  htmlContent = htmlContent.replace(/<p>\s*<\/p>\n*/g, '');

  return `
    <!DOCTYPE HTML><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title || 'Generated Article'}</title><style>${css}</style></head><body>${htmlContent}</body></html>
  `;
};


function ArticleGenerationContent() {
  const router = useRouter();
  const { locale } = useLocale();
  const [analysis, setAnalysis] = useState(null);
  const [editableTopics, setEditableTopics] = useState([]);
  
  // --- CURRENT STATE DECLARATION ---
  const [formData, setFormData] = useState({
    companyName: '',
    authorityInfo: '',
    teamCredentials: '',
    additionalNotes: '',
    backlinks_to_include: [],
    wordCount: '', 
  });

  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState('');
  const [generatedArticles, setGeneratedArticles] = useState([]);
  const [writingRequest, setWritingRequest] = useState(null);
  const [showForm, setShowForm] = useState(true);
  const [copiedArticleId, setCopiedArticleId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [writingProgress, setWritingProgress] = useState(0);
  const [currentBacklink, setCurrentBacklink] = useState('');
  const [error, setError] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const analysisId = urlParams.get('analysis');
  const topicsParam = urlParams.get('topics');

  // --- DEBUGGING: Log whenever formData.wordCount changes ---
  useEffect(() => {
    console.log('✅ formData.wordCount was updated to:', formData.wordCount);
  }, [formData.wordCount]);

  // --- CURRENT useEffect HOOK FOR LOADING DATA ---
  useEffect(() => {
    window.scrollTo(0, 0);
    const loadInitialData = async () => {
      if (!analysisId || !topicsParam) {
        router.push(createPageUrl("Dashboard"));
        return;
      }
      try {
        setIsLoading(true);

        const [analysisData, topics] = await Promise.all([
          Analysis.get(analysisId).catch(() => null),
          Promise.resolve(JSON.parse(decodeURIComponent(topicsParam)))
        ]);

        if (!analysisData) {
            router.push(createPageUrl("Dashboard"));
            return;
        }

        setAnalysis(analysisData);
        setEditableTopics(topics);

        // --- REBUILT PRIORITY LOGIC ---

        // 1. Load draft data (from localStorage or DB)
        let draftData = {};
        const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedDraft) {
            try {
                draftData = JSON.parse(savedDraft);
                console.log('🔍 Loaded draftData from localStorage:', draftData);
            } catch (e) {
                console.error("Failed to parse localStorage draft:", e);
                localStorage.removeItem(LOCAL_STORAGE_KEY);
            }
        } else {
            const recentWritingRequests = await WritingRequest.list('-created_date', 1);
            if (recentWritingRequests && recentWritingRequests.length > 0) {
                const recentReq = recentWritingRequests[0];
                draftData = {
                    companyName: recentReq.company_name || '',
                    authorityInfo: recentReq.authority_info || '',
                    teamCredentials: recentReq.team_credentials || '',
                    additionalNotes: recentReq.additional_notes || '',
                    backlinks_to_include: recentReq.backlinks_to_include || [],
                    // When loading from DB, the word_count is a number (e.g., 1000)
                    // We need to map it back to the string format used in the select
                    wordCount: wordCountOptionsMap[String(recentReq.word_count)] || '1000-1200 words'
                };
                console.log('🔍 Loaded draftData from database:', draftData);
            }
        }
        
        // 2. Determine final word count based on priority
        let finalWordCount;

        // Priority 1: Smart default from recommendation
        console.log('🔍 Recommended length from API:', topics[0]?.recommended_length);
        if (topics && topics.length > 0 && topics[0].recommended_length) {
            const recLength = topics[0].recommended_length.trim();
            
            const validOptions = [
                '600-800 words',
                '800-1000 words',
                '1000-1200 words',
                '1200-1500 words',
                '1500-1800 words',
                '1800-2200 words',
                '2000-2500 words'
            ];
            
            // STEP 1: Try direct exact match first (this should work 99% of the time)
            if (validOptions.includes(recLength)) {
                // Perfect match - use it directly
                finalWordCount = recLength;
                console.log('🔍 Calculated smartDefaultWordCount (Direct Match):', finalWordCount);
            } else {
                // STEP 2: Fallback - extract first number and find closest match
                const firstNumMatch = recLength.match(/(\d+)/);
                
                if (firstNumMatch) {
                    const targetWords = parseInt(firstNumMatch[0], 10);
                    
                    // Find the option that contains a number closest to targetWords
                    const closestOption = validOptions.reduce((best, option) => {
                        const optionNumMatch = option.match(/(\d+)/);
                        if (!optionNumMatch) return best; // Should not happen with validOptions
                        
                        const optionNum = parseInt(optionNumMatch[0], 10);
                        
                        const bestNumMatch = best.match(/(\d+)/);
                        if (!bestNumMatch) return option; // If best is invalid, take current option
                        
                        const bestNum = parseInt(bestNumMatch[0], 10);
                        
                        return Math.abs(optionNum - targetWords) < Math.abs(bestNum - targetWords) 
                            ? option 
                            : best;
                    }, validOptions[0]); // Initialize with the first valid option

                    finalWordCount = closestOption;
                    console.log('🔍 Calculated smartDefaultWordCount (Closest Match):', finalWordCount);
                } else {
                    // STEP 3: Ultimate fallback
                    finalWordCount = '1000-1200 words';
                    console.log('🔍 Calculated smartDefaultWordCount (Fallback due to no number in recommendation):', finalWordCount);
                }
            }
        }
        
        // Priority 2: Use localStorage/draft data if no recommendation was found
        // and if draft data contains a wordCount (e.g., from a previous manual selection)
        if (!finalWordCount && draftData.wordCount) {
            finalWordCount = draftData.wordCount;
            console.log('🔍 Using draft wordCount (Priority 2):', finalWordCount);
        }

        // Priority 3: Fallback if nothing else is available
        if (!finalWordCount) {
            finalWordCount = '1000-1200 words';
            console.log('🔍 Using fallback wordCount (Priority 3):', finalWordCount);
        }

        // 3. Set the final, combined state once
        const finalFormData = {
          ...draftData,
          wordCount: finalWordCount
        };

        console.log('📝 Attempting to set final formData:', finalFormData);
        setFormData(finalFormData);

      } catch (error) {
        console.error("Error loading data:", error);
        router.push(createPageUrl("Dashboard"));
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [analysisId, topicsParam, navigate]);

  const handleTitleChange = (index, newTitle) => {
    const updatedTopics = [...editableTopics];
    updatedTopics[index] = { ...updatedTopics[index], title: newTitle };
    setEditableTopics(updatedTopics);
  };

  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newFormData)); // Save to localStorage on change
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const addBacklink = () => {
    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    const trimmedUrl = currentBacklink.trim();
    // FIX: Defensively ensure backlinks_to_include is an array
    const currentBacklinks = formData.backlinks_to_include || [];

    if (trimmedUrl) {
      if (urlRegex.test(trimmedUrl)) {
        if (!currentBacklinks.includes(trimmedUrl)) {
          const updatedBacklinks = [...currentBacklinks, trimmedUrl];
          handleInputChange('backlinks_to_include', updatedBacklinks);
          setCurrentBacklink('');
          setErrors(prev => ({...prev, backlinks: null}));
        } else {
           setErrors(prev => ({...prev, backlinks: 'This URL has already been added.'}));
        }
      } else {
        setErrors(prev => ({...prev, backlinks: 'Please enter a valid URL.'}));
      }
    }
  };

  const removeBacklink = (indexToRemove) => {
    handleInputChange('backlinks_to_include', formData.backlinks_to_include.filter((_, index) => index !== indexToRemove));
  };

  const generateSingleArticle = async (topic, index, total, requestId, currentFormData) => {
    const singleArticleStartTime = Date.now();

    try {
      setCurrentStep(`Generating article ${index + 1} of ${total}: "${topic.title}"`);

      // NEW: Call the backend function to get the article from Claude
      const { data: claudeResponse } = await generateArticleWithClaude({
        topic,
        currentFormData, // currentFormData.wordCount will now be a string like "1000-1200 words"
        analysis,
        locale,
      });

      if (!claudeResponse || !claudeResponse.articleContent) {
        throw new Error("Received no content from the Claude backend function.");
      }
      
      let rawArticleContent = claudeResponse.articleContent;

      if (!rawArticleContent || typeof rawArticleContent !== 'string' || rawArticleContent.trim().length < 200) {
        throw new Error("Generated content from Claude is too short or invalid");
      }
      
      let articleContent = rawArticleContent;
      const titleIndex = articleContent.indexOf(`# ${topic.title}`);
      if (titleIndex > 0) {
        articleContent = articleContent.substring(titleIndex);
      }

      const metaPrompt = `Based on the following article, create a compelling SEO meta description. It MUST be between 155 and 160 characters. It MUST start with the article title. Format: "{Article Title} - [Benefit/Information]". Your response must ONLY be the meta description string.

Article Title: "${topic.title}"
Article Content (for context):
${articleContent.substring(0, 2000)}...
---
Generate only the meta description.`;

      const metaDescription = await InvokeLLM({ prompt: metaPrompt });

      // Extract the first number from the wordCount string (e.g., "1000" from "1000-1200 words"), or default to 1000
      const requestedWordCountForArticle = parseInt(String(formData.wordCount).match(/\d+/)[0], 10) || 1000;

      const articleData = {
        writing_request_id: requestId,
        analysis_id: analysisId,
        topic_title: topic.title,
        article_content: articleContent,
        meta_description: metaDescription || 'Could not generate meta description.',
        target_keywords: topic.target_keywords || [],
        requested_word_count: requestedWordCountForArticle,
        status: 'generated',
        // ADDED: Save the audit trail to the entity
        audit_trail: claudeResponse.auditTrail || []
      };

      const savedArticle = await GeneratedArticle.create(articleData);
      
      const articleWithTopic = {
        ...savedArticle,
        topic: topic,
        status: 'completed',
        content: savedArticle.article_content
      };

      setGeneratedArticles(prev => [...prev, articleWithTopic]);

      const elapsedTime = Date.now() - singleArticleStartTime;
      if (elapsedTime < MIN_WRITING_DURATION) {
        await new Promise(resolve => setTimeout(resolve, MIN_WRITING_DURATION - elapsedTime));
      }

      return { success: true, article: articleWithTopic };

    } catch (error) {
      console.error(`Failed to generate article for "${topic.title}":`, error);
      setError(`Article generation failed for "${topic.title}": ${error.message}`);
      const failedArticle = {
        topic: topic,
        status: 'failed',
        error: error.message
      };
      setGeneratedArticles(prev => [...prev, failedArticle]);
      
      const elapsedTime = Date.now() - singleArticleStartTime;
      if (elapsedTime < MIN_WRITING_DURATION) {
        await new Promise(resolve => setTimeout(resolve, MIN_WRITING_DURATION - elapsedTime));
      }

      throw new Error(`Failed to generate article for "${topic.title}"`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); 
    const newErrors = {};
    if (!formData.companyName.trim()) newErrors.companyName = "Company name is required";
    if (!formData.wordCount) newErrors.wordCount = "Please select an article length.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    window.scrollTo(0, 0);

    const generationStartTime = Date.now();
    setIsGenerating(true);
    setStartTime(generationStartTime);
    setWritingProgress(5);
    setCurrentStep('Creating writing request...');
    setGeneratedArticles([]);

    const totalTopics = editableTopics.length;
    const estimatedTotalDuration = totalTopics * MIN_WRITING_DURATION;

    const progressInterval = setInterval(() => {
      setWritingProgress(prev => {
        const elapsedTime = Date.now() - generationStartTime;
        const timeBasedProgress = 5 + (elapsedTime / estimatedTotalDuration) * 90;
        return Math.floor(Math.min(timeBasedProgress, 95));
      });
    }, 200);

    try {
      const numericWordCount = parseInt(String(formData.wordCount).match(/\d+/)[0], 10) || 1000;

      const request = await WritingRequest.create({
        analysis_id: analysisId,
        company_name: formData.companyName,
        authority_info: formData.authorityInfo,
        team_credentials: formData.teamCredentials,
        additionalNotes: formData.additionalNotes,
        backlinks_to_include: formData.backlinks_to_include,
        selected_topics: editableTopics,
        word_count: numericWordCount,
        analysis_data: {
          target_audience: analysis.target_audience,
          target_location: analysis.target_location,
          keywords: analysis.keywords || []
        }
      });
      setWritingRequest(request);
      setShowForm(false);
      
      localStorage.removeItem(LOCAL_STORAGE_KEY);

      for (let i = 0; i < totalTopics; i++) {
        setCurrentStep(`Generating article ${i + 1} of ${totalTopics}: "${editableTopics[i].title}"`);
        await generateSingleArticle(editableTopics[i], i, totalTopics, request.id, formData);
      }
      
      // SUCCESS: All articles generated
      clearInterval(progressInterval);
      setWritingProgress(100);
      setCurrentStep('All articles generated successfully! Redirecting...');

      // FIXED: Direct navigation after brief delay
      setTimeout(() => {
  const url = createPageUrl('GeneratedArticles');
    window.location.href = url;
}, 1500);

    } catch (error) {
      console.error('Generation process failed:', error);
      clearInterval(progressInterval);
      if (error) {
        setError(`Generation failed: ${error.message}`);
      }
      setCurrentStep('Generation process failed.');
    }
  };

  const copyArticleContent = (article) => {
    navigator.clipboard.writeText(article.content);
    setCopiedArticleId(article.id);
    setTimeout(() => setCopiedArticleId(null), 2000);
  };

  const downloadArticle = (article) => {
    const htmlContent = markdownToHtml(article.content, article.topic.title);
    const element = document.createElement("a");
    const file = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${article.topic.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-6xl">
          <AnalysisProgress
            analysis={{ progress: writingProgress }}
            startTime={startTime}
            title="Writing Your Articles..."
            isWriting={true}
          />
          <div className="text-center mt-6 text-slate-700 font-medium bg-white p-3 rounded-lg shadow-md border">
            {currentStep}
          </div>
          
          {error && (
             <Alert variant="destructive" className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
             </Alert>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(createPageUrl(`Results?id=${analysisId}`))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Results
        </Button>

        <AnimatePresence mode="wait">
          {showForm ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-slate-800">
                    Generate Articles
                  </CardTitle>
                  <p className="text-slate-600">
                    Provide company details to generate {editableTopics.length} article{editableTopics.length > 1 ? 's' : ''}.
                  </p>
                  <div className="pt-4">
                    <LanguageSelector />
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <Accordion type="multiple" defaultValue={['item-topics', 'item-1', 'item-2', 'item-3', 'item-4']} className="w-full">
                      <AccordionItem value="item-topics">
                        <AccordionTrigger className="text-lg font-semibold">
                          <div className="flex items-center gap-2"><FileText className="w-5 h-5" />Article Topics ({editableTopics.length})</div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                          <p className="text-sm text-slate-600">You can edit the titles below. The AI will write the article based on the title you provide.</p>
                          {editableTopics.map((topic, index) => (
                            <div key={topic.id || index}>
                              <Label htmlFor={`topic-title-${index}`}>Topic {index + 1} Title</Label>
                              <Input
                                id={`topic-title-${index}`}
                                value={topic.title}
                                onChange={(e) => handleTitleChange(index, e.target.value)}
                                className="mt-1"
                              />
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-1">
                        <AccordionTrigger className="text-lg font-semibold">
                          <div className="flex items-center gap-2"><Building className="w-5 h-5" />Company Details</div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                          <div>
                            <Label htmlFor="companyName">
                              Company Name
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="companyName"
                              placeholder="Your Company Name"
                              value={formData.companyName}
                              onChange={(e) => handleInputChange('companyName', e.target.value)}
                              className={errors.companyName ? "border-red-500" : ""}
                              required
                            />
                            {errors.companyName && (
                              <p className="text-red-600 text-sm mt-1">{errors.companyName}</p>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                        <AccordionTrigger className="text-lg font-semibold">
                          <div className="flex items-center gap-2"><Users className="w-5 h-5" />Authority, Team & Notes</div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                          <div>
                            <Label htmlFor="authorityInfo">
                              Authority Information (Optional)
                            </Label>
                            <Textarea
                              id="authorityInfo"
                              placeholder="e.g., Company credentials, years of experience, key achievements"
                              value={formData.authorityInfo}
                              onChange={(e) => handleInputChange('authorityInfo', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="teamCredentials">
                              Team Credentials (Optional)
                            </Label>
                            <Textarea
                              id="teamCredentials"
                              placeholder="e.g., Team qualifications, combined experience, certifications"
                              value={formData.teamCredentials}
                              onChange={(e) => handleInputChange('teamCredentials', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="additionalNotes">
                              Additional Notes (Optional)
                            </Label>
                            <Textarea
                              id="additionalNotes"
                              placeholder="Any specific requirements or preferences..."
                              value={formData.additionalNotes}
                              onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-4">
                        <AccordionTrigger className="text-lg font-semibold">
                          <div className="flex items-center gap-2"><LinkIcon className="w-5 h-5" />Required Backlinks (Optional)</div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                          <div>
                            <Label htmlFor="backlinkInput">Add a URL to include in the articles</Label>
                            <div className="flex gap-2 mt-2">
                              <Input
                                id="backlinkInput"
                                placeholder="https://example.com/blog/post"
                                value={currentBacklink}
                                onChange={(e) => {
                                  setCurrentBacklink(e.target.value);
                                  setErrors(prev => ({ ...prev, backlinks: null }));
                                }}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBacklink())}
                              />
                              <Button type="button" onClick={addBacklink}>Add</Button>
                            </div>
                             {errors.backlinks && (
                              <p className="text-red-600 text-sm mt-1">{errors.backlinks}</p>
                            )}
                          </div>
                          {formData.backlinks_to_include && formData.backlinks_to_include.length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-sm text-slate-700">Links to be included:</Label>
                              <div className="flex flex-wrap gap-2">
                                {formData.backlinks_to_include.map((link, index) => (
                                  <Badge key={index} variant="secondary" className="flex items-center gap-2 pr-1">
                                    {link}
                                    <button
                                      type="button"
                                      onClick={() => removeBacklink(index)}
                                      className="rounded-full hover:bg-slate-200 p-0.5"
                                      aria-label={`Remove backlink ${link}`}
                                    >
                                      <XCircle className="w-4 h-4 text-red-500" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-3">
                        <AccordionTrigger className="text-lg font-semibold">
                          <div className="flex items-center gap-2"><FileText className="w-5 h-5" />Article Length</div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                           {editableTopics[0]?.recommended_length && (
                              <div className="text-sm font-medium text-slate-700 bg-slate-100 p-3 rounded-md border">
                                Recommended Length for this topic: <span className="font-bold text-slate-900">{editableTopics[0].recommended_length}</span>
                              </div>
                            )}
                           <Select
                              value={formData.wordCount}
                              onValueChange={(value) => handleInputChange('wordCount', value)}
                            >
                              <SelectTrigger className={errors.wordCount ? "border-red-500" : ""}>
                                <SelectValue placeholder="Select article length" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="600-800 words">Approx. 600-800 words</SelectItem>
                                <SelectItem value="800-1000 words">Approx. 800-1000 words</SelectItem>
                                <SelectItem value="1000-1200 words">Approx. 1000-1200 words</SelectItem>
                                <SelectItem value="1200-1500 words">Approx. 1200-1500 words</SelectItem>
                                <SelectItem value="1500-1800 words">Approx. 1500-1800 words</SelectItem>
                                <SelectItem value="1800-2200 words">Approx. 1800-2200 words</SelectItem>
                                <SelectItem value="2000-2500 words">Approx. 2000-2500 words</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-sm text-slate-500">This selection overrides the initial recommendation and sets a new target for the AI for all generated articles.</p>
                             {errors.wordCount && (
                              <p className="text-red-600 text-sm mt-1">{errors.wordCount}</p>
                            )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    {errors.general && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errors.general}</AlertDescription>
                      </Alert>
                    )}
                    <Button
                      type="submit"
                      disabled={isGenerating}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Generate Articles
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-xl mb-6">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-slate-800">
                    Article Generation Complete
                  </CardTitle>
                  <p className="text-slate-600 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    {currentStep}
                  </p>
                </CardHeader>
              </Card>

              {generatedArticles.length > 0 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-800">Generated Articles</h2>
                  {generatedArticles.map((article, index) => (
                    <motion.div
                      key={article.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{article.topic.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-2">
                                {article.status === 'completed' ? (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Generated
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Failed
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {article.status === 'completed' && (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyArticleContent(article)}
                                >
                                  <Copy className="w-4 h-4 mr-1" />
                                  {copiedArticleId === article.id ? 'Copied!' : 'Copy'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadArticle(article)}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Download HTML
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        
                        {article.status === 'failed' && (
                          <CardContent>
                            <Alert variant="destructive">
                              <AlertDescription>
                                <strong>Generation failed:</strong> {article.error}
                              </AlertDescription>
                            </Alert>
                          </CardContent>
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ArticleGeneration() {
    return (
        <ProtectedRoute>
            <ArticleGenerationContent />
        </ProtectedRoute>
    );
}
