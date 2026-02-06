-- Career Gap Architect Database Schema
-- Migration: 001_initial.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Anonymous users table (cookie-based tracking)
CREATE TABLE IF NOT EXISTS anonymous_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_user_id UUID REFERENCES anonymous_users(id) ON DELETE SET NULL,
  
  -- Content-based caching (SHA-256 hash)
  content_hash VARCHAR(64) NOT NULL,
  
  -- Input data
  resume_text TEXT NOT NULL,
  job_description TEXT NOT NULL,
  resume_filename VARCHAR(255),
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  
  -- AI Result (JSONB for flexible querying)
  result JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  processing_time_ms INTEGER
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analyses_content_hash ON analyses(content_hash);
CREATE INDEX IF NOT EXISTS idx_analyses_anonymous_user ON analyses(anonymous_user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status_pending ON analyses(status) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);

-- GIN index for JSONB result querying (missing skills search)
CREATE INDEX IF NOT EXISTS idx_analyses_result_gin ON analyses USING GIN (result);

-- Comments for documentation
COMMENT ON TABLE anonymous_users IS 'Tracks anonymous users via signed cookies for analysis history';
COMMENT ON TABLE analyses IS 'Stores resume-JD gap analysis requests and results';
COMMENT ON COLUMN analyses.content_hash IS 'SHA-256 hash of (resume_text + job_description) for caching';
COMMENT ON COLUMN analyses.result IS 'JSONB containing missingSkills, learningPath, and interviewQuestions';
