/**
 * BullMQ Analysis Worker
 * Processes AI gap analysis jobs with retry logic
 */
import { Worker, Job } from 'bullmq';
import { redisConnection } from '../cache/redis.js';
import { 
  QUEUE_NAME, 
  type AnalysisJobData, 
  type AnalysisJobResult 
} from '../queues/analysis.queue.js';
import { GeminiProvider } from '../ai/gemini.provider.js';
import { parseAIResponse, generateCorrectionPrompt } from '../utils/ai-response-parser.js';
import { GapAnalysisResultSchema, type GapAnalysisResult } from '../schemas/analysis.schema.js';
import { analysisRepository } from '../repositories/analysis.repository.js';
import { analysisCache } from '../cache/analysis.cache.js';
import { generateContentHash } from '../utils/hash.js';
import logger from '../utils/logger.js';

const MAX_RETRIES = 3;

/**
 * Process a single analysis job
 */
async function processAnalysisJob(
  job: Job<AnalysisJobData, AnalysisJobResult>
): Promise<AnalysisJobResult> {
  const startTime = Date.now();
  const { analysisId, resumeText, jobDescription } = job.data;
  
  logger.info('Processing analysis job', { jobId: job.id, analysisId });

  // Update status to PROCESSING
  await analysisRepository.updateStatus(analysisId, 'PROCESSING');

  const aiProvider = new GeminiProvider();
  let lastError = '';
  let result: GapAnalysisResult | null = null;

  // Retry loop with correction prompts
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await job.updateProgress(((attempt - 1) / MAX_RETRIES) * 100);

      // Get AI response
      let aiResponse: string;
      if (attempt === 1) {
        aiResponse = await aiProvider.analyze(resumeText, jobDescription);
      } else {
        aiResponse = await aiProvider.analyzeWithCorrection(
          resumeText,
          jobDescription,
          lastError
        );
      }

      // Parse and validate response
      const parseResult = parseAIResponse(aiResponse, GapAnalysisResultSchema);

      if (parseResult.success && parseResult.data) {
        result = parseResult.data;
        break; // Success!
      } else {
        lastError = parseResult.error || 'Unknown validation error';
        logger.warn('AI response validation failed', { jobId: job.id, attempt, error: lastError });
        await analysisRepository.incrementRetry(analysisId);
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      logger.error('AI processing error', { jobId: job.id, attempt, error: lastError });
      await analysisRepository.incrementRetry(analysisId);
    }
  }

  const processingTimeMs = Date.now() - startTime;

  // Handle success or failure
  if (result) {
    // Save to database
    await analysisRepository.updateResult(analysisId, result, processingTimeMs);

    // Cache the result
    const contentHash = generateContentHash(resumeText, jobDescription);
    await analysisCache.set(contentHash, result);

    await job.updateProgress(100);

    logger.info('Job completed successfully', { jobId: job.id, processingTimeMs });

    return {
      success: true,
      analysisId,
      processingTimeMs,
    };
  } else {
    // All retries exhausted
    await analysisRepository.updateError(analysisId, lastError, MAX_RETRIES);

    logger.error('Job failed after all retries', { jobId: job.id, attempts: MAX_RETRIES, error: lastError });

    return {
      success: false,
      analysisId,
      processingTimeMs,
      error: lastError,
    };
  }
}

/**
 * Create and start the worker
 */
export function createAnalysisWorker(): Worker<AnalysisJobData, AnalysisJobResult> {
  const worker = new Worker<AnalysisJobData, AnalysisJobResult>(
    QUEUE_NAME,
    processAnalysisJob,
    {
      connection: redisConnection,
      concurrency: 5, // Process 5 jobs concurrently
      limiter: {
        max: 10, // Max 10 jobs per
        duration: 60000, // 60 seconds (rate limiting for AI API)
      },
    }
  );

  worker.on('completed', (job, result) => {
    logger.info('Job completed', { jobId: job.id, success: result.success });
  });

  worker.on('failed', (job, error) => {
    logger.error('Job failed', { jobId: job?.id, error: error.message });
  });

  worker.on('error', (error) => {
    logger.error('Worker error', { error: error.message });
  });

  logger.info('Analysis worker started');

  return worker;
}

// Export worker instance
export const analysisWorker = createAnalysisWorker();
