/**
 * Analysis API Service
 * Handles all HTTP requests to the backend
 */

const API_BASE = '/api/v1';

// ============================================
// Types matching backend responses
// ============================================

export interface CreateAnalysisResponse {
  success: boolean;
  id: string;
  status: 'PENDING' | 'COMPLETED';
  cached: boolean;
  result?: GapAnalysisResult;
}

export interface GetAnalysisResponse {
  success: boolean;
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: GapAnalysisResult;
  errorMessage?: string;
  processingTimeMs?: number;
  aiProcessingTimeMs?: number;
  createdAt: string;
  requestTimeMs?: number;
}

export interface GapAnalysisResult {
  missingSkills: string[];
  learningPath: LearningPathStep[];
  interviewQuestions: string[];
  status: string;
}

export interface LearningPathStep {
  step: string;
  resource?: string;
}

export interface HistoryResponse {
  success: boolean;
  count: number;
  analyses: GetAnalysisResponse[];
}

// ============================================
// API Methods
// ============================================

export const analysisApi = {
  /**
   * Create new analysis
   * Supports both PDF files and text input
   */
  async createAnalysis(data: {
    resumeText?: string;
    jobDescription?: string;
    resumeFile?: File;
    jobDescriptionFile?: File;
  }): Promise<CreateAnalysisResponse> {
    const formData = new FormData();

    // Add resume (file or text)
    if (data.resumeFile) {
      formData.append('resume', data.resumeFile);
    } else if (data.resumeText) {
      formData.append('resumeText', data.resumeText);
    }

    // Add job description (file or text)
    if (data.jobDescriptionFile) {
      formData.append('jobDescription', data.jobDescriptionFile);
    } else if (data.jobDescription) {
      formData.append('jobDescription', data.jobDescription);
    }

    const response = await fetch(`${API_BASE}/analysis`, {
      method: 'POST',
      body: formData,
      credentials: 'include', // Include cookies for session
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create analysis');
    }

    return response.json();
  },

  /**
   * Get analysis by ID (for polling)
   */
  async getAnalysis(id: string): Promise<GetAnalysisResponse> {
    const response = await fetch(`${API_BASE}/analysis/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get analysis');
    }

    return response.json();
  },

  /**
   * Get analysis history for current session
   */
  async getHistory(limit: number = 10): Promise<HistoryResponse> {
    const response = await fetch(`${API_BASE}/analysis/user/history?limit=${limit}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get history');
    }

    return response.json();
  },

  /**
   * Poll for analysis completion
   * Returns when status is COMPLETED or FAILED
   */
  async pollForCompletion(
    id: string,
    options: { interval?: number; maxAttempts?: number } = {}
  ): Promise<GetAnalysisResponse> {
    const { interval = 2000, maxAttempts = 60 } = options;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.getAnalysis(id);

      if (result.status === 'COMPLETED' || result.status === 'FAILED') {
        return result;
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error('Analysis timed out');
  },
};
