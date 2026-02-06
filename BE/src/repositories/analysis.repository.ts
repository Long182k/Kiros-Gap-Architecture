/**
 * TDD: GREEN Phase - Analysis Repository implementation
 * Raw SQL queries for PostgreSQL (no ORM)
 */
import { pool } from '../db/index.js';
import type { GapAnalysisResult, AnalysisStatus } from '../schemas/analysis.schema.js';

export interface AnalysisRow {
  id: string;
  anonymous_user_id: string | null;
  content_hash: string;
  resume_text: string;
  job_description: string;
  resume_filename: string | null;
  status: AnalysisStatus;
  result: GapAnalysisResult | null;
  error_message: string | null;
  retry_count: number;
  created_at: Date;
  completed_at: Date | null;
  processing_time_ms: number | null;
}

export interface CreateAnalysisDTO {
  anonymousUserId: string | null;
  contentHash: string;
  resumeText: string;
  jobDescription: string;
  resumeFilename?: string | null;
}

export class AnalysisRepository {
  /**
   * Find analysis by content hash (for caching)
   */
  async findByHash(hash: string): Promise<AnalysisRow | null> {
    const query = `
      SELECT * FROM analyses 
      WHERE content_hash = $1 
      AND status = 'COMPLETED'
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const { rows } = await pool.query<AnalysisRow>(query, [hash]);
    return rows[0] || null;
  }

  /**
   * Find analysis by ID
   */
  async findById(id: string): Promise<AnalysisRow | null> {
    const query = `SELECT * FROM analyses WHERE id = $1`;
    const { rows } = await pool.query<AnalysisRow>(query, [id]);
    return rows[0] || null;
  }

  /**
   * Create new analysis
   */
  async create(data: CreateAnalysisDTO): Promise<AnalysisRow> {
    const query = `
      INSERT INTO analyses (
        anonymous_user_id,
        content_hash,
        resume_text,
        job_description,
        resume_filename,
        status
      ) VALUES ($1, $2, $3, $4, $5, 'PENDING')
      RETURNING *
    `;
    
    const params = [
      data.anonymousUserId,
      data.contentHash,
      data.resumeText,
      data.jobDescription,
      data.resumeFilename || null
    ];

    const { rows } = await pool.query<AnalysisRow>(query, params);
    return rows[0];
  }

  /**
   * Update analysis status
   */
  async updateStatus(id: string, status: AnalysisStatus): Promise<AnalysisRow | null> {
    const query = `
      UPDATE analyses 
      SET status = $2
      WHERE id = $1
      RETURNING *
    `;
    
    const { rows } = await pool.query<AnalysisRow>(query, [id, status]);
    return rows[0] || null;
  }

  /**
   * Update analysis with AI result
   */
  async updateResult(
    id: string, 
    result: GapAnalysisResult,
    processingTimeMs: number
  ): Promise<AnalysisRow | null> {
    const query = `
      UPDATE analyses 
      SET 
        status = 'COMPLETED',
        result = $2,
        completed_at = NOW(),
        processing_time_ms = $3
      WHERE id = $1
      RETURNING *
    `;
    
    const { rows } = await pool.query<AnalysisRow>(
      query, 
      [id, JSON.stringify(result), processingTimeMs]
    );
    return rows[0] || null;
  }

  /**
   * Update analysis with error (after retries exhausted)
   */
  async updateError(
    id: string, 
    errorMessage: string,
    retryCount: number
  ): Promise<AnalysisRow | null> {
    const query = `
      UPDATE analyses 
      SET 
        status = 'FAILED',
        error_message = $2,
        retry_count = $3,
        completed_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const { rows } = await pool.query<AnalysisRow>(
      query, 
      [id, errorMessage, retryCount]
    );
    return rows[0] || null;
  }

  /**
   * Increment retry count
   */
  async incrementRetry(id: string): Promise<number> {
    const query = `
      UPDATE analyses 
      SET retry_count = retry_count + 1
      WHERE id = $1
      RETURNING retry_count
    `;
    
    const { rows } = await pool.query<{ retry_count: number }>(query, [id]);
    return rows[0]?.retry_count || 0;
  }

  /**
   * Find analyses by anonymous user (for history)
   */
  async findByAnonymousUser(
    anonymousUserId: string, 
    limit: number = 10
  ): Promise<AnalysisRow[]> {
    const query = `
      SELECT * FROM analyses 
      WHERE anonymous_user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    
    const { rows } = await pool.query<AnalysisRow>(query, [anonymousUserId, limit]);
    return rows;
  }
}

// Export singleton instance
export const analysisRepository = new AnalysisRepository();
