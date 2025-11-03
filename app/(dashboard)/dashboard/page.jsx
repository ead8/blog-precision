"use client"


import React, { useState, useEffect } from 'react';
import { Analysis, Recommendation, User } from '@/lib/entities';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/lib/utils-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';                                                               
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  BarChart,
  Lightbulb,
  FileText,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { motion, AnimatePresence } from 'framer-motion';
import LocalizedTimestamp from '@/components/shared/LocalizedTimestamp';
import ProtectedRoute from "@/components/auth/ProtectedRoute";


function DashboardContent() {
  const [analyses, setAnalyses] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [analysisToDelete, setAnalysisToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAnalyses, setTotalAnalyses] = useState(0);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    loadDashboardData(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const loadDashboardData = async (page = 1) => {
    setIsLoading(true);
    try {
      const user = await User.me();
      
      // Load analyses with pagination
      const analysesResponse = await fetch(
        `/api/analysis?created_by=${encodeURIComponent(user.email)}&sortBy=-created_date&limit=${ITEMS_PER_PAGE}&page=${page}`
      );
      const analysesData = await analysesResponse.json();
      
      // Ensure we always have arrays
      const analysesArray = Array.isArray(analysesData.analyses) ? analysesData.analyses : (analysesData.analyses || []);
      
      // Set pagination info
      if (analysesData.pagination) {
        setTotalPages(analysesData.pagination.pages || 1);
        setTotalAnalyses(analysesData.pagination.total || 0);
      } else {
        setTotalPages(1);
        setTotalAnalyses(analysesArray.length);
      }
      
      // Load all recommendations (no pagination needed for recommendations)
      const userRecommendations = await Recommendation.filter({ created_by: user.email });
      const recommendationsArray = Array.isArray(userRecommendations) ? userRecommendations : (userRecommendations?.data || []);
      
      setAnalyses(analysesArray);
      setRecommendations(recommendationsArray);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setAnalyses([]);
      setRecommendations([]);
      setTotalPages(1);
      setTotalAnalyses(0);
    }
    setIsLoading(false);
  };

  const handleDelete = async (analysisId) => {
    try {
      await Analysis.delete(analysisId);
      setAnalysisToDelete(null);
      // Reload data to refresh the list and pagination
      loadDashboardData(currentPage);
    } catch (error) {
      console.error("Failed to delete analysis:", error);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'completed': return <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">Completed</span>;
      case 'failed': return <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">Failed</span>;
      case 'setup': return <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">Setup</span>;
      default: return <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full animate-pulse">In Progress</span>;
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
      },
    }),
    exit: { opacity: 0, y: -20 }
  };
  
  const StatCard = ({ icon, label, value }) => (
    <div className="bg-slate-100 p-4 rounded-lg flex items-center">
      <div className="p-2 bg-slate-200 rounded-full mr-3">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-sm text-slate-600">{label}</div>
      </div>
    </div>
  );

  const totalPostsAnalyzed = analyses.reduce((sum, a) => sum + (a.analysis_results?.discovery_summary?.total_posts_analyzed || 0), 0);
  const totalRecommendations = recommendations.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-800 mt-1">Welcome back! Here's an overview of your analyses.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Link href={createPageUrl("newanalysis")}>
                <Button size="lg" className="bg-orange-500 text-black font-bold shadow-md hover:bg-orange-600 transition-colors w-full">                        
                  <Plus className="w-5 h-5 mr-2" />
                  New Analysis
                </Button>
              </Link>
            </div>
          </header>

          {analyses.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-white p-12 rounded-xl shadow-lg border">
              <Sparkles className="mx-auto h-16 w-16 text-orange-400 mb-6" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No analyses yet</h3>
              <p className="text-slate-700 mb-6 max-w-md mx-auto">
                Start your first competitive analysis to discover content gaps.
              </p>
              <Link href={createPageUrl("newanalysis")}>
                <Button size="lg" className="bg-orange-500 text-black font-bold shadow-lg hover:bg-orange-600 transition-all duration-300 px-8 py-3 text-base group">                                                                           
                  Create First Analysis
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />                                                        
                </Button>
              </Link>
            </motion.div>
          ) : (
            <>
              <motion.div layout className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <StatCard icon={<BarChart className="h-6 w-6 text-slate-700"/>} label="Analyses Run" value={totalAnalyses.toLocaleString()}/>
                  <StatCard icon={<FileText className="h-6 w-6 text-slate-700"/>} label="Posts Analyzed" value={totalPostsAnalyzed.toLocaleString()}/>
                  <StatCard icon={<Lightbulb className="h-6 w-6 text-slate-700"/>} label="Ideas Generated" value={totalRecommendations.toLocaleString()}/>
              </motion.div>

              <div className="grid grid-cols-1 gap-6">
                <AnimatePresence>
                  {analyses.map((analysis, i) => (
                    <motion.div
                      key={analysis.id}
                      custom={i}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                    >
                      <Card className="hover:shadow-lg transition-shadow duration-300 overflow-hidden bg-white/80 backdrop-blur-sm">
                        <CardHeader className="flex flex-row justify-between items-start gap-4">
                          <div>
                            <CardTitle className="text-lg font-bold">
                              <Link href={createPageUrl(`Results?id=${analysis.id}`)} className="hover:underline text-blue-800">                                  
                                Analysis for {new URL(analysis.client_url).hostname}                                                                            
                              </Link>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 text-sm text-slate-600 mt-1">                                                   
                              <LocalizedTimestamp date={analysis.created_date} />                                                                               
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {getStatusChip(analysis.status)}
                            <Dialog  open={analysisToDelete?.id === analysis.id} onOpenChange={(isOpen) => !isOpen && setAnalysisToDelete(null)}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-red-600 hover:bg-red-100" onClick={() => setAnalysisToDelete(analysis)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-orange-500 border-orange-600 shadow-2xl">
                                <DialogHeader>
                                  <DialogTitle className="text-white">Are you sure?</DialogTitle>
                                  <DialogDescription className="text-white/90">
                                    This will permanently delete the analysis for <span className="font-semibold text-white">{new URL(analysisToDelete?.client_url || 'https://example.com').hostname}</span>. This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" className="bg-white hover:bg-gray-100" onClick={() => setAnalysisToDelete(null)}>Cancel</Button>
                                  <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(analysisToDelete.id)}>Delete Analysis</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                             <div className="flex flex-col">
                                <span className="font-semibold text-slate-800">Posts Found</span>
                                <span className="text-slate-600">{(analysis.analysis_results?.discovery_summary?.total_posts_analyzed || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-800">Recommendations</span>
                                <span className="text-slate-600">{recommendations.filter(r => r.analysis_id === analysis.id).length}</span>
                              </div>
                              <div className="flex flex-col col-span-2">
                                <span className="font-semibold text-slate-800">Current Step</span>
                                <span className="text-slate-600 truncate">
                                  {analysis.status === 'failed' && <AlertCircle className="h-4 w-4 inline mr-1 text-red-500"/>}
                                  {analysis.analysis_results?.current_step || 'Starting...'}
                                </span>
                              </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(currentPage - 1)}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        const showPage = 
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - 1 && page <= currentPage + 1);
                        
                        if (!showPage) {
                          // Show ellipsis
                          if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        }
                        
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={page === currentPage}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(currentPage + 1)}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </div>
  );
}

export default function Dashboard() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    );
}
