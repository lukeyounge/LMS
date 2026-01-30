export enum UserRole {
  STUDENT = 'STUDENT',
  INSTRUCTOR = 'INSTRUCTOR',
  ADMIN = 'ADMIN'
}

export enum LessonType {
  VIDEO = 'VIDEO',
  TEXT = 'TEXT',
  QUIZ = 'QUIZ',
  ASSIGNMENT = 'ASSIGNMENT'
}

// --- PAGE-BASED LESSON CONTENT ---

export type PageType = 'text' | 'video' | 'embed' | 'quiz' | 'code' | 'image' | 'divider';

export type EmbedProvider =
  | 'youtube'
  | 'vimeo'
  | 'loom'
  | 'codepen'
  | 'codesandbox'
  | 'figma'
  | 'notion'
  | 'miro'
  | 'typeform'
  | 'google-slides'
  | 'custom';

export interface TextPageData {
  type: 'text';
  html: string; // Rich text HTML from Tiptap
}

export interface VideoPageData {
  type: 'video';
  url: string;
  provider: 'youtube' | 'vimeo' | 'loom' | 'custom';
}

export interface EmbedPageData {
  type: 'embed';
  provider: EmbedProvider;
  embedUrl: string;
  config?: Record<string, unknown>;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface QuizPageData {
  type: 'quiz';
  questions: QuizQuestion[];
  passingScore: number;
}

export interface CodePageData {
  type: 'code';
  code: string;
  language: string;
  runnable: boolean;
}

export interface ImagePageData {
  type: 'image';
  url: string;
  alt: string;
  caption?: string;
}

export interface DividerPageData {
  type: 'divider';
  style: 'line' | 'space' | 'dots';
}

export type PageData =
  | TextPageData
  | VideoPageData
  | EmbedPageData
  | QuizPageData
  | CodePageData
  | ImagePageData
  | DividerPageData;

export interface Page {
  id: string;
  type: PageType;
  data: PageData;
  order: number;
}

export interface LessonContent {
  pages: Page[];
}

// --- SLIDE-BASED LESSON CONTENT (v2) ---
// Re-export slide types for convenience
export type { SlideBasedContent, Slide, SlideData, SlideTemplate, ThemeId, Theme } from './components/course-builder/slides/slideTypes';
export { isSlideBasedContent, createEmptySlideContent, createSlide, themes } from './components/course-builder/slides/slideTypes';

// Helper to create empty page content
export const createEmptyLessonContent = (): LessonContent => ({
  pages: []
});

// Helper to create a new page
export const createPage = (type: PageType, order: number): Page => {
  const id = crypto.randomUUID();

  const defaultData: Record<PageType, PageData> = {
    text: { type: 'text', html: '' },
    video: { type: 'video', url: '', provider: 'youtube' },
    embed: { type: 'embed', provider: 'custom', embedUrl: '' },
    quiz: { type: 'quiz', questions: [], passingScore: 70 },
    code: { type: 'code', code: '', language: 'javascript', runnable: false },
    image: { type: 'image', url: '', alt: '' },
    divider: { type: 'divider', style: 'line' }
  };

  return {
    id,
    type,
    data: defaultData[type],
    order
  };
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

// Import SlideBasedContent type
import type { SlideBasedContent } from './components/course-builder/slides/slideTypes';

export interface Lesson {
  id: string;
  sectionId: string;
  title: string;
  type: LessonType;
  duration: number; // in minutes
  content: LessonContent | SlideBasedContent | string; // Slide-based (v2), page-based (v1), or legacy string
  isCompleted: boolean; // Static flag for initial state (can be overridden by context)
  isLocked: boolean;
  order: number;
}

// Type guard to check if content is new page-based format
export const isPageBasedContent = (content: LessonContent | string): content is LessonContent => {
  return typeof content === 'object' && content !== null && 'pages' in content;
};

export interface Section {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  instructorId: string; // New field for ownership
  title: string;
  description: string;
  thumbnailUrl: string;
  instructorName: string;
  price: number;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  sections: Section[];
  totalStudents: number;
  rating: number;
}

export interface Enrollment {
  courseId: string;
  progress: number; // 0-100
  lastAccessedLessonId?: string;
  completedLessonIds: string[];
  enrolledAt: Date;
}

// --- EMBED INTERACTION TRACKING ---

export type EmbedStatus = 'not_started' | 'started' | 'in_progress' | 'completed';
export type EmbedSubmissionType = 'code' | 'text' | 'file' | 'form' | 'custom';

export interface EmbedInteraction {
  id: string;
  enrollmentId: string;
  lessonId: string;
  slideId: string;
  embedUrl: string;
  status: EmbedStatus;
  progress: number;
  score?: number;
  timeSpentSeconds: number;
  submissionData?: unknown;
  submissionType?: EmbedSubmissionType;
  startedAt?: Date;
  completedAt?: Date;
  lastInteractionAt: Date;
}

// --- EMBED MESSAGE PROTOCOL ---
// Protocol for communication between embedded webapps and the LMS

export interface EmbedMessage {
  type: 'lms-embed-event';
  version: '1.0';
  payload: EmbedEventPayload;
}

export type EmbedEventPayload =
  | { event: 'ready' }
  | { event: 'started' }
  | { event: 'progress'; percent: number }
  | { event: 'completed'; score?: number; data?: unknown }
  | { event: 'submitted'; submission: SubmissionData }
  | { event: 'error'; message: string };

export interface SubmissionData {
  type: EmbedSubmissionType;
  content: string | object;
  metadata?: Record<string, unknown>;
}

// Message sent from LMS to embedded webapp
export interface LmsInitMessage {
  type: 'lms-init';
  version: '1.0';
  payload: {
    userId?: string;
    lessonId: string;
    slideId: string;
    previousState?: unknown;
    config?: Record<string, unknown>;
  };
}

// Type guard for embed messages
export const isEmbedMessage = (data: unknown): data is EmbedMessage => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    (data as EmbedMessage).type === 'lms-embed-event' &&
    'version' in data &&
    (data as EmbedMessage).version === '1.0' &&
    'payload' in data
  );
};