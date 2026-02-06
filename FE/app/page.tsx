'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Briefcase, Sparkles, AlertCircle, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MainLayout } from '@/components/layout/MainLayout';
import { ValidationError } from '@/types/analysis';
import { analysisApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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

  const validateInput = (): boolean => {
    const newErrors: ValidationError[] = [];

    // Resume: need either file or text
    if (!resumeFile && !resumeText.trim()) {
      newErrors.push({ field: 'resumeText', message: 'Resume is required (upload PDF or paste text)' });
    } else if (!resumeFile && resumeText.trim().length < 50) {
      newErrors.push({ field: 'resumeText', message: 'Resume should be at least 50 characters' });
    }

    // JD: need either file or text
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
    
    try {
      // Call the real API
      const response = await analysisApi.createAnalysis({
        resumeText: resumeFile ? undefined : resumeText,
        jobDescription: jdFile ? undefined : jobDescription,
        resumeFile: resumeFile || undefined,
        jobDescriptionFile: jdFile || undefined,
      });

      if (response.cached && response.result) {
        // Cached result - show immediately
        toast({
          title: 'Cached Result Found',
          description: 'Showing your previous analysis for this combination.',
        });
        // Navigate to results page with cached state
        router.push(`/results/${response.id}?cached=true`);
      } else {
        toast({
          title: 'Analysis Started',
          description: 'Processing your gap analysis...',
        });
        // Navigate to results page
        router.push(`/results/${response.id}?cached=false`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to analyze';
      setErrors([{ 
        field: 'ai_response', 
        message,
      }]);
    } finally {
      setIsAnalyzing(false);
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
          title: 'Invalid file type',
          description: 'Please upload a PDF file.',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 10MB.',
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
      <div className="container max-w-6xl py-8 px-6 mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">New Gap Analysis</h1>
          <p className="mt-2 text-muted-foreground">
            Upload PDFs or paste text for your resume and target job description to identify skill gaps.
          </p>
        </div>

        {/* AI Error Alert */}
        {getFieldError('ai_response') && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{getFieldError('ai_response')}</AlertDescription>
          </Alert>
        )}

        {/* Input Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Resume Input */}
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Your Resume</CardTitle>
                    <CardDescription>Upload PDF or paste text</CardDescription>
                  </div>
                </div>
                <div>
                  <input
                    ref={resumeInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e, setResumeFile)}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resumeInputRef.current?.click()}
                    className="gap-1"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {resumeFile ? (
                <div className="flex-1 flex items-center justify-center border rounded-md bg-muted/50">
                  <div className="text-center p-6">
                    <FileText className="h-12 w-12 mx-auto text-primary mb-2" />
                    <p className="font-medium">{resumeFile.name}</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      {(resumeFile.size / 1024).toFixed(1)} KB
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResumeFile(null)}
                      className="gap-1"
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Textarea
                    placeholder="Paste your resume text here...

Example:
Software Engineer with 3 years of experience in React and Node.js. Built multiple web applications for e-commerce clients. Proficient in JavaScript, HTML, CSS, and REST APIs..."
                    value={resumeText}
                    onChange={(e) => {
                      setResumeText(e.target.value);
                      if (errors.length) setErrors([]);
                    }}
                    className="flex-1 min-h-[300px] resize-none"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {resumeText.length} characters
                  </p>
                </>
              )}
              {getFieldError('resumeText') && (
                <p className="mt-2 text-sm text-destructive">{getFieldError('resumeText')}</p>
              )}
            </CardContent>
          </Card>

          {/* Job Description Input */}
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Briefcase className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Target Job Description</CardTitle>
                    <CardDescription>Upload PDF or paste text</CardDescription>
                  </div>
                </div>
                <div>
                  <input
                    ref={jdInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e, setJdFile)}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => jdInputRef.current?.click()}
                    className="gap-1"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {jdFile ? (
                <div className="flex-1 flex items-center justify-center border rounded-md bg-muted/50">
                  <div className="text-center p-6">
                    <FileText className="h-12 w-12 mx-auto text-primary mb-2" />
                    <p className="font-medium">{jdFile.name}</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      {(jdFile.size / 1024).toFixed(1)} KB
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setJdFile(null)}
                      className="gap-1"
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Textarea
                    placeholder="Paste the job description here...

Example:
We are looking for a Senior Full Stack Developer with experience in React, TypeScript, Node.js, Docker, and AWS. You will be responsible for building scalable microservices..."
                    value={jobDescription}
                    onChange={(e) => {
                      setJobDescription(e.target.value);
                      if (errors.length) setErrors([]);
                    }}
                    className="flex-1 min-h-[300px] resize-none"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {jobDescription.length} characters
                  </p>
                </>
              )}
              {getFieldError('jobDescription') && (
                <p className="mt-2 text-sm text-destructive">{getFieldError('jobDescription')}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analyze Button */}
        <div className="mt-8 flex justify-center">
          <Button 
            size="lg" 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="gap-2 px-8"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Analyze Gaps
              </>
            )}
          </Button>
        </div>

        {/* Tips */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { title: 'PDF or Text', desc: 'Upload a PDF resume or paste text directly' },
            { title: 'Full Job Description', desc: 'Copy the entire job posting for accuracy' },
            { title: 'Specific Roles', desc: 'Best results with technical positions' },
          ].map((tip, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 text-center">
              <p className="font-medium">{tip.title}</p>
              <p className="text-sm text-muted-foreground">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
