"use client"

import React, { useState, useEffect } from "react";
import { GeneratedArticle, User } from "@/lib/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Loader2,
  Copy,
  Download,
  CheckCircle,
  Calendar,
  Type,
  Check,
  Trash2,
  Eye // ADDED: Icon for viewing audit log
} from "lucide-react";
import LocalizedTimestamp from '@/components/shared/LocalizedTimestamp'; // DEFINITIVE FIX
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"; // ADDED: Accordion for audit log
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// --- Helper Function for Word Count ---
const countWords = (text) => {
  if (!text) return 0;
  // Basic markdown stripping for word count estimation.
  // This aims to remove formatting elements, leaving only plain text for counting.
  let strippedText = text
    // Remove code blocks (fenced)
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`[^`]*`/g, '')
    // Remove links [text](url)
    .replace(/\[.*?\]\(.*?\)/g, '')
    // Remove images ![alt](url)
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // Remove bold/italic markers
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove headers
    .replace(/^(#+\s.*)$/gm, '')
    // Remove list item markers
    .replace(/^(-|\*|\+)\s/gm, '')
    .replace(/^(\d+)\.\s/gm, '')
    // Remove blockquote markers
    .replace(/^>\s/gm, '')
    // Remove zero-width spaces that might interfere with word splitting
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Replace newlines with spaces to count words across lines correctly
    .replace(/\n/g, ' ')
    // Replace multiple spaces with a single space
    .replace(/\s+/g, ' ')
    .trim();

  if (!strippedText) return 0;
  return strippedText.split(' ').length;
};


// --- REBUILT Helper Function for HTML Conversion ---
// This version is self-contained and does not use the 'marked' library.
const markdownToHtml = (markdown, title) => {
  const css = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem; background-color: #f9f9f9; }
    h1 { font-size: 2.5em; color: #111; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; margin-bottom: 1.5rem; }
    h2 { font-size: 2em; color: #222; margin-top: 2.5rem; margin-bottom: 1.2rem; border-bottom: 1px solid #eee; padding-bottom: 0.3rem; }
    h3 { font-size: 1.5em; color: #333; margin-top: 2rem; margin-bottom: 1rem; }
    h4 { font-size: 1.25em; color: #444; margin-top: 1.8rem; margin-bottom: 0.9rem; }
    h5 { font-size: 1.1em; color: #555; margin-top: 1.5rem; margin-bottom: 0.7rem; }
    h6 { font-size: 1em; color: #666; margin-top: 1.3rem; margin-bottom: 0.6rem; }
    p { margin-bottom: 1.2rem; }
    a { color: #007bff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    ul, ol { padding-left: 1.5rem; margin-bottom: 1.2rem; }
    li { margin-bottom: 0.5rem; }
    code { background-color: #f0f0f0; padding: 0.2em 0.4em; border-radius: 3px; font-family: 'Courier New', Courier, monospace; }
    pre { background-color: #e8e8e8; padding: 1em; border-radius: 4px; overflow-x: auto; margin-bottom: 1.2rem; white-space: pre-wrap; word-break: break-all;}
    pre code { background: none; padding: 0; border-radius: 0; }
    blockquote { border-left: 4px solid #ccc; padding-left: 1rem; margin-left: 0; color: #666; font-style: italic; margin-bottom: 1.2rem; }
    img { max-width: 100%; height: auto; display: block; margin: 1em auto; border-radius: 4px; }
    hr { border: none; border-top: 1px solid #eee; margin: 2em 0; }
  `;

  if (typeof markdown !== 'string' || !markdown) {
    return `
      <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${title || 'Article'}</title><style>${css}</style></head><body><h1>${title || 'Article'}</h1><p>No content available.</p></body></html>
    `;
  }

  let html = [];
  const lines = markdown.split('\n');
  let i = 0;

  // State for block parsing
  let inList = false;
  let listType = ''; // 'ul' or 'ol'
  let inCodeBlock = false;
  let codeLang = '';
  let inBlockquote = false;
  let currentBlockquoteContent = [];
  let currentParagraph = [];

  // Helper for inline formatting (bold, italic, links, inline code, images)
  const applyInlineFormatting = (text) => {
    let formatted = text;
    // Order matters for some of these replacements to avoid re-matching
    formatted = formatted.replace(/`([^`]+)`/g, (match, content) => `<code>${content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>`); // Inline code, escape HTML inside code
    formatted = formatted.replace(/!\[([^\]]*)\]\((.*?)\)/g, '<img src="$2" alt="$1" />'); // Images
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'); // Links
    formatted = formatted.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>'); // Bold (**word**, __word__)
    formatted = formatted.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');     // Italic (*word*, _word_)
    return formatted;
  };

  // Function to flush current paragraph content into HTML
  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const paragraphContent = currentParagraph.join('\n').trim();
      if (paragraphContent.length > 0) { // Only render if there's actual content
        html.push(`<p>${applyInlineFormatting(paragraphContent.replace(/\n/g, ' '))}</p>`); // Soft breaks become spaces in paragraph
      }
      currentParagraph = [];
    }
  };

  // Function to flush current blockquote content into HTML
  const flushBlockquote = () => {
    if (inBlockquote && currentBlockquoteContent.length > 0) {
      // Content within blockquote should still be line-break sensitive for inline formatting,
      // but should be treated as a single block for the purpose of the <blockquote> tag.
      // We apply inline formatting to each line before joining.
      const blockquoteHtmlContent = currentBlockquoteContent
        .map(line => applyInlineFormatting(line))
        .join('<br>'); // Treat internal newlines as <br> for blockquotes
      html.push(`<blockquote>${blockquoteHtmlContent}</blockquote>`);
      currentBlockquoteContent = [];
    }
    inBlockquote = false; // Ensure blockquote state is reset
  };

  // Function to flush current list content into HTML
  const flushList = () => {
    if (inList) {
      html.push(`</${listType}>`);
      inList = false;
      listType = '';
    }
  };

  // Central flush mechanism to ensure block integrity
  const flushAllOpenBlocks = () => {
    flushParagraph();
    flushBlockquote();
    flushList();
  };


  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();
    const isBlankLine = trimmedLine === '';

    // 1. Handle fenced code blocks first, as they encapsulate raw content
    if (line.match(/^```(\S*)$/)) {
      flushAllOpenBlocks(); // Flush any open blocks before a code block
      inCodeBlock = !inCodeBlock;
      codeLang = inCodeBlock ? RegExp.$1 : '';
      if (!inCodeBlock) { // End of code block
        html.push(`</code></pre>`);
      } else { // Start of code block
        html.push(`<pre><code${codeLang ? ` class="language-${codeLang}"` : ''}>`);
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      // Escape HTML entities within code block content
      html.push(`${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}`);
      i++;
      continue;
    }

    // 2. Process other block-level elements. If found, flush any active non-block elements.

    // Headers (#, ##, etc.)
    const headerMatch = trimmedLine.match(/^(#+)\s(.*)$/);
    if (headerMatch) {
      flushAllOpenBlocks();
      const level = headerMatch[1].length;
      const headerText = applyInlineFormatting(headerMatch[2]);
      html.push(`<h${level}>${headerText}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal Rule (---, ***, ___)
    if (trimmedLine.match(/^(---|___|\*\*\*)\s*$/)) {
      flushAllOpenBlocks();
      html.push(`<hr />`);
      i++;
      continue;
    }

    // Blockquotes (>)
    if (trimmedLine.startsWith('>')) {
      if (!inBlockquote) { // If starting a new blockquote
        flushAllOpenBlocks(); // Close any other open blocks (paragraph, list)
        inBlockquote = true;
      }
      const blockquoteLineContent = trimmedLine.substring(1).trim(); // Remove '>'
      currentBlockquoteContent.push(blockquoteLineContent);
      i++;
      continue;
    } else if (inBlockquote) { // If we were in a blockquote but current line doesn't start with '>'
      flushBlockquote(); // Close current blockquote (sets inBlockquote to false)
      // Allow this line to be parsed as a new block (e.g., paragraph)
    }

    // Lists (- item, * item, 1. item)
    const ulMatch = trimmedLine.match(/^(-|\*|\+)\s(.+)$/);
    const olMatch = trimmedLine.match(/^(\d+)\.\s(.+)$/);

    if (ulMatch || olMatch) {
      flushParagraph(); // Flush any pending paragraph before a list item
      flushBlockquote(); // Flush any pending blockquote before a list item
      const listItemContent = ulMatch ? ulMatch[2] : olMatch[2];
      const currentLineListType = ulMatch ? 'ul' : 'ol';

      if (!inList) {
        html.push(`<${currentLineListType}>`);
        inList = true;
        listType = currentLineListType;
      } else if (listType !== currentLineListType) {
        // If switching list types (e.g., from ul to ol or vice-versa)
        html.push(`</${listType}>`);
        html.push(`<${currentLineListType}>`);
        listType = currentLineListType;
      }
      // Note: This simple parser does not support nested lists by tracking indentation.
      // It will treat all list items as belonging to the current top-level list.
      html.push(`  <li>${applyInlineFormatting(listItemContent)}</li>`);
      i++;
      continue;
    } else if (inList) { // If we were in a list but current line is not a list item
      flushList(); // Close the list
      // Allow this line to be parsed as a new block (e.g., paragraph)
    }

    // Blank lines: Act as paragraph separators and close active blocks
    if (isBlankLine) {
      flushAllOpenBlocks();
      i++;
      continue;
    }

    // Default: accumulate line for paragraph content if no other block is active
    if (!inList && !inBlockquote) {
      currentParagraph.push(line);
    }
    i++;
  }

  // Flush any remaining open blocks at the end of the document
  flushAllOpenBlocks();

  return `
    <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title || 'Generated Article'}</title><style>${css}</style></head><body>${html.join('\n')}</body></html>
  `;
};

function GeneratedArticlesContent() {
  console.log('🎯 GeneratedArticles component mounted!');
  
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedArticleId, setCopiedArticleId] = useState(null);
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadArticles();
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (e) {
        console.error("Could not fetch user", e);
      }
    };
    fetchUser();
  }, []);

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const data = await GeneratedArticle.list("-created_date", 50); // Load latest 50
      console.log('📊 Loaded articles:', data.length);
      setArticles(data);
    } catch (error) {
      console.error("Error loading generated articles:", error);
    }
    setIsLoading(false);
  };

  const handleDeleteArticle = async () => {
    if (!articleToDelete) return;
    try {
      await GeneratedArticle.delete(articleToDelete.id);
      loadArticles(); // Reload articles after successful deletion
    } catch (error) {
      console.error("Error deleting article:", error);
    } finally {
      setArticleToDelete(null); // Close the dialog
    }
  };

  const copyArticleContent = (article) => {
    navigator.clipboard.writeText(article.article_content);
    setCopiedArticleId(article.id);
    setTimeout(() => setCopiedArticleId(null), 2000);
  };

  const downloadArticle = (article) => {
    const htmlContent = markdownToHtml(article.article_content, article.topic_title);
    const element = document.createElement("a");
    const file = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    // Sanitize filename for compatibility
    const sanitizedTitle = article.topic_title.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '-').toLowerCase();
    element.download = `${sanitizedTitle || 'article'}.html`;
    document.body.appendChild(element);
    element.click(); // This was the missing line that triggers the download.
    document.body.removeChild(element);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 text-center"
      >
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Generated Articles
        </h1>
        <p className="text-slate-800 text-lg">
          Access and manage all previously generated content.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 bg-white/70 rounded-xl shadow-md border">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No Articles Generated Yet
          </h3>
          <p className="text-slate-800 max-w-md mx-auto">
            Once you generate articles, they will appear here for you to access later.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {articles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-slate-900 mb-2">
                        {article.topic_title}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-700">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {/* DEFINITIVE FIX: Use the new robust component */}
                          <LocalizedTimestamp dateString={article.created_date} />
                        </div>
                        <div className="flex items-center gap-1">
                           <Type className="w-4 h-4" />
                           {/* Display actual word count using the new helper function */}
                           <span>{countWords(article.article_content)} words</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Generated
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyArticleContent(article)}
                        disabled={copiedArticleId === article.id}
                      >
                        {copiedArticleId === article.id ? (
                          <Check className="w-4 h-4 mr-1" />
                        ) : (
                          <Copy className="w-4 h-4 mr-1" />
                        )}
                        {copiedArticleId === article.id ? 'Copied!' : 'Copy'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadArticle(article)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                       <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setArticleToDelete(article)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">Meta Description</h3>
                      <p className="text-sm bg-slate-100 p-3 rounded-md border">{article.meta_description}</p>
                    </div>
                    
                    {/* MODIFIED: Conditionally render based on user role */}
                    {currentUser?.role === 'admin' && article.audit_trail && article.audit_trail.length > 0 && (
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="audit-log">
                                <AccordionTrigger>
                                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                                        <Eye className="w-4 h-4"/>
                                        View Generation Audit Log
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    {article.audit_trail.map((auditStep, i) => (
                                        <div key={i} className="mb-4">
                                            <h4 className="font-bold text-sm mb-1">Audit Step {auditStep.audit_step}</h4>
                                            <pre className="bg-slate-900 text-white p-4 rounded-md text-xs whitespace-pre-wrap break-all overflow-x-auto">
                                                {JSON.stringify(auditStep.result, null, 2)}
                                            </pre>
                                        </div>
                                    ))}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      {/* AlertDialog for delete confirmation */}
      <AlertDialog open={!!articleToDelete} onOpenChange={(isOpen) => !isOpen && setArticleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this generated article: <strong>{articleToDelete?.topic_title}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteArticle} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function GeneratedArticles() {
    return (
        <ProtectedRoute>
            <GeneratedArticlesContent />
        </ProtectedRoute>
    );
}








