/**
 * TDD: RED Phase - Tests for Analysis Repository
 */
import { AnalysisRepository } from './analysis.repository.js';
import { pool } from '../db/index.js';
import type { AnalysisStatus } from '../schemas/analysis.schema.js';

// Mock the database pool
jest.mock('../db/index.js', () => ({
  query: jest.fn(),
  pool: {
    query: jest.fn()
  }
}));

const mockQuery = pool.query as jest.Mock;

describe('AnalysisRepository', () => {
  let repository: AnalysisRepository;

  beforeEach(() => {
    repository = new AnalysisRepository();
    jest.clearAllMocks();
  });

  describe('findByHash', () => {
    it('should return analysis when hash exists', async () => {
      const mockAnalysis = {
        id: 'uuid-123',
        content_hash: 'abc123',
        status: 'COMPLETED',
        result: { missingSkills: ['Docker'] }
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [mockAnalysis] });

      const result = await repository.findByHash('abc123');
      
      expect(result).toBeDefined();
      expect(result?.id).toBe('uuid-123');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('content_hash'),
        ['abc123']
      );
    });

    it('should return null when hash not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await repository.findByHash('nonexistent');
      
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return analysis by ID', async () => {
      const mockAnalysis = {
        id: 'uuid-123',
        status: 'PROCESSING'
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [mockAnalysis] });

      const result = await repository.findById('uuid-123');
      
      expect(result?.id).toBe('uuid-123');
    });

    it('should return null for non-existent ID', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await repository.findById('nonexistent');
      
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create new analysis and return it', async () => {
      const newAnalysis = {
        anonymousUserId: 'user-123',
        contentHash: 'hash-abc',
        resumeText: 'Resume...',
        jobDescription: 'JD...',
        resumeFilename: 'resume.pdf'
      };

      const mockCreated = {
        id: 'new-uuid',
        ...newAnalysis,
        status: 'PENDING'
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockCreated] });

      const result = await repository.create(newAnalysis);
      
      expect(result.id).toBe('new-uuid');
      expect(result.status).toBe('PENDING');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO analyses'),
        expect.any(Array)
      );
    });
  });

  describe('updateStatus', () => {
    it('should update analysis status', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'uuid-123', status: 'PROCESSING' }] });

      const result = await repository.updateStatus('uuid-123', 'PROCESSING');
      
      expect(result?.status).toBe('PROCESSING');
    });
  });

  describe('updateResult', () => {
    it('should update analysis with result and set COMPLETED status', async () => {
      const result = {
        missingSkills: ['Docker'],
        learningPath: [{ step: 'Learn Docker' }, { step: '2' }, { step: '3' }],
        interviewQuestions: ['Q1', 'Q2', 'Q3'],
        status: 'COMPLETED' as const
      };

      mockQuery.mockResolvedValueOnce({ 
        rows: [{ id: 'uuid-123', status: 'COMPLETED', result }] 
      });

      const updated = await repository.updateResult('uuid-123', result, 1500);
      
      expect(updated?.status).toBe('COMPLETED');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('processing_time_ms'),
        expect.any(Array)
      );
    });
  });

  describe('findByAnonymousUser', () => {
    it('should return analyses for anonymous user', async () => {
      const mockAnalyses = [
        { id: 'uuid-1', status: 'COMPLETED' },
        { id: 'uuid-2', status: 'PENDING' }
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockAnalyses });

      const results = await repository.findByAnonymousUser('user-123', 10);
      
      expect(results).toHaveLength(2);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining(['user-123', 10])
      );
    });

    it('should return empty array when no analyses found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const results = await repository.findByAnonymousUser('user-123', 10);
      
      expect(results).toEqual([]);
    });
  });
});
