/**
 * TDD: RED Phase - Tests for Analysis Schemas
 * These tests define the expected behavior BEFORE implementation
 */
import { 
  CreateAnalysisSchema, 
  GapAnalysisResultSchema,
  AnalysisStatusSchema,
  type CreateAnalysisInput,
  type GapAnalysisResult
} from './analysis.schema.js';

describe('CreateAnalysisSchema', () => {
  describe('🔴 RED → Valid inputs', () => {
    it('should accept valid resume text and job description', () => {
      const validInput = {
        resumeText: 'A'.repeat(100), // Min 50 chars
        jobDescription: 'B'.repeat(100)
      };
      
      const result = CreateAnalysisSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should accept optional resumeFilename', () => {
      const inputWithFilename = {
        resumeText: 'A'.repeat(100),
        jobDescription: 'B'.repeat(100),
        resumeFilename: 'resume.pdf'
      };
      
      const result = CreateAnalysisSchema.safeParse(inputWithFilename);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.resumeFilename).toBe('resume.pdf');
      }
    });
  });

  describe('🔴 RED → Invalid inputs', () => {
    it('should reject empty resume text', () => {
      const result = CreateAnalysisSchema.safeParse({
        resumeText: '',
        jobDescription: 'B'.repeat(100)
      });
      expect(result.success).toBe(false);
    });

    it('should reject resume text shorter than 50 characters', () => {
      const result = CreateAnalysisSchema.safeParse({
        resumeText: 'Too short',
        jobDescription: 'B'.repeat(100)
      });
      expect(result.success).toBe(false);
    });

    it('should reject job description shorter than 50 characters', () => {
      const result = CreateAnalysisSchema.safeParse({
        resumeText: 'A'.repeat(100),
        jobDescription: 'Short'
      });
      expect(result.success).toBe(false);
    });

    it('should reject resume text longer than 50000 characters', () => {
      const result = CreateAnalysisSchema.safeParse({
        resumeText: 'A'.repeat(50001),
        jobDescription: 'B'.repeat(100)
      });
      expect(result.success).toBe(false);
    });

    it('should reject job description longer than 10000 characters', () => {
      const result = CreateAnalysisSchema.safeParse({
        resumeText: 'A'.repeat(100),
        jobDescription: 'B'.repeat(10001)
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-string values', () => {
      const result = CreateAnalysisSchema.safeParse({
        resumeText: 123,
        jobDescription: 'B'.repeat(100)
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('GapAnalysisResultSchema', () => {
  const validResult: GapAnalysisResult = {
    missingSkills: ['Docker', 'GraphQL', 'Kubernetes'],
    learningPath: [
      { step: 'Build a CRUD app using Docker', resource: 'https://docker.com/docs' },
      { step: 'Create a GraphQL API with Apollo', resource: 'https://apollographql.com' },
      { step: 'Deploy to Kubernetes cluster' }
    ],
    interviewQuestions: [
      'Explain container orchestration with Kubernetes',
      'How do GraphQL resolvers work?',
      'What is the difference between Docker and VM?'
    ],
    status: 'COMPLETED'
  };

  describe('🔴 RED → Valid AI output', () => {
    it('should accept valid gap analysis result', () => {
      const result = GapAnalysisResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });

    it('should accept learning path without optional resource', () => {
      const resultWithoutResources = {
        ...validResult,
        learningPath: [
          { step: 'Step 1' },
          { step: 'Step 2' },
          { step: 'Step 3' }
        ]
      };
      
      const result = GapAnalysisResultSchema.safeParse(resultWithoutResources);
      expect(result.success).toBe(true);
    });

    it('should accept FAILED status', () => {
      const failedResult = {
        ...validResult,
        status: 'FAILED'
      };
      
      const result = GapAnalysisResultSchema.safeParse(failedResult);
      expect(result.success).toBe(true);
    });
  });

  describe('🔴 RED → Invalid AI output', () => {
    it('should reject empty missingSkills array', () => {
      const result = GapAnalysisResultSchema.safeParse({
        ...validResult,
        missingSkills: []
      });
      expect(result.success).toBe(false);
    });

    it('should reject learningPath with less than 3 steps', () => {
      const result = GapAnalysisResultSchema.safeParse({
        ...validResult,
        learningPath: [{ step: 'Only one step' }]
      });
      expect(result.success).toBe(false);
    });

    it('should reject learningPath with more than 3 steps', () => {
      const result = GapAnalysisResultSchema.safeParse({
        ...validResult,
        learningPath: [
          { step: '1' }, { step: '2' }, { step: '3' }, { step: '4' }
        ]
      });
      expect(result.success).toBe(false);
    });

    it('should reject interviewQuestions with less than 3 questions', () => {
      const result = GapAnalysisResultSchema.safeParse({
        ...validResult,
        interviewQuestions: ['Only one question']
      });
      expect(result.success).toBe(false);
    });

    it('should reject interviewQuestions with more than 3 questions', () => {
      const result = GapAnalysisResultSchema.safeParse({
        ...validResult,
        interviewQuestions: ['1', '2', '3', '4']
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const result = GapAnalysisResultSchema.safeParse({
        ...validResult,
        status: 'INVALID_STATUS'
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const result = GapAnalysisResultSchema.safeParse({
        missingSkills: ['Docker']
        // missing other fields
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('AnalysisStatusSchema', () => {
  it('should accept PENDING status', () => {
    expect(AnalysisStatusSchema.safeParse('PENDING').success).toBe(true);
  });

  it('should accept PROCESSING status', () => {
    expect(AnalysisStatusSchema.safeParse('PROCESSING').success).toBe(true);
  });

  it('should accept COMPLETED status', () => {
    expect(AnalysisStatusSchema.safeParse('COMPLETED').success).toBe(true);
  });

  it('should accept FAILED status', () => {
    expect(AnalysisStatusSchema.safeParse('FAILED').success).toBe(true);
  });

  it('should reject invalid status', () => {
    expect(AnalysisStatusSchema.safeParse('UNKNOWN').success).toBe(false);
  });
});
