# User Data Tracking & Embed Integration Plan

## Executive Summary

This document analyzes the current user data tracking capabilities in the LMS and proposes a plan for capturing interaction data from embedded content (webapp slides, iframes).

---

## Part 1: Current State Analysis

### What We Currently Track

| Data Type | Storage Location | Capture Mechanism |
|-----------|------------------|-------------------|
| **Lesson Completion** | `enrollments.completed_lesson_ids` (TEXT[]) | Manual "Complete Lesson" action |
| **Course Progress** | `enrollments.progress` (INTEGER 0-100) | Calculated from completed lessons |
| **Last Accessed Lesson** | `enrollments.last_accessed_lesson_id` | Updated on lesson view |
| **Quiz Scores** | `quiz_attempts.score` + `quiz_attempts.passed` | On quiz submission |
| **Quiz Answers** | `quiz_attempts.answers` (JSONB) | Full answer log for replay |
| **Enrollment Date** | `enrollments.enrolled_at` | On enrollment |
| **User Profile** | `users` table | Auto-created on registration |
| **Course Stats** | `courses.total_students`, `courses.rating` | Aggregate metrics |

### What We DON'T Track (Gaps)

| Missing Data | Impact |
|--------------|--------|
| **Time spent on lessons** | Can't measure engagement or identify difficult content |
| **Slide-level progress** | Only know lesson complete, not which slides viewed |
| **Video watch progress** | No idea if videos are actually watched |
| **Embed interactions** | Zero visibility into webapp/iframe activity |
| **Session duration** | Can't measure learning session patterns |
| **Failed attempts** | Only track quiz passes, not learning struggles |
| **Content interactions** | No click/scroll/hover analytics |

### Embed System Current State

**Location:** `src/components/course-builder/slides/SlideCanvas.tsx` (lines 492-566)

The webapp slide template:
- Renders iframes with `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"`
- **Has postMessage listener infrastructure** but only logs to console
- **Captures zero data** from embedded content

```typescript
// Current state - infrastructure exists but unused
const handleMessage = (event: MessageEvent) => {
  if (event.origin !== new URL(data.url || 'about:blank').origin) return;
  // Could handle completion events here
  console.log('Message from webapp:', event.data);  // <-- Only logs!
};
```

---

## Part 2: Embed Data Integration Plan

### 2.1 Communication Protocol (LMS ↔ Embed)

Define a standardized message protocol that embedded webapps can use to communicate with the LMS.

#### Message Types (Embed → LMS)

```typescript
// Embed sends these messages to parent LMS
interface EmbedMessage {
  type: 'lms-embed-event';
  version: '1.0';
  payload: EmbedEventPayload;
}

type EmbedEventPayload =
  | { event: 'ready' }                                    // Embed loaded
  | { event: 'started' }                                  // User began interaction
  | { event: 'progress'; percent: number }                // Progress update (0-100)
  | { event: 'completed'; score?: number; data?: any }    // User completed activity
  | { event: 'submitted'; submission: SubmissionData }    // User submitted work
  | { event: 'error'; message: string };                  // Error occurred

interface SubmissionData {
  type: 'code' | 'text' | 'file' | 'form' | 'custom';
  content: string | object;
  metadata?: Record<string, any>;
}
```

#### Messages (LMS → Embed)

```typescript
// LMS sends these to initialize embed
interface LmsToEmbedMessage {
  type: 'lms-init';
  version: '1.0';
  payload: {
    userId: string;           // Anonymous or real user ID
    lessonId: string;
    slideId: string;
    previousState?: any;      // Restore previous progress
    config?: Record<string, any>;
  };
}
```

### 2.2 Database Schema Additions

Add new table for tracking embed interactions:

```sql
-- New table for embed interaction tracking
CREATE TABLE embed_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  slide_id TEXT NOT NULL,              -- Slide identifier within lesson
  embed_url TEXT NOT NULL,             -- The embedded URL

  -- Interaction data
  status TEXT NOT NULL DEFAULT 'not_started',  -- not_started, started, in_progress, completed
  progress INTEGER DEFAULT 0,                   -- 0-100 percentage
  score INTEGER,                                -- Optional score (if applicable)
  time_spent_seconds INTEGER DEFAULT 0,         -- Total time in embed

  -- Submission data (if embed collects user work)
  submission_data JSONB,               -- Flexible storage for user submissions
  submission_type TEXT,                -- code, text, file, form, custom

  -- Metadata
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one record per user per slide
  UNIQUE(enrollment_id, lesson_id, slide_id)
);

-- Index for quick lookups
CREATE INDEX idx_embed_interactions_enrollment ON embed_interactions(enrollment_id);
CREATE INDEX idx_embed_interactions_lesson ON embed_interactions(lesson_id);

-- RLS policies
ALTER TABLE embed_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own embed interactions"
  ON embed_interactions FOR SELECT
  USING (
    enrollment_id IN (
      SELECT id FROM enrollments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own embed interactions"
  ON embed_interactions FOR INSERT
  WITH CHECK (
    enrollment_id IN (
      SELECT id FROM enrollments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own embed interactions"
  ON embed_interactions FOR UPDATE
  USING (
    enrollment_id IN (
      SELECT id FROM enrollments WHERE user_id = auth.uid()
    )
  );
```

### 2.3 Service Layer Implementation

Add to `src/services/courseService.ts`:

```typescript
// Track embed interaction
async trackEmbedInteraction(
  courseId: string,
  lessonId: string,
  slideId: string,
  embedUrl: string,
  interaction: {
    status?: 'not_started' | 'started' | 'in_progress' | 'completed';
    progress?: number;
    score?: number;
    timeSpentSeconds?: number;
    submissionData?: any;
    submissionType?: string;
  }
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single();

  if (!enrollment) throw new Error('Not enrolled in course');

  // Upsert interaction record
  const { error } = await supabase
    .from('embed_interactions')
    .upsert({
      enrollment_id: enrollment.id,
      lesson_id: lessonId,
      slide_id: slideId,
      embed_url: embedUrl,
      ...interaction,
      last_interaction_at: new Date().toISOString(),
      ...(interaction.status === 'started' && { started_at: new Date().toISOString() }),
      ...(interaction.status === 'completed' && { completed_at: new Date().toISOString() }),
    }, {
      onConflict: 'enrollment_id,lesson_id,slide_id'
    });

  if (error) throw error;
}

// Get embed interactions for a lesson
async getEmbedInteractions(
  courseId: string,
  lessonId: string
): Promise<EmbedInteraction[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single();

  if (!enrollment) return [];

  const { data, error } = await supabase
    .from('embed_interactions')
    .select('*')
    .eq('enrollment_id', enrollment.id)
    .eq('lesson_id', lessonId);

  if (error) throw error;
  return data || [];
}
```

### 2.4 Frontend Message Handler

Update `SlideCanvas.tsx` webapp slide component:

```typescript
// Enhanced message handler for webapp embeds
useEffect(() => {
  const handleMessage = async (event: MessageEvent) => {
    // Validate origin
    if (!data.url) return;
    try {
      const embedOrigin = new URL(data.url).origin;
      if (event.origin !== embedOrigin) return;
    } catch {
      return;
    }

    // Validate message format
    const msg = event.data;
    if (msg?.type !== 'lms-embed-event' || msg?.version !== '1.0') return;

    const payload = msg.payload;

    // Handle different event types
    switch (payload.event) {
      case 'ready':
        // Send initialization data to embed
        sendInitMessage();
        break;

      case 'started':
        await trackInteraction({ status: 'started' });
        break;

      case 'progress':
        await trackInteraction({
          status: 'in_progress',
          progress: payload.percent
        });
        break;

      case 'completed':
        await trackInteraction({
          status: 'completed',
          progress: 100,
          score: payload.score,
        });
        // Optionally auto-complete the lesson
        if (onComplete) onComplete();
        break;

      case 'submitted':
        await trackInteraction({
          submissionData: payload.submission.content,
          submissionType: payload.submission.type,
        });
        break;
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, [data.url, courseId, lessonId, slideId]);

// Send init message to iframe
const sendInitMessage = () => {
  if (!iframeRef.current?.contentWindow) return;

  iframeRef.current.contentWindow.postMessage({
    type: 'lms-init',
    version: '1.0',
    payload: {
      userId: user?.id,
      lessonId,
      slideId,
      previousState: existingInteraction?.submissionData,
    }
  }, new URL(data.url).origin);
};
```

---

## Part 3: Embed Developer Guide

For external webapp developers to integrate with the LMS:

### Minimal Integration (Completion Only)

```javascript
// In your embedded webapp
const sendToLMS = (payload) => {
  window.parent.postMessage({
    type: 'lms-embed-event',
    version: '1.0',
    payload
  }, '*');  // Or specific parent origin for security
};

// When user completes the activity
sendToLMS({ event: 'completed', score: 85 });
```

### Full Integration

```javascript
// 1. Signal ready state
window.addEventListener('load', () => {
  sendToLMS({ event: 'ready' });
});

// 2. Listen for LMS initialization
window.addEventListener('message', (event) => {
  if (event.data?.type === 'lms-init') {
    const { userId, lessonId, previousState } = event.data.payload;
    // Restore previous state if available
    if (previousState) {
      restoreUserWork(previousState);
    }
  }
});

// 3. Track progress
function updateProgress(percent) {
  sendToLMS({ event: 'progress', percent });
}

// 4. Submit user work
function submitCode(code) {
  sendToLMS({
    event: 'submitted',
    submission: {
      type: 'code',
      content: code,
      metadata: { language: 'javascript', lines: code.split('\n').length }
    }
  });
}

// 5. Mark complete
function completeExercise(score) {
  sendToLMS({ event: 'completed', score });
}
```

---

## Part 4: Implementation Phases

### Phase 1: Core Infrastructure (MVP)
- [ ] Add `embed_interactions` table to database
- [ ] Add RLS policies for embed interactions
- [ ] Add service methods for tracking/retrieving interactions
- [ ] Update webapp slide to handle messages and store completion status

**Outcome:** Can track whether user completed an embed exercise

### Phase 2: Data Capture
- [ ] Implement full message protocol handler
- [ ] Add submission data storage
- [ ] Create embed interactions API
- [ ] Add time tracking (calculate from started_at to last_interaction_at)

**Outcome:** Can capture user submissions, scores, and time spent

### Phase 3: Instructor Visibility
- [ ] Add instructor dashboard view for embed analytics
- [ ] Show completion rates per embed
- [ ] Display submitted work for review
- [ ] Export submission data

**Outcome:** Instructors can see student progress in embedded activities

### Phase 4: Enhanced Analytics
- [ ] Slide-level progress tracking (not just lesson-level)
- [ ] Session duration tracking
- [ ] Engagement scoring algorithm
- [ ] Learning analytics dashboard

**Outcome:** Rich analytics for understanding student engagement

---

## Part 5: Security Considerations

### Origin Validation
Always validate postMessage origins:
```typescript
const embedOrigin = new URL(data.url).origin;
if (event.origin !== embedOrigin) return;
```

### Data Sanitization
Sanitize submission data before storage:
- Limit payload size (e.g., 1MB max)
- Validate submission types
- Strip potentially dangerous content

### RLS Protection
Database policies ensure users can only access their own interaction data.

### Allowlist (Optional)
Consider maintaining an allowlist of trusted embed domains for sensitive courses.

---

## Part 6: Data Model Summary

```
┌─────────────────┐       ┌─────────────────┐
│     users       │       │    courses      │
└────────┬────────┘       └────────┬────────┘
         │                         │
         │    ┌────────────────────┘
         │    │
         ▼    ▼
┌─────────────────────────────────────────────┐
│              enrollments                     │
│  - progress (0-100)                         │
│  - completed_lesson_ids[]                   │
│  - last_accessed_lesson_id                  │
└────────────────┬────────────────────────────┘
                 │
                 │ 1:many
                 ▼
┌─────────────────────────────────────────────┐
│          embed_interactions (NEW)            │
│  - slide_id                                 │
│  - status (not_started/started/completed)   │
│  - progress (0-100)                         │
│  - score                                    │
│  - time_spent_seconds                       │
│  - submission_data (JSONB)                  │
│  - submission_type                          │
└─────────────────────────────────────────────┘
```

---

## Appendix: Type Definitions

```typescript
// src/types.ts additions

export interface EmbedInteraction {
  id: string;
  enrollmentId: string;
  lessonId: string;
  slideId: string;
  embedUrl: string;
  status: 'not_started' | 'started' | 'in_progress' | 'completed';
  progress: number;
  score?: number;
  timeSpentSeconds: number;
  submissionData?: any;
  submissionType?: 'code' | 'text' | 'file' | 'form' | 'custom';
  startedAt?: Date;
  completedAt?: Date;
  lastInteractionAt: Date;
}

export interface EmbedMessage {
  type: 'lms-embed-event';
  version: '1.0';
  payload: EmbedEventPayload;
}

export type EmbedEventPayload =
  | { event: 'ready' }
  | { event: 'started' }
  | { event: 'progress'; percent: number }
  | { event: 'completed'; score?: number; data?: any }
  | { event: 'submitted'; submission: SubmissionData }
  | { event: 'error'; message: string };

export interface SubmissionData {
  type: 'code' | 'text' | 'file' | 'form' | 'custom';
  content: string | object;
  metadata?: Record<string, any>;
}

export interface LmsInitMessage {
  type: 'lms-init';
  version: '1.0';
  payload: {
    userId?: string;
    lessonId: string;
    slideId: string;
    previousState?: any;
    config?: Record<string, any>;
  };
}
```

---

## Next Steps

1. **Review this plan** and adjust based on priorities
2. **Start with Phase 1** to get basic completion tracking working
3. **Create a sample embed** that implements the protocol for testing
4. **Iterate** based on real usage data

---

*Document created: January 2026*
*Status: Planning*
