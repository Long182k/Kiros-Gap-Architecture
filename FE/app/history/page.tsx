'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { History, Target, Calendar, ChevronRight, Search, Loader2, AlertCircle, Sparkles, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MainLayout } from '@/components/layout/MainLayout';
import { analysisApi, GetAnalysisResponse } from '@/lib/api';

export default function HistoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [analyses, setAnalyses] = useState<GetAnalysisResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await analysisApi.getHistory(20);
        setAnalyses(response.analyses);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const filteredAnalyses = analyses.filter((analysis) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    if (analysis.result?.missingSkills) {
      return analysis.result.missingSkills.some((skill) =>
        skill.toLowerCase().includes(query)
      );
    }
    return analysis.id.includes(query);
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">Completed</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'PENDING':
      case 'PROCESSING':
        return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/30">Processing</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container max-w-4xl py-24 px-6 mx-auto">
          <Card className="glass-card">
            <CardContent className="py-16 text-center">
              <Loader2 className="mx-auto h-8 w-8 text-indigo-400 animate-spin mb-4" />
              <p className="text-slate-400 font-medium">Fetching Analysis Logs...</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container max-w-4xl py-24 px-6 mx-auto">
          <Alert variant="destructive" className="mb-6 bg-rose-950/30 border-rose-500/50 text-rose-200">
            <AlertCircle className="h-4 w-4 text-rose-400" />
            <AlertDescription className="font-semibold">{error}</AlertDescription>
          </Alert>
          <div className="text-center">
            <Button onClick={() => router.push('/')} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl">
              Start New Analysis
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-4xl py-10 px-6 mx-auto">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <History className="h-5 w-5" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Analysis History</h1>
            </div>
            <p className="text-sm text-slate-400">
              Audit log of previously generated skill gap reports and roadmaps.
            </p>
          </div>

          <Button onClick={() => router.push('/')} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl gap-2 font-bold text-xs">
            <Sparkles className="h-4 w-4" />
            New Audit
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by skill name (e.g., Kubernetes, React, Python)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-950/60 border-border/60 text-slate-200 placeholder:text-slate-500 rounded-xl"
          />
        </div>

        {/* List View */}
        {filteredAnalyses.length === 0 ? (
          <Card className="glass-card border-border/60">
            <CardContent className="py-16 text-center">
              <History className="mx-auto h-12 w-12 text-slate-600 mb-3" />
              <h3 className="text-lg font-bold text-white">No analysis records found</h3>
              <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? 'No skills matching your search query.'
                  : 'Start your first skill gap audit to see historical logs here.'}
              </p>
              <Button className="mt-6 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold" onClick={() => router.push('/')}>
                Create New Gap Audit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAnalyses.map((analysis) => (
              <Card
                key={analysis.id}
                className="glass-card border-border/60 overflow-hidden hover:border-indigo-500/40 cursor-pointer transition-all"
                onClick={() => router.push(`/results/${analysis.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    {/* Gap Count Badge */}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-extrabold text-lg">
                      {analysis.result?.missingSkills?.length || '0'}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-bold text-white text-base truncate">Role Gap Audit</h3>
                        {getStatusBadge(analysis.status)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-400 mb-2 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                          {formatDate(analysis.createdAt)}
                        </span>
                        {analysis.result?.missingSkills && (
                          <span className="flex items-center gap-1.5">
                            <Target className="h-3.5 w-3.5 text-purple-400" />
                            {analysis.result.missingSkills.length} missing skills
                          </span>
                        )}
                      </div>

                      {analysis.result?.missingSkills && (
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.result.missingSkills.slice(0, 5).map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="text-[11px] bg-slate-900/60 border-border/50 text-slate-300">
                              {skill}
                            </Badge>
                          ))}
                          {analysis.result.missingSkills.length > 5 && (
                            <span className="text-[11px] text-slate-400 self-center font-mono">
                              +{analysis.result.missingSkills.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <ChevronRight className="h-5 w-5 text-slate-500 shrink-0 group-hover:text-white transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
