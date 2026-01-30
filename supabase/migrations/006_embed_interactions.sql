-- Migration: Add embed_interactions table for tracking learner activity in embedded webapps
-- This enables capturing completion status, scores, and submissions from iframe embeds

-- Create embed interaction status enum
CREATE TYPE embed_status AS ENUM ('not_started', 'started', 'in_progress', 'completed');

-- Create embed submission type enum
CREATE TYPE embed_submission_type AS ENUM ('code', 'text', 'file', 'form', 'custom');

-- Create the embed_interactions table
CREATE TABLE embed_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  slide_id TEXT NOT NULL,              -- Slide identifier within lesson
  embed_url TEXT NOT NULL,             -- The embedded URL

  -- Interaction data
  status embed_status NOT NULL DEFAULT 'not_started',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  time_spent_seconds INTEGER DEFAULT 0,

  -- Submission data (if embed collects user work)
  submission_data JSONB,
  submission_type embed_submission_type,

  -- Metadata
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one record per user per slide
  UNIQUE(enrollment_id, lesson_id, slide_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_embed_interactions_enrollment ON embed_interactions(enrollment_id);
CREATE INDEX idx_embed_interactions_lesson ON embed_interactions(lesson_id);
CREATE INDEX idx_embed_interactions_status ON embed_interactions(status);

-- Enable Row Level Security
ALTER TABLE embed_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own embed interactions
CREATE POLICY "Users can view own embed interactions"
  ON embed_interactions FOR SELECT
  USING (
    enrollment_id IN (
      SELECT id FROM enrollments WHERE user_id = auth.uid()
    )
  );

-- Users can insert their own embed interactions
CREATE POLICY "Users can insert own embed interactions"
  ON embed_interactions FOR INSERT
  WITH CHECK (
    enrollment_id IN (
      SELECT id FROM enrollments WHERE user_id = auth.uid()
    )
  );

-- Users can update their own embed interactions
CREATE POLICY "Users can update own embed interactions"
  ON embed_interactions FOR UPDATE
  USING (
    enrollment_id IN (
      SELECT id FROM enrollments WHERE user_id = auth.uid()
    )
  );

-- Instructors can view embed interactions for their courses
CREATE POLICY "Instructors can view course embed interactions"
  ON embed_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE e.id = embed_interactions.enrollment_id
      AND c.instructor_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_embed_interaction_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER embed_interactions_updated_at
  BEFORE UPDATE ON embed_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_embed_interaction_timestamp();

-- Helper function to upsert embed interaction (for use from frontend)
CREATE OR REPLACE FUNCTION upsert_embed_interaction(
  p_course_id UUID,
  p_lesson_id UUID,
  p_slide_id TEXT,
  p_embed_url TEXT,
  p_status embed_status DEFAULT NULL,
  p_progress INTEGER DEFAULT NULL,
  p_score INTEGER DEFAULT NULL,
  p_time_spent_seconds INTEGER DEFAULT NULL,
  p_submission_data JSONB DEFAULT NULL,
  p_submission_type embed_submission_type DEFAULT NULL
)
RETURNS embed_interactions AS $$
DECLARE
  v_enrollment_id UUID;
  v_result embed_interactions;
BEGIN
  -- Get enrollment ID for current user and course
  SELECT id INTO v_enrollment_id
  FROM enrollments
  WHERE user_id = auth.uid() AND course_id = p_course_id;

  IF v_enrollment_id IS NULL THEN
    RAISE EXCEPTION 'User is not enrolled in this course';
  END IF;

  -- Upsert the interaction record
  INSERT INTO embed_interactions (
    enrollment_id,
    lesson_id,
    slide_id,
    embed_url,
    status,
    progress,
    score,
    time_spent_seconds,
    submission_data,
    submission_type,
    started_at,
    completed_at,
    last_interaction_at
  )
  VALUES (
    v_enrollment_id,
    p_lesson_id,
    p_slide_id,
    p_embed_url,
    COALESCE(p_status, 'not_started'),
    COALESCE(p_progress, 0),
    p_score,
    COALESCE(p_time_spent_seconds, 0),
    p_submission_data,
    p_submission_type,
    CASE WHEN p_status IN ('started', 'in_progress', 'completed') THEN NOW() ELSE NULL END,
    CASE WHEN p_status = 'completed' THEN NOW() ELSE NULL END,
    NOW()
  )
  ON CONFLICT (enrollment_id, lesson_id, slide_id)
  DO UPDATE SET
    status = COALESCE(p_status, embed_interactions.status),
    progress = COALESCE(p_progress, embed_interactions.progress),
    score = COALESCE(p_score, embed_interactions.score),
    time_spent_seconds = COALESCE(p_time_spent_seconds, embed_interactions.time_spent_seconds),
    submission_data = COALESCE(p_submission_data, embed_interactions.submission_data),
    submission_type = COALESCE(p_submission_type, embed_interactions.submission_type),
    started_at = CASE
      WHEN embed_interactions.started_at IS NULL AND p_status IN ('started', 'in_progress', 'completed')
      THEN NOW()
      ELSE embed_interactions.started_at
    END,
    completed_at = CASE
      WHEN p_status = 'completed' THEN NOW()
      ELSE embed_interactions.completed_at
    END,
    last_interaction_at = NOW()
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_embed_interaction TO authenticated;
