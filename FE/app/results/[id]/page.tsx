'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  BookOpen, 
  MessageCircleQuestion, 
  RefreshCw,
  Award,
  CheckCircle,
  Brain,
  Share2,
  Download,
  Flame,
  Zap,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MainLayout } from '@/components/layout/MainLayout';
import { RadialProgress } from '@/components/analysis/RadialProgress';
import { MissingSkillBadge } from '@/components/analysis/MissingSkillBadge';
import { analysisApi, GetAnalysisResponse } from '@/lib/api';
import { MissingSkill, LearningStep, InterviewQuestion } from '@/types/analysis';
import { useToast } from '@/hooks/use-toast';

type AnalysisStatus = 'loading' | 'polling' | 'completed' | 'failed';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ResultsPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const { toast } = useToast();
  
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
      title: `Phase ${index + 1}`,
      description: s.step,
      estimatedTime: `${(index + 1) * 2} weeks`,
      resources: s.resource ? [s.resource] : undefined,
    }));
  };

  const mapToInterviewQuestions = (questions: string[]): InterviewQuestion[] => {
    return questions.map((q, index) => ({
      id: index + 1,
      question: q,
      skillTargeted: 'Missing Competency',
      difficulty: index === 0 ? 'hard' : index === 1 ? 'medium' : 'easy' as const,
    }));
  };

  const handleCopyJSON = () => {
    if (!analysis?.result) return;
    navigator.clipboard.writeText(JSON.stringify(analysis.result, null, 2));
    toast({
      title: 'Copied to Clipboard 📋',
      description: 'Analysis JSON data copied to clipboard.',
    });
  };

  // Loading/Polling UI
  if (status === 'loading' || status === 'polling') {
    return (
      <MainLayout>
        <div className="flex flex-1 items-center justify-center p-8 min-h-[80vh]">
          <Card className="glass-card w-full max-w-xl border-indigo-500/30 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 animate-pulse" />
            <CardContent className="py-12 flex flex-col items-center">
              <div className="relative mb-6">
                <div className="h-20 w-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 animate-pulse">
                  <Brain className="h-10 w-10 animate-bounce" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-indigo-600 rounded-full p-1.5 shadow-lg shadow-indigo-500/50">
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                </div>
              </div>

              <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
                {status === 'loading' ? 'Fetching Gap Analysis...' : 'Executing Gemini AI Skill Audit'}
              </h2>
              <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
                Extracting core requirements, mapping skill vectors, and building your personalized career bridge roadmap...
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-border/60 text-xs font-mono text-indigo-300">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                <span>Processing async job stream...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Error UI
  if (status === 'failed') {
    return (
      <MainLayout>
        <div className="container max-w-2xl py-24 px-6 mx-auto">
          <Alert variant="destructive" className="mb-8 border-rose-500/50 bg-rose-950/30 text-rose-200 p-6 rounded-2xl">
            <AlertCircle className="h-5 w-5 text-rose-400" />
            <AlertDescription className="text-sm font-semibold">{error || 'An error occurred during analysis.'}</AlertDescription>
          </Alert>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => router.push('/')} className="rounded-xl border-border/60">
              Try Another Input
            </Button>
            <Button onClick={() => router.push('/history')} className="rounded-xl bg-indigo-600 hover:bg-indigo-500">
              View History
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!analysis?.result) {
    return (
      <MainLayout>
        <div className="container max-w-2xl py-24 px-6 mx-auto text-center">
          <p className="text-slate-400 font-medium mb-4">No analysis record found for this ID.</p>
          <Button onClick={() => router.push('/')} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl">
            Start New Analysis
          </Button>
        </div>
      </MainLayout>
    );
  }

  const missingSkills = mapToMissingSkills(analysis.result.missingSkills);
  const learningSteps = mapToLearningSteps(analysis.result.learningPath);
  const interviewQuestions = mapToInterviewQuestions(analysis.result.interviewQuestions);

  // Compute a dynamic match score based on missing skills count
  const skillCount = missingSkills.length;
  const matchScore = Math.max(45, Math.min(95, 100 - skillCount * 7));

  return (
    <MainLayout>
      <div className="container max-w-6xl py-10 px-6 mx-auto">
        {/* Header Bar */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/40">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/')}
              className="mb-2 -ml-2 gap-1 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg"
            >
              <ArrowLeft className="h-4 w-4" />
              New Analysis
            </Button>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Skill Gap <span className="gradient-text">Audit Report</span>
            </h1>
            <div className="mt-2 flex items-center gap-3 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-md border border-border/50">
                <Clock className="h-3.5 w-3.5 text-indigo-400" />
                {formatDate(analysis.createdAt)}
              </span>

              {wasCached === false ? (
                <Badge variant="secondary" className="gap-1 bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  AI Processed: {((analysis.aiProcessingTimeMs ?? 1200) / 1000).toFixed(1)}s
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                  ⚡ Cached Result: {((analysis.requestTimeMs ?? 45) / 1000).toFixed(2)}s
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleCopyJSON}
              className="gap-2 bg-slate-900/80 hover:bg-slate-800 border-border/60 text-slate-200 text-xs font-semibold rounded-xl"
            >
              <Share2 className="h-3.5 w-3.5 text-indigo-400" />
              Copy Report Data
            </Button>
            <Button
              onClick={() => router.push('/')}
              className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20"
            >
              <Zap className="h-3.5 w-3.5" />
              New Run
            </Button>
          </div>
        </div>

        {/* Score & Summary Banner Card */}
        <div className="glass-card mb-8 rounded-2xl p-6 border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-purple-950/30">
          <div className="grid gap-6 md:grid-cols-12 items-center">
            {/* Radial Match Score */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-border/40">
              <RadialProgress value={matchScore} size={140} strokeWidth={12} />
              <div className="mt-3 text-center">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
                  Role Compatibility Fit
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  {matchScore >= 80 ? 'Strong Candidate Fit' : matchScore >= 65 ? 'Moderate Gap Index' : 'Significant Gap Priority'}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="md:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-400" />
                  Key Audit Findings
                </h3>
                <Badge variant="outline" className="bg-rose-500/10 text-rose-300 border-rose-500/30 text-xs font-bold">
                  {missingSkills.length} Identified Skill Gaps
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-border/40">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">High Priority Gaps</span>
                  <p className="text-lg font-extrabold text-rose-400 mt-0.5">
                    {missingSkills.filter(s => s.priority === 'high').length}
                  </p>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-border/40">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Learning Phases</span>
                  <p className="text-lg font-extrabold text-indigo-400 mt-0.5">
                    {learningSteps.length}
                  </p>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-border/40">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Target Questions</span>
                  <p className="text-lg font-extrabold text-purple-400 mt-0.5">
                    {interviewQuestions.length}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-border/30">
                💡 <span className="font-semibold text-white">Recommendation:</span> Focus on high-priority gaps first to maximize interview callback rates for this role profile.
              </p>
            </div>
          </div>
        </div>

        {/* Tabbed Analytics Content */}
        <Tabs defaultValue="gaps" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-900/80 p-1 rounded-xl border border-border/50 mb-8">
            <TabsTrigger value="gaps" className="rounded-lg text-xs font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              Skill Gap Matrix ({missingSkills.length})
            </TabsTrigger>
            <TabsTrigger value="roadmap" className="rounded-lg text-xs font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              Learning Roadmap ({learningSteps.length})
            </TabsTrigger>
            <TabsTrigger value="interview" className="rounded-lg text-xs font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              Practice Questions ({interviewQuestions.length})
            </TabsTrigger>
          </TabsList>

          {/* Missing Skills Tab */}
          <TabsContent value="gaps" className="mt-0">
            <Card className="glass-card border-border/60">
              <CardHeader className="bg-slate-900/40 border-b border-border/40">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Flame className="h-5 w-5 text-rose-400" />
                  Identified Missing Skill Competencies
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Core competencies specified in the job posting that were absent or understated in your resume.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-2.5">
                  {missingSkills.map((skill, index) => (
                    <MissingSkillBadge key={index} skill={skill} />
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-6 pt-4 border-t border-border/40 text-xs font-semibold text-slate-400">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                    High Severity Gap
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                    Medium Gap
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    Low Priority / Optional
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Learning Roadmap Tab */}
          <TabsContent value="roadmap" className="mt-0">
            <div className="space-y-4">
              {learningSteps.map((step, index) => (
                <Card key={step.id} className="glass-card border-border/60 overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 font-extrabold border border-indigo-500/30 text-sm">
                        0{index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-bold text-white text-base">{step.title}</h4>
                          <span className="text-[11px] px-2.5 py-0.5 rounded-md font-mono bg-slate-900 text-indigo-300 border border-border/50">
                            {step.estimatedTime}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed mb-3">{step.description}</p>
                        {step.resources?.[0] && (
                          <div className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>Recommended Resource: {step.resources[0]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Practice Questions Tab */}
          <TabsContent value="interview" className="mt-0">
            <div className="space-y-3">
              {interviewQuestions.map((q, index) => (
                <Card key={q.id} className="glass-card border-border/60">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                        Q{index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-extrabold text-purple-300 uppercase tracking-wide">
                            {q.skillTargeted}
                          </span>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold border-purple-500/30 text-purple-300 bg-purple-500/10">
                            {q.difficulty} Level
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-white leading-relaxed">{q.question}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
