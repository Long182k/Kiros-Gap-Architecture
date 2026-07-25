'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Briefcase, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  Upload, 
  X, 
  Zap, 
  CheckCircle2, 
  ShieldCheck, 
  BrainCircuit,
  ArrowRight,
  FileCheck2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MainLayout } from '@/components/layout/MainLayout';
import { ValidationError } from '@/types/analysis';
import { analysisApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const SAMPLE_RESUME = `THONG LONG NGUYEN
Senior Full Stack & AI Software Engineer | Ho Chi Minh City, Vietnam

SUMMARY:
Results-driven Software Engineer with 4+ years of experience designing and scaling web applications using React, Next.js, TypeScript, Node.js, and Python. Proven track record of optimizing application performance and integrating AI models.

WORK EXPERIENCE:
• Software Engineer at VinRobotics (Jan 2026 - Present): Developing AI-powered robotics control software using Next.js 15, TypeScript, WebSockets, and ROS2 middleware.
• Software Engineer at ZTO Express (Mar 2024 - Dec 2025): Spearheaded high-throughput logistics management dashboards handling 50,000+ daily orders using React, GraphQL, and Redis caching.
• Frontend Engineer at Guvi (Nov 2022 - Feb 2024): Designed dynamic customer-facing web components using React, TailwindCSS, and Redux Toolkit.

SKILLS:
Languages: TypeScript, JavaScript, Python, SQL, HTML/CSS
Frontend: React, Next.js, Redux, TailwindCSS, WebSockets
Backend: Node.js, Express, PostgreSQL, Redis, Docker, REST APIs
Tools: Git, Linux, Vercel, Docker Compose, CI/CD Pipelines`;

const SAMPLE_JD = `Role: Principal AI Platform Architect
Company: CyberScale Technologies

About the Role:
We are seeking an experienced Principal Architect to lead the design and deployment of large-scale LLM application pipelines, Kubernetes infrastructure, and real-time distributed data streams.

Key Requirements:
• 6+ years of experience architecting distributed cloud platforms on AWS / GCP.
• Deep expertise in Kubernetes (K8s), Helm, Terraform, and Infrastructure as Code (IaC).
• Proficiency in Python, C++, or Rust for high-performance computing.
• Hands-on experience with LLM orchestration frameworks: LangChain, LlamaIndex, vLLM, and Vector Databases (Milvus / Qdrant).
• Experience leading cross-functional engineering teams and establishing SOC2 security compliance.
• Strong expertise in Kafka streaming pipelines and Prometheus / Grafana observability stacks.`;

export default function AnalysisInputPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Text inputs
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  
  // File inputs
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);
  
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);

  const loadDemoData = () => {
    setResumeText(SAMPLE_RESUME);
    setJobDescription(SAMPLE_JD);
    setResumeFile(null);
    setJdFile(null);
    setErrors([]);
    toast({
      title: 'Demo Sample Loaded ⚡',
      description: 'Sample Resume & Job Description loaded into fields.',
    });
  };

  const validateInput = (): boolean => {
    const newErrors: ValidationError[] = [];

    if (!resumeFile && !resumeText.trim()) {
      newErrors.push({ field: 'resumeText', message: 'Resume is required (upload PDF or paste text)' });
    } else if (!resumeFile && resumeText.trim().length < 50) {
      newErrors.push({ field: 'resumeText', message: 'Resume should be at least 50 characters' });
    }

    if (!jdFile && !jobDescription.trim()) {
      newErrors.push({ field: 'jobDescription', message: 'Job description is required (upload PDF or paste text)' });
    } else if (!jdFile && jobDescription.trim().length < 50) {
      newErrors.push({ field: 'jobDescription', message: 'Job description should be at least 50 characters' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleAnalyze = async () => {
    if (!validateInput()) return;

    setIsAnalyzing(true);
    setAnalysisStep(1);

    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1200);

    try {
      const response = await analysisApi.createAnalysis({
        resumeText: resumeFile ? undefined : resumeText,
        jobDescription: jdFile ? undefined : jobDescription,
        resumeFile: resumeFile || undefined,
        jobDescriptionFile: jdFile || undefined,
      });

      clearInterval(stepInterval);

      if (response.cached && response.result) {
        toast({
          title: 'Cached Result Found',
          description: 'Showing existing analysis for this input combination.',
        });
        router.push(`/results/${response.id}?cached=true`);
      } else {
        toast({
          title: 'Analysis Completed ✨',
          description: 'Your skill gap matrix has been generated.',
        });
        router.push(`/results/${response.id}?cached=false`);
      }
    } catch (error) {
      clearInterval(stepInterval);
      const message = error instanceof Error ? error.message : 'Failed to analyze';
      setErrors([{ 
        field: 'ai_response', 
        message,
      }]);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Invalid file format',
          description: 'Please upload a PDF document.',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'File size limit is 10MB.',
          variant: 'destructive',
        });
        return;
      }
      setFile(file);
      setErrors([]);
    }
  };

  const getFieldError = (field: ValidationError['field']) => {
    return errors.find(e => e.field === field)?.message;
  };

  return (
    <MainLayout>
      <div className="container max-w-6xl py-10 px-6 mx-auto relative">
        {/* Decorative Ambient Lights */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* Header Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-border/40">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
              <BrainCircuit className="h-3.5 w-3.5" />
              AI Skill Matrix Intelligence
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Resume <span className="gradient-text">Gap Architecture</span>
            </h1>
            <p className="mt-2 text-base text-muted-foreground max-w-2xl leading-relaxed">
              Upload your CV and target position specs to instantly pinpoint missing skills, calculate compatibility score, and generate a step-by-step career path.
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={loadDemoData}
            className="gap-2 bg-indigo-950/40 hover:bg-indigo-900/60 border-indigo-500/30 text-indigo-200 font-semibold shadow-sm transition-all hover:scale-105"
          >
            <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
            Load Sample Demo Data
          </Button>
        </div>

        {/* Error Alert */}
        {getFieldError('ai_response') && (
          <Alert variant="destructive" className="mb-8 border-rose-500/50 bg-rose-950/30 text-rose-200">
            <AlertCircle className="h-4 w-4 text-rose-400" />
            <AlertDescription className="font-medium">{getFieldError('ai_response')}</AlertDescription>
          </Alert>
        )}

        {/* Dual Column Inputs */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Candidate Resume Input Card */}
          <Card className="glass-card flex flex-col overflow-hidden border-border/60">
            <CardHeader className="bg-slate-900/50 border-b border-border/40 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-white">Candidate Resume</CardTitle>
                    <CardDescription className="text-xs text-slate-400">PDF document or raw text</CardDescription>
                  </div>
                </div>

                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, setResumeFile)}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => resumeInputRef.current?.click()}
                  className="gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-semibold"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload PDF
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-5">
              {resumeFile ? (
                <div className="flex-1 flex items-center justify-center border border-dashed border-indigo-500/30 rounded-xl bg-indigo-950/20 p-6">
                  <div className="text-center">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                      <FileCheck2 className="h-8 w-8" />
                    </div>
                    <p className="font-bold text-white text-base">{resumeFile.name}</p>
                    <p className="text-xs text-slate-400 mt-1 mb-4">
                      {(resumeFile.size / 1024).toFixed(1)} KB • PDF Document Attached
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResumeFile(null)}
                      className="gap-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-xs"
                    >
                      <X className="h-3.5 w-3.5" />
                      Remove & Change Input
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <Textarea
                    placeholder="Paste resume text here (e.g. Work Experience, Technical Skills, Education)..."
                    value={resumeText}
                    onChange={(e) => {
                      setResumeText(e.target.value);
                      if (errors.length) setErrors([]);
                    }}
                    className="flex-1 min-h-[320px] bg-slate-950/60 border-border/50 focus:border-indigo-500/60 text-slate-200 placeholder:text-slate-500 text-sm leading-relaxed rounded-xl resize-none p-4"
                  />
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span>Minimum 50 characters required</span>
                    <span className="font-mono bg-slate-900 px-2 py-0.5 rounded border border-border/40">
                      {resumeText.length} chars
                    </span>
                  </div>
                </div>
              )}
              {getFieldError('resumeText') && (
                <p className="mt-2 text-xs font-semibold text-rose-400 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> {getFieldError('resumeText')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Job Description Input Card */}
          <Card className="glass-card flex flex-col overflow-hidden border-border/60">
            <CardHeader className="bg-slate-900/50 border-b border-border/40 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-white">Target Job Specs</CardTitle>
                    <CardDescription className="text-xs text-slate-400">PDF document or raw text</CardDescription>
                  </div>
                </div>

                <input
                  ref={jdInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, setJdFile)}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => jdInputRef.current?.click()}
                  className="gap-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-xs font-semibold"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload PDF
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-5">
              {jdFile ? (
                <div className="flex-1 flex items-center justify-center border border-dashed border-purple-500/30 rounded-xl bg-purple-950/20 p-6">
                  <div className="text-center">
                    <div className="h-14 w-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-3">
                      <FileCheck2 className="h-8 w-8" />
                    </div>
                    <p className="font-bold text-white text-base">{jdFile.name}</p>
                    <p className="text-xs text-slate-400 mt-1 mb-4">
                      {(jdFile.size / 1024).toFixed(1)} KB • PDF Document Attached
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setJdFile(null)}
                      className="gap-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-xs"
                    >
                      <X className="h-3.5 w-3.5" />
                      Remove & Change Input
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <Textarea
                    placeholder="Paste job posting details here (e.g. Roles, Key Responsibilities, Technical Requirements)..."
                    value={jobDescription}
                    onChange={(e) => {
                      setJobDescription(e.target.value);
                      if (errors.length) setErrors([]);
                    }}
                    className="flex-1 min-h-[320px] bg-slate-950/60 border-border/50 focus:border-purple-500/60 text-slate-200 placeholder:text-slate-500 text-sm leading-relaxed rounded-xl resize-none p-4"
                  />
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span>Minimum 50 characters required</span>
                    <span className="font-mono bg-slate-900 px-2 py-0.5 rounded border border-border/40">
                      {jobDescription.length} chars
                    </span>
                  </div>
                </div>
              )}
              {getFieldError('jobDescription') && (
                <p className="mt-2 text-xs font-semibold text-rose-400 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> {getFieldError('jobDescription')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Button */}
        <div className="mt-10 flex flex-col items-center justify-center">
          <Button 
            size="lg" 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="relative group overflow-hidden px-10 py-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] text-white font-extrabold text-base shadow-xl shadow-indigo-500/25 transition-all duration-300 hover:scale-105 hover:bg-[position:right_center]"
          >
            {isAnalyzing ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
                <span>Building Gap Matrix...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
                <span>Run AI Gap Architecture</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            )}
          </Button>

          {/* Loading Progress Indicator */}
          {isAnalyzing && (
            <div className="mt-6 w-full max-w-md bg-slate-900/80 border border-indigo-500/30 rounded-xl p-4 backdrop-blur-md">
              <div className="flex justify-between text-xs text-indigo-300 font-semibold mb-2">
                <span>
                  {analysisStep === 1 && 'Parsing Input Specifications...'}
                  {analysisStep === 2 && 'Extracting Core Competencies...'}
                  {analysisStep === 3 && 'Evaluating Skill Gap Vectors...'}
                </span>
                <span>{analysisStep * 33}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${analysisStep * 33}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Feature Cards */}
        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {[
            { 
              icon: ShieldCheck, 
              color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
              title: "98% Accurate Extraction", 
              desc: "Deep NLP analyzes technical keywords, frameworks, and job tier requirements." 
            },
            { 
              icon: BrainCircuit, 
              color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
              title: "Hard & Soft Skill Matrix", 
              desc: "Categorized gap severity rating (High, Medium, Low) for targeted career prep." 
            },
            { 
              icon: CheckCircle2, 
              color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
              title: "Career Bridge Roadmap", 
              desc: "Step-by-step estimated timeframes & resume bullet optimization recommendations." 
            },
          ].map((feature, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 border border-border/50 flex flex-col gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${feature.color}`}>
                <feature.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">{feature.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
