/**
 * TDD: RED Phase - Tests for Analysis Service
 */
import { AnalysisService } from './analysis.service.js';

// Mock dependencies
jest.mock('../repositories/analysis.repository.js');
jest.mock('../repositories/anonymous-user.repository.js');
jest.mock('../cache/analysis.cache.js');
jest.mock('../queues/analysis.queue.js');
jest.mock('../utils/hash.js');

import { analysisRepository } from '../repositories/analysis.repository.js';
import { anonymousUserRepository } from '../repositories/anonymous-user.repository.js';
import { analysisCache } from '../cache/analysis.cache.js';
import { addAnalysisJob } from '../queues/analysis.queue.js';
import { generateContentHash } from '../utils/hash.js';

const mockAnalysisRepo = analysisRepository as jest.Mocked<typeof analysisRepository>;
const mockAnonymousUserRepo = anonymousUserRepository as jest.Mocked<typeof anonymousUserRepository>;
const mockCache = analysisCache as jest.Mocked<typeof analysisCache>;
const mockAddJob = addAnalysisJob as jest.MockedFunction<typeof addAnalysisJob>;
const mockGenerateHash = generateContentHash as jest.MockedFunction<typeof generateContentHash>;

describe('AnalysisService', () => {
  let service: AnalysisService;

  beforeEach(() => {
    service = new AnalysisService();
    jest.clearAllMocks();
    mockGenerateHash.mockReturnValue('hash123');
  });

  describe('createAnalysis', () => {
    const validInput = {
      resumeText: 'A'.repeat(100),
      jobDescription: 'B'.repeat(100)
    };

    it('should return cached result when hash exists in Redis', async () => {
      const cachedResult = {
        missingSkills: ['Docker'],
        learningPath: [{ step: '1' }, { step: '2' }, { step: '3' }],
        interviewQuestions: ['Q1', 'Q2', 'Q3'],
        status: 'COMPLETED' as const
      };

      mockCache.get.mockResolvedValueOnce(cachedResult);
      mockAnalysisRepo.findByHash.mockResolvedValueOnce({
        id: 'existing-id',
        content_hash: 'hash123',
        status: 'COMPLETED',
        result: cachedResult
      } as any);

      const result = await service.createAnalysis(validInput, 'session123');

      expect(result.cached).toBe(true);
      expect(result.status).toBe('COMPLETED');
      expect(mockAddJob).not.toHaveBeenCalled();
    });

    it('should return cached result from DB when not in Redis', async () => {
      const dbResult = {
        id: 'db-id',
        content_hash: 'hash123',
        status: 'COMPLETED',
        result: { missingSkills: ['GraphQL'] }
      } as any;

      mockCache.get.mockResolvedValueOnce(null);
      mockAnalysisRepo.findByHash.mockResolvedValueOnce(dbResult);

      const result = await service.createAnalysis(validInput, 'session123');

      expect(result.cached).toBe(true);
      expect(result.id).toBe('db-id');
      // Should hydrate Redis cache
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should create new job when no cache exists', async () => {
      mockCache.get.mockResolvedValueOnce(null);
      mockAnalysisRepo.findByHash.mockResolvedValueOnce(null);
      mockAnonymousUserRepo.findOrCreateBySessionId.mockResolvedValueOnce({
        id: 'user-uuid',
        session_id: 'session123'
      } as any);
      mockAnalysisRepo.create.mockResolvedValueOnce({
        id: 'new-analysis-id',
        status: 'PENDING'
      } as any);
      mockAddJob.mockResolvedValueOnce('job-id');

      const result = await service.createAnalysis(validInput, 'session123');

      expect(result.cached).toBe(false);
      expect(result.status).toBe('PENDING');
      expect(mockAddJob).toHaveBeenCalled();
    });
  });

  describe('getAnalysis', () => {
    it('should return analysis by ID', async () => {
      const mockAnalysis = {
        id: 'uuid-123',
        status: 'COMPLETED',
        result: { missingSkills: ['Docker'] },
        created_at: new Date(),
        error_message: null,
        processing_time_ms: 1000
      } as any;

      mockAnalysisRepo.findById.mockResolvedValueOnce(mockAnalysis);

      const result = await service.getAnalysis('uuid-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('uuid-123');
    });

    it('should return null for non-existent ID', async () => {
      mockAnalysisRepo.findById.mockResolvedValueOnce(null);

      const result = await service.getAnalysis('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getHistory', () => {
    it('should return analysis history for session', async () => {
      const mockUser = { id: 'user-uuid' } as any;
      const mockHistory = [
        { id: 'a1', status: 'COMPLETED', created_at: new Date(), error_message: null, processing_time_ms: 1000 },
        { id: 'a2', status: 'PENDING', created_at: new Date(), error_message: null, processing_time_ms: null }
      ] as any[];

      mockAnonymousUserRepo.findBySessionId.mockResolvedValueOnce(mockUser);
      mockAnalysisRepo.findByAnonymousUser.mockResolvedValueOnce(mockHistory);

      const result = await service.getHistory('session123');

      expect(result).toHaveLength(2);
    });

    it('should return empty array for non-existent session', async () => {
      mockAnonymousUserRepo.findBySessionId.mockResolvedValueOnce(null);

      const result = await service.getHistory('nonexistent');

      expect(result).toEqual([]);
    });
  });
});
