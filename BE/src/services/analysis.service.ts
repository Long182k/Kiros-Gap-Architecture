/**
 * TDD: GREEN Phase - Analysis Service Implementation
 * Business logic orchestrator
 */
import { 
  analysisRepository, 
  type AnalysisRow,
  type CreateAnalysisDTO 
} from '../repositories/analysis.repository.js';
import { anonymousUserRepository } from '../repositories/anonymous-user.repository.js';
import { analysisCache } from '../cache/analysis.cache.js';
import { addAnalysisJob } from '../queues/analysis.queue.js';
import { generateContentHash } from '../utils/hash.js';
import { 
  type CreateAnalysisInput, 
  type GapAnalysisResult,
  type CreateAnalysisResponse,
  type GetAnalysisResponse
} from '../schemas/analysis.schema.js';

export class AnalysisService {
  /**
   * Create or return cached analysis
   */
  async createAnalysis(
    input: CreateAnalysisInput,
    sessionId: string
  ): Promise<CreateAnalysisResponse> {
    const { resumeText, jobDescription, resumeFilename } = input;
    
    // Generate content hash for caching
    const contentHash = generateContentHash(resumeText, jobDescription);

    // Check L1 Cache (Redis)
    const cachedResult = await analysisCache.get<GapAnalysisResult>(contentHash);
    if (cachedResult) {
      // Find existing analysis record
      const existingAnalysis = await analysisRepository.findByHash(contentHash);
      if (existingAnalysis) {
        return {
          id: existingAnalysis.id,
          status: 'COMPLETED',
          cached: true,
          result: cachedResult
        };
      }
    }

    // Check L2 Cache (PostgreSQL)
    const dbCachedAnalysis = await analysisRepository.findByHash(contentHash);
    if (dbCachedAnalysis && dbCachedAnalysis.result) {
      // Hydrate Redis cache
      await analysisCache.set(contentHash, dbCachedAnalysis.result);
      
      return {
        id: dbCachedAnalysis.id,
        status: 'COMPLETED',
        cached: true,
        result: dbCachedAnalysis.result
      };
    }

    // No cache - create new analysis
    // Get or create anonymous user
    const anonymousUser = await anonymousUserRepository.findOrCreateBySessionId(sessionId);

    // Create analysis record
    const createData: CreateAnalysisDTO = {
      anonymousUserId: anonymousUser.id,
      contentHash,
      resumeText,
      jobDescription,
      resumeFilename: resumeFilename || null
    };

    const newAnalysis = await analysisRepository.create(createData);

    // Add job to queue
    await addAnalysisJob({
      analysisId: newAnalysis.id,
      resumeText,
      jobDescription
    });

    return {
      id: newAnalysis.id,
      status: 'PENDING',
      cached: false,
    };
  }

  /**
   * Get analysis by ID (for polling)
   * Checks Redis first by contentHash, then falls back to DB
   */
  async getAnalysis(id: string): Promise<GetAnalysisResponse | null> {
    // First get the analysis from DB to get the contentHash
    const analysis = await analysisRepository.findById(id);
    
    if (!analysis) return null;

    // If analysis is completed, check Redis cache first
    if (analysis.status === 'COMPLETED' && analysis.content_hash) {
      const cachedResult = await analysisCache.get<GapAnalysisResult>(analysis.content_hash);
      if (cachedResult) {
        return {
          id: analysis.id,
          status: analysis.status,
          result: cachedResult,
          aiProcessingTimeMs: analysis.processing_time_ms || undefined,
          createdAt: analysis.created_at.toISOString()
        };
      }
    }

    return this.mapToResponse(analysis);
  }

  /**
   * Get analysis history for session
   */
  async getHistory(sessionId: string, limit: number = 10): Promise<GetAnalysisResponse[]> {
    const user = await anonymousUserRepository.findBySessionId(sessionId);
    
    if (!user) return [];

    const analyses = await analysisRepository.findByAnonymousUser(user.id, limit);
    
    return analyses.map(this.mapToResponse);
  }

  /**
   * Map database row to API response
   * aiProcessingTimeMs = actual AI processing time (from worker)
   * requestTimeMs = request handling time (from middleware)
   */
  private mapToResponse(analysis: AnalysisRow): GetAnalysisResponse {
    return {
      id: analysis.id,
      status: analysis.status,
      result: analysis.result || undefined,
      errorMessage: analysis.error_message || undefined,
      aiProcessingTimeMs: analysis.processing_time_ms || undefined,
      createdAt: analysis.created_at.toISOString()
    };
  }
}

// Export singleton
export const analysisService = new AnalysisService();
