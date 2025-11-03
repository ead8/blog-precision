
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Globe, Target, Trophy, ExternalLink, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DiscoveredContent({ articles, analysis }) {
  const clientArticles = articles.filter(a => a.source_site === 'client');
  const competitorArticles = articles.filter(a => a.source_site === 'competitor');
  const leaderArticles = articles.filter(a => a.source_site === 'leader');

  const ArticleList = ({ articleList }) => (
    <div className="space-y-3 max-h-96 overflow-y-auto pr-4">
      {articleList.length > 0 ? (
        articleList.map((article, index) => (
          <motion.div
            key={article.id || index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.03 }}
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:bg-slate-50"
          >
            <p className="text-sm font-medium text-slate-800 flex-1 truncate pr-4">
              {article.title}
            </p>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>
        ))
      ) : (
        <div className="text-center py-10 text-slate-700">
          No articles were discovered for this website.
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900">
            Discovered Content Analysis
          </CardTitle>
          <p className="text-slate-800">
            A list of the blog posts found and analyzed from each target website.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="client" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 h-auto">
              <TabsTrigger value="client" className="py-2.5">
                <Globe className="w-4 h-4 mr-2" />
                Your Blog ({clientArticles.length})
              </TabsTrigger>
              <TabsTrigger value="competitor" className="py-2.5">
                <Target className="w-4 h-4 mr-2" />
                Competitor ({competitorArticles.length})
              </TabsTrigger>
              <TabsTrigger value="leader" className="py-2.5">
                <Trophy className="w-4 h-4 mr-2" />
                Industry Leader ({leaderArticles.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="client" className="mt-4">
              <ArticleList articleList={clientArticles} />
            </TabsContent>
            <TabsContent value="competitor" className="mt-4">
              <ArticleList articleList={competitorArticles} />
            </TabsContent>
            <TabsContent value="leader" className="mt-4">
              <ArticleList articleList={leaderArticles} />
            </TabsContent>
          </Tabs>
        </CardContent>
        {analysis?.discovery_methods_used && analysis.discovery_methods_used.length > 0 && (
          <CardFooter className="bg-slate-50/70 border-t border-slate-200/80 p-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Discovery Methods Successfully Utilized
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.discovery_methods_used.map((method, index) => (
                  <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                    {method}
                  </Badge>
                ))}
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}
