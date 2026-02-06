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

const MAX_RETRIES = 3;

/**
 * Process a single analysis job
 */
async function processAnalysisJob(
  job: Job<AnalysisJobData, AnalysisJobResult>
): Promise<AnalysisJobResult> {
  const startTime = Date.now();
  const { analysisId, resumeText, jobDescription } = job.data;
  
  console.log(`[Worker] Processing job ${job.id} for analysis ${analysisId}`);

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
        console.log(`[Worker] Attempt ${attempt} failed: ${lastError}`);
        await analysisRepository.incrementRetry(analysisId);
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Worker] Attempt ${attempt} error:`, lastError);
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

    console.log(`[Worker] Job ${job.id} completed in ${processingTimeMs}ms`);

    return {
      success: true,
      analysisId,
      processingTimeMs,
    };
  } else {
    // All retries exhausted
    await analysisRepository.updateError(analysisId, lastError, MAX_RETRIES);

    console.error(`[Worker] Job ${job.id} failed after ${MAX_RETRIES} attempts`);

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
    console.log(`[Worker] Job ${job.id} completed:`, result.success ? 'SUCCESS' : 'FAILED');
  });

  worker.on('failed', (job, error) => {
    console.error(`[Worker] Job ${job?.id} failed:`, error.message);
  });

  worker.on('error', (error) => {
    console.error('[Worker] Worker error:', error);
  });

  console.log('[Worker] Analysis worker started');

  return worker;
}

// Export worker instance
export const analysisWorker = createAnalysisWorker();
