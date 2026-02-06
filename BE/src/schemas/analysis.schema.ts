/**
 * TDD: GREEN Phase - Implement schemas to pass tests
 */
import { z } from 'zod';

// ============================================
// Input Schemas
// ============================================

/**
 * Schema for creating a new analysis request
 * Validates resume and job description inputs
 */
export const CreateAnalysisSchema = z.object({
  resumeText: z
    .string()
    .min(50, 'Resume must be at least 50 characters')
    .max(50000, 'Resume must not exceed 50,000 characters'),
  jobDescription: z
    .string()
    .min(50, 'Job description must be at least 50 characters')
    .max(10000, 'Job description must not exceed 10,000 characters'),
  resumeFilename: z.string().optional()
});

export type CreateAnalysisInput = z.infer<typeof CreateAnalysisSchema>;

// ============================================
// AI Output Schemas
// ============================================

/**
 * Learning path step with optional resource
 */
export const LearningStepSchema = z.object({
  step: z.string().min(1, 'Step description is required'),
  resource: z.string().url().optional().or(z.string().optional())
});

export type LearningStep = z.infer<typeof LearningStepSchema>;

/**
 * Complete gap analysis result from AI
 * Enforces exactly 3 learning steps and 3 interview questions
 */
export const GapAnalysisResultSchema = z.object({
  missingSkills: z
    .array(z.string())
    .min(1, 'At least one missing skill required'),
  learningPath: z
    .array(LearningStepSchema)
    .length(3, 'Exactly 3 learning steps required'),
  interviewQuestions: z
    .array(z.string())
    .length(3, 'Exactly 3 interview questions required'),
  status: z.enum(['COMPLETED', 'FAILED'])
});

export type GapAnalysisResult = z.infer<typeof GapAnalysisResultSchema>;

// ============================================
// Status Schemas
// ============================================

/**
 * Analysis status enum
 */
export const AnalysisStatusSchema = z.enum([
  'PENDING',
  'PROCESSING', 
  'COMPLETED',
  'FAILED'
]);

export type AnalysisStatus = z.infer<typeof AnalysisStatusSchema>;

// ============================================
// Database Record Schemas
// ============================================

/**
 * Full analysis record from database
 */
export const AnalysisRecordSchema = z.object({
  id: z.string().uuid(),
  anonymousUserId: z.string().uuid().nullable(),
  contentHash: z.string().length(64),
  resumeText: z.string(),
  jobDescription: z.string(),
  resumeFilename: z.string().nullable(),
  status: AnalysisStatusSchema,
  result: GapAnalysisResultSchema.nullable(),
  errorMessage: z.string().nullable(),
  retryCount: z.number().int().min(0),
  createdAt: z.date(),
  completedAt: z.date().nullable(),
  processingTimeMs: z.number().int().nullable()
});

export type AnalysisRecord = z.infer<typeof AnalysisRecordSchema>;

// ============================================
// API Response Schemas
// ============================================

/**
 * Response for analysis creation (202 Accepted or 200 Cached)
 */
export const CreateAnalysisResponseSchema = z.object({
  id: z.string().uuid(),
  status: AnalysisStatusSchema,
  cached: z.boolean(),
  result: GapAnalysisResultSchema.optional()
});

export type CreateAnalysisResponse = z.infer<typeof CreateAnalysisResponseSchema>;

/**
 * Response for polling analysis status
 * - aiProcessingTimeMs: Actual AI processing time (from worker)
 * - requestTimeMs: Request handling time (from middleware)
 */
export const GetAnalysisResponseSchema = z.object({
  id: z.string().uuid(),
  status: AnalysisStatusSchema,
  result: GapAnalysisResultSchema.optional(),
  errorMessage: z.string().optional(),
  aiProcessingTimeMs: z.number().optional(),
  createdAt: z.string().datetime()
});

export type GetAnalysisResponse = z.infer<typeof GetAnalysisResponseSchema>;
