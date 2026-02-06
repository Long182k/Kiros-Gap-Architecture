export interface MissingSkill {
  name: string;
  category: 'technical' | 'soft' | 'tool' | 'framework';
  priority: 'high' | 'medium' | 'low';
}

export interface LearningStep {
  id: number;
  title: string;
  description: string;
  estimatedTime: string;
  resources?: string[];
}

export interface InterviewQuestion {
  id: number;
  question: string;
  skillTargeted: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GapAnalysis {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  resumeText: string;
  jobDescription: string;
  targetRole: string;
  matchScore: number;
  missingSkills: MissingSkill[];
  learningSteps: LearningStep[];
  interviewQuestions: InterviewQuestion[];
  isCached: boolean;
}

export interface AnalysisInputData {
  resumeText: string;
  jobDescription: string;
}

export interface ValidationError {
  field: 'resumeText' | 'jobDescription' | 'ai_response' | 'general';
  message: string;
}

export interface AIResponse {
  success: boolean;
  data?: Omit<GapAnalysis, 'id' | 'createdAt' | 'updatedAt' | 'resumeText' | 'jobDescription' | 'isCached'>;
  error?: string;
}
