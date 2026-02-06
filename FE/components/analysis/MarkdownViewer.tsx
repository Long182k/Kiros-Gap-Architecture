import { cn } from '@/lib/utils';
import { LearningStep, InterviewQuestion } from '@/types/analysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, MessageCircleQuestion, ChevronRight } from 'lucide-react';

interface LearningStepsViewerProps {
  steps: LearningStep[];
  className?: string;
}

export function LearningStepsViewer({ steps, className }: LearningStepsViewerProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {steps.map((step, index) => (
        <Card key={step.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg leading-tight">{step.title}</CardTitle>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{step.estimatedTime}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            {step.resources && step.resources.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {step.resources.map((resource, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    <BookOpen className="h-3 w-3" />
                    {resource}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface InterviewQuestionsViewerProps {
  questions: InterviewQuestion[];
  className?: string;
}

export function InterviewQuestionsViewer({ questions, className }: InterviewQuestionsViewerProps) {
  const difficultyColors = {
    easy: 'bg-success/15 text-success border-success/30',
    medium: 'bg-warning/15 text-warning border-warning/30',
    hard: 'bg-destructive/15 text-destructive border-destructive/30',
  };

  return (
    <div className={cn('space-y-3', className)}>
      {questions.map((question, index) => (
        <Card key={question.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground text-xs font-medium">
                Q{index + 1}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <p className="font-medium leading-relaxed">{question.question}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={cn('text-xs', difficultyColors[question.difficulty])}
                  >
                    {question.difficulty}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Targets: {question.skillTargeted}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
