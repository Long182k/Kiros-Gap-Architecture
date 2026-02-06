'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { History, Target, Calendar, ChevronRight, Search, Loader2, AlertCircle } from 'lucide-react';
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
    // Search in missing skills if result exists
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
        return <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/30">Completed</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'PENDING':
      case 'PROCESSING':
        return <Badge variant="outline">Processing</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container max-w-4xl py-24 px-6">
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Loading history...</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container max-w-4xl py-24 px-6">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="text-center">
            <Button onClick={() => router.push('/')}>Start New Analysis</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-4xl py-8 px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <History className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Analysis History</h1>
          </div>
          <p className="text-muted-foreground">
            View your past gap analyses. Click to see details.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Analysis List */}
        {filteredAnalyses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <History className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No analyses found</h3>
              <p className="mt-2 text-muted-foreground">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Start your first gap analysis to see results here'}
              </p>
              <Button className="mt-4" onClick={() => router.push('/')}>
                New Analysis
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAnalyses.map((analysis) => (
              <Card
                key={analysis.id}
                className="overflow-hidden transition-colors hover:bg-accent/50 cursor-pointer"
                onClick={() => router.push(`/results/${analysis.id}`)}
              >
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    {/* Gap Count */}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted">
                      <span className="text-lg font-bold text-primary">
                        {analysis.result?.missingSkills?.length || '?'}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">Analysis</h3>
                        {getStatusBadge(analysis.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(analysis.createdAt)}
                        </span>
                        {analysis.result?.missingSkills && (
                          <span className="flex items-center gap-1">
                            <Target className="h-3.5 w-3.5" />
                            {analysis.result.missingSkills.length} gaps
                          </span>
                        )}
                      </div>
                      {analysis.result?.missingSkills && (
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.result.missingSkills.slice(0, 4).map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {analysis.result.missingSkills.length > 4 && (
                            <span className="text-xs text-muted-foreground self-center">
                              +{analysis.result.missingSkills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
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
