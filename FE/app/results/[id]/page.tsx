'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Clock, Sparkles, AlertCircle, Loader2, BookOpen, MessageCircleQuestion, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MainLayout } from '@/components/layout/MainLayout';
import { analysisApi, GetAnalysisResponse } from '@/lib/api';
import { MissingSkill, LearningStep, InterviewQuestion } from '@/types/analysis';
import { use } from 'react';

type AnalysisStatus = 'loading' | 'polling' | 'completed' | 'failed';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ResultsPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  // Get cached state from search params (passed from AnalysisInputPage)
  const cachedParam = searchParams.get('cached');
  const wasCached = cachedParam === 'true' ? true : cachedParam === 'false' ? false : null;
  
  const [status, setStatus] = useState<AnalysisStatus>('loading');
  const [analysis, setAnalysis] = useState<GetAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      router.push('/');
      return;
    }

    let cancelled = false;

    async function pollAnalysis() {
      try {
        const result = await analysisApi.getAnalysis(id!);
        
        if (cancelled) return;
        
        setAnalysis(result);
        
        if (result.status === 'COMPLETED') {
          setStatus('completed');
        } else if (result.status === 'FAILED') {
          setStatus('failed');
          setError(result.errorMessage || 'Analysis failed');
        } else {
          setStatus('polling');
          // Poll again after 2 seconds
          setTimeout(pollAnalysis, 2000);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch analysis');
        setStatus('failed');
      }
    }

    pollAnalysis();

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Map API response to UI types
  const mapToMissingSkills = (skills: string[]): MissingSkill[] => {
    return skills.map((name, index) => ({
      name,
      category: 'technical' as const,
      priority: index < 3 ? 'high' : index < 6 ? 'medium' : 'low' as const,
    }));
  };

  const mapToLearningSteps = (steps: { step: string; resource?: string }[]): LearningStep[] => {
    return steps.map((s, index) => ({
      id: index + 1,
      title: `Step ${index + 1}`,
      description: s.step,
      estimatedTime: '1-2 weeks',
      resources: s.resource ? [s.resource] : undefined,
    }));
  };

  const mapToInterviewQuestions = (questions: string[]): InterviewQuestion[] => {
    return questions.map((q, index) => ({
      id: index + 1,
      question: q,
      skillTargeted: 'Gap Area',
      difficulty: index === 0 ? 'hard' : index === 1 ? 'medium' : 'easy' as const,
    }));
  };

  // Loading/Polling State
  if (status === 'loading' || status === 'polling') {
    return (
      <MainLayout>
        <div className="flex flex-1 items-center justify-center p-6">
          <Card className="w-full max-w-2xl">
            <CardContent className="py-16 text-center">
              <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {status === 'loading' ? 'Loading Analysis...' : 'Analyzing Your Profile...'}
              </h2>
              <p className="text-muted-foreground mb-4">
                {status === 'polling' && 'Our AI is identifying skill gaps and creating your personalized roadmap.'}
              </p>
              {status === 'polling' && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Checking for results...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Error State
  if (status === 'failed') {
    return (
      <MainLayout>
        <div className="container max-w-2xl py-24 px-6 mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'An error occurred'}</AlertDescription>
          </Alert>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => router.push('/')}>
              Try Again
            </Button>
            <Button onClick={() => router.push('/history')}>
              View History
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // No result
  if (!analysis?.result) {
    return (
      <MainLayout>
        <div className="container max-w-2xl py-24 px-6 mx-auto text-center">
          <p className="text-muted-foreground">No analysis result found.</p>
          <Button className="mt-4" onClick={() => router.push('/')}>
            Start New Analysis
          </Button>
        </div>
      </MainLayout>
    );
  }

  const missingSkills = mapToMissingSkills(analysis.result.missingSkills);
  const learningSteps = mapToLearningSteps(analysis.result.learningPath);
  const interviewQuestions = mapToInterviewQuestions(analysis.result.interviewQuestions);

  return (
    <MainLayout>
      <div className="container max-w-6xl py-8 px-6 mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/')}
              className="mb-2 -ml-2 gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              New Analysis
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Gap Analysis Results</h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDate(analysis.createdAt)}
              </span>
              {/* Show AI time for fresh analysis, request time for cached */}
              {wasCached === false ? (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI: {((analysis.aiProcessingTimeMs ?? 0) / 1000).toFixed(1)}s
                </Badge>
              ) : wasCached === true ? (
                <Badge variant="outline" className="gap-1">
                  ⚡ Cached: {((analysis.requestTimeMs ?? 0) / 1000).toFixed(1)}s
                </Badge>
              ) : (
                <>
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI: {((analysis.aiProcessingTimeMs ?? 0) / 1000).toFixed(1)}s
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Missing Skills */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Missing Skills</CardTitle>
            <CardDescription>
              Skills found in the job description that weren't detected in your resume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((skill, index) => (
                <Badge 
                  key={index} 
                  variant="outline"
                  className={
                    skill.priority === 'high' 
                      ? 'border-red-500/50 bg-red-500/10 text-red-600' 
                      : skill.priority === 'medium'
                      ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-600'
                      : 'border-green-500/50 bg-green-500/10 text-green-600'
                  }
                >
                  {skill.name}
                </Badge>
              ))}
            </div>
            <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                High Priority
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                Medium Priority
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Low Priority
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Learning Steps */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Learning Roadmap</h2>
            </div>
            <div className="space-y-4">
              {learningSteps.map((step, index) => (
                <Card key={step.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{step.description}</p>
                        {step.resources?.[0] && (
                          <a 
                            href={step.resources[0]} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline mt-1 block"
                          >
                            {step.resources[0]}
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Interview Questions */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <MessageCircleQuestion className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Practice Questions</h2>
            </div>
            <div className="space-y-3">
              {interviewQuestions.map((question, index) => (
                <Card key={question.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground text-xs font-medium">
                        Q{index + 1}
                      </div>
                      <p className="font-medium">{question.question}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Button variant="outline" onClick={() => router.push('/')}>
            Start New Analysis
          </Button>
          <Button onClick={() => router.push('/history')}>
            View History
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
