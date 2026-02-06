/**
 * BullMQ Analysis Queue Configuration
 */
import { Queue, QueueOptions } from 'bullmq';
import { redisConnection } from '../cache/redis.js';

export const QUEUE_NAME = 'analysisQueue';

const queueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 seconds initial delay
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      count: 50, // Keep last 50 failed jobs
    },
  },
};

export interface AnalysisJobData {
  analysisId: string;
  resumeText: string;
  jobDescription: string;
  retryCount?: number;
}

export interface AnalysisJobResult {
  success: boolean;
  analysisId: string;
  processingTimeMs?: number;
  error?: string;
}

// Create the queue
export const analysisQueue = new Queue<AnalysisJobData, AnalysisJobResult>(
  QUEUE_NAME,
  queueOptions
);

/**
 * Add analysis job to queue
 */
export async function addAnalysisJob(data: AnalysisJobData): Promise<string> {
  const job = await analysisQueue.add('analyze', data, {
    jobId: data.analysisId, // Use analysis ID as job ID for easy lookup
  });
  return job.id || data.analysisId;
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string) {
  const job = await analysisQueue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  return {
    id: job.id,
    state,
    progress: job.progress,
    data: job.data,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason,
  };
}
