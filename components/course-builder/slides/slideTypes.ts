// Slide-based lesson content types

export type SlideTemplate =
  | 'title'           // Big headline + subtitle
  | 'content'         // Text + optional media
  | 'media'           // Full-bleed image or video
  | 'split'           // Two-column layout
  | 'quiz'            // Interactive quiz
  | 'webapp'          // Embedded webapp (seamless)
  | 'code'            // Code with syntax highlighting
  | 'bullets'         // Key points with icons
  | 'canva';          // Embedded Canva slideshow

export type ThemeId = 'modern-light' | 'modern-dark' | 'warm' | 'ocean';

export interface Theme {
  id: ThemeId;
  name: string;
  colors: {
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    primary: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

export const themes: Record<ThemeId, Theme> = {
  'modern-light': {
    id: 'modern-light',
    name: 'Modern Light',
    colors: {
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      textMuted: '#64748b',
      primary: '#3b82f6',
      accent: '#8b5cf6',
    },
    fonts: {
      heading: 'system-ui, -apple-system, sans-serif',
      body: 'system-ui, -apple-system, sans-serif',
    },
  },
  'modern-dark': {
    id: 'modern-dark',
    name: 'Modern Dark',
    colors: {
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      primary: '#60a5fa',
      accent: '#a78bfa',
    },
    fonts: {
      heading: 'system-ui, -apple-system, sans-serif',
      body: 'system-ui, -apple-system, sans-serif',
    },
  },
  'warm': {
    id: 'warm',
    name: 'Warm',
    colors: {
      background: '#fffbeb',
      surface: '#fef3c7',
      text: '#451a03',
      textMuted: '#92400e',
      primary: '#f59e0b',
      accent: '#ef4444',
    },
    fonts: {
      heading: 'Georgia, serif',
      body: 'system-ui, -apple-system, sans-serif',
    },
  },
  'ocean': {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      background: '#ecfeff',
      surface: '#cffafe',
      text: '#164e63',
      textMuted: '#0e7490',
      primary: '#06b6d4',
      accent: '#0891b2',
    },
    fonts: {
      heading: 'system-ui, -apple-system, sans-serif',
      body: 'system-ui, -apple-system, sans-serif',
    },
  },
};

// Base slide data
export interface BaseSlideData {
  template: SlideTemplate;
}

// Title slide
export interface TitleSlideData extends BaseSlideData {
  template: 'title';
  headline: string;
  subtitle?: string;
  backgroundImage?: string;
  alignment?: 'left' | 'center' | 'right';
}

// Content slide (text + optional media)
export interface ContentSlideData extends BaseSlideData {
  template: 'content';
  heading?: string;
  body: string; // Rich text HTML
  media?: {
    type: 'image' | 'video';
    url: string;
    position: 'top' | 'bottom' | 'right';
  };
}

// Media slide (full-bleed)
export interface MediaSlideData extends BaseSlideData {
  template: 'media';
  mediaType: 'image' | 'video';
  url: string;
  caption?: string;
  overlay?: boolean;
}

// Split slide (two columns)
export interface SplitSlideData extends BaseSlideData {
  template: 'split';
  leftContent: string; // Rich text HTML
  rightContent: string; // Rich text HTML
  ratio?: '50-50' | '60-40' | '40-60';
}

// Quiz slide
export interface QuizSlideData extends BaseSlideData {
  template: 'quiz';
  question: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  explanation?: string;
}

// Webapp slide (seamless embed)
export interface WebappSlideData extends BaseSlideData {
  template: 'webapp';
  url: string;
  title?: string; // For accessibility
}

// Code slide
export interface CodeSlideData extends BaseSlideData {
  template: 'code';
  heading?: string;
  code: string;
  language: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
}

// Bullets slide
export interface BulletsSlideData extends BaseSlideData {
  template: 'bullets';
  heading?: string;
  bullets: Array<{
    id: string;
    text: string;
    icon?: string; // Lucide icon name
  }>;
}

// Canva slide (embedded Canva presentation)
export interface CanvaSlideData extends BaseSlideData {
  template: 'canva';
  embedUrl: string; // Canva embed URL (from share > embed)
  title?: string; // For accessibility
}

export type SlideData =
  | TitleSlideData
  | ContentSlideData
  | MediaSlideData
  | SplitSlideData
  | QuizSlideData
  | WebappSlideData
  | CodeSlideData
  | BulletsSlideData
  | CanvaSlideData;

export interface Slide {
  id: string;
  data: SlideData;
  order: number;
  notes?: string; // Instructor notes
}

export interface SlideBasedContent {
  version: 2;
  theme: ThemeId;
  slides: Slide[];
}

// Helper to check if content is slide-based
export const isSlideBasedContent = (content: unknown): content is SlideBasedContent => {
  return (
    typeof content === 'object' &&
    content !== null &&
    'version' in content &&
    (content as any).version === 2 &&
    'slides' in content
  );
};

// Helper to create empty slide content
export const createEmptySlideContent = (theme: ThemeId = 'modern-light'): SlideBasedContent => ({
  version: 2,
  theme,
  slides: [],
});

// Helper to create a new slide
export const createSlide = (template: SlideTemplate, order: number): Slide => {
  const id = crypto.randomUUID();

  const defaultData: Record<SlideTemplate, SlideData> = {
    title: { template: 'title', headline: 'Slide Title', subtitle: '', alignment: 'center' },
    content: { template: 'content', heading: '', body: '' },
    media: { template: 'media', mediaType: 'image', url: '', caption: '' },
    split: { template: 'split', leftContent: '', rightContent: '', ratio: '50-50' },
    quiz: { template: 'quiz', question: '', options: [], explanation: '' },
    webapp: { template: 'webapp', url: '', title: '' },
    code: { template: 'code', heading: '', code: '', language: 'javascript', showLineNumbers: true },
    bullets: { template: 'bullets', heading: '', bullets: [] },
    canva: { template: 'canva', embedUrl: '', title: '' },
  };

  return {
    id,
    data: defaultData[template],
    order,
  };
};

// Template metadata for UI
export interface TemplateInfo {
  id: SlideTemplate;
  name: string;
  description: string;
  icon: string; // Lucide icon name
}

export const templateInfo: TemplateInfo[] = [
  { id: 'title', name: 'Title', description: 'Big headline with optional subtitle', icon: 'Type' },
  { id: 'content', name: 'Content', description: 'Text with optional media', icon: 'FileText' },
  { id: 'media', name: 'Media', description: 'Full-screen image or video', icon: 'Image' },
  { id: 'split', name: 'Split', description: 'Two-column layout', icon: 'Columns' },
  { id: 'quiz', name: 'Quiz', description: 'Interactive question', icon: 'HelpCircle' },
  { id: 'webapp', name: 'Webapp', description: 'Embed external app', icon: 'Globe' },
  { id: 'code', name: 'Code', description: 'Syntax-highlighted code', icon: 'Code' },
  { id: 'bullets', name: 'Key Points', description: 'Bulleted list with icons', icon: 'List' },
  { id: 'canva', name: 'Canva', description: 'Embed Canva presentation', icon: 'Presentation' },
];
