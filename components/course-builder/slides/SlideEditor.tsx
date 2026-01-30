import { useState, useCallback, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Palette,
  Maximize2,
  Minimize2,
  Play,
  Edit3,
} from 'lucide-react';
import {
  Slide,
  SlideData,
  SlideTemplate,
  SlideBasedContent,
  Theme,
  ThemeId,
  themes,
  createSlide,
  createEmptySlideContent,
  isSlideBasedContent,
} from './slideTypes';
import { SlideCanvas } from './SlideCanvas';
import { SlideThumbnails } from './SlideThumbnails';
import { TemplatePicker, QuickTemplateMenu } from './TemplatePicker';
import { Lesson, LessonContent, isPageBasedContent } from '../../../types';

interface SlideEditorProps {
  lesson: Lesson;
  onUpdateLesson: (updates: Partial<Lesson>) => void;
  onUpdateContent: (content: SlideBasedContent) => void;
}

export function SlideEditor({
  lesson,
  onUpdateLesson,
  onUpdateContent,
}: SlideEditorProps) {
  // Parse existing content or create new
  const getInitialContent = (): SlideBasedContent => {
    if (isSlideBasedContent(lesson.content)) {
      return lesson.content;
    }
    // Migrate from page-based content if needed
    if (isPageBasedContent(lesson.content)) {
      // Could migrate pages to slides here
      return createEmptySlideContent();
    }
    return createEmptySlideContent();
  };

  const [content, setContent] = useState<SlideBasedContent>(getInitialContent);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(
    content.slides[0]?.id || null
  );
  const [isEditing, setIsEditing] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [quickMenuPosition, setQuickMenuPosition] = useState({ x: 0, y: 0 });

  const slides = content.slides.sort((a, b) => a.order - b.order);
  const selectedSlide = slides.find((s) => s.id === selectedSlideId);
  const selectedIndex = slides.findIndex((s) => s.id === selectedSlideId);
  const theme = themes[content.theme];

  // Sync content back to parent
  useEffect(() => {
    onUpdateContent(content);
  }, [content, onUpdateContent]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        navigateSlide('prev');
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        navigateSlide('next');
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, slides.length, isFullscreen]);

  const navigateSlide = (direction: 'prev' | 'next') => {
    const newIndex =
      direction === 'prev'
        ? Math.max(0, selectedIndex - 1)
        : Math.min(slides.length - 1, selectedIndex + 1);
    setSelectedSlideId(slides[newIndex]?.id || null);
  };

  const addSlide = useCallback(
    (template: SlideTemplate, afterSlideId?: string) => {
      const afterIndex = afterSlideId
        ? slides.findIndex((s) => s.id === afterSlideId)
        : slides.length - 1;
      const newOrder = afterIndex + 1;

      const newSlide = createSlide(template, newOrder);

      // Shift orders of slides after the insertion point
      const updatedSlides = slides.map((s) =>
        s.order >= newOrder ? { ...s, order: s.order + 1 } : s
      );

      setContent({
        ...content,
        slides: [...updatedSlides, newSlide].sort((a, b) => a.order - b.order),
      });

      setSelectedSlideId(newSlide.id);
    },
    [content, slides]
  );

  const deleteSlide = useCallback(
    (id: string) => {
      const newSlides = slides.filter((s) => s.id !== id);
      const reorderedSlides = newSlides.map((s, i) => ({ ...s, order: i }));

      setContent({ ...content, slides: reorderedSlides });

      // Select adjacent slide
      if (selectedSlideId === id) {
        const deletedIndex = slides.findIndex((s) => s.id === id);
        const newSelectedIndex = Math.min(deletedIndex, newSlides.length - 1);
        setSelectedSlideId(newSlides[newSelectedIndex]?.id || null);
      }
    },
    [content, slides, selectedSlideId]
  );

  const duplicateSlide = useCallback(
    (id: string) => {
      const sourceslide = slides.find((s) => s.id === id);
      if (!sourceslide) return;

      const sourceIndex = slides.findIndex((s) => s.id === id);
      const newOrder = sourceIndex + 1;

      const newSlide: Slide = {
        id: crypto.randomUUID(),
        data: JSON.parse(JSON.stringify(sourceslide.data)), // Deep clone
        order: newOrder,
        notes: sourceslide.notes,
      };

      // Shift orders of slides after the insertion point
      const updatedSlides = slides.map((s) =>
        s.order >= newOrder ? { ...s, order: s.order + 1 } : s
      );

      setContent({
        ...content,
        slides: [...updatedSlides, newSlide].sort((a, b) => a.order - b.order),
      });

      setSelectedSlideId(newSlide.id);
    },
    [content, slides]
  );

  const updateSlide = useCallback(
    (id: string, data: SlideData) => {
      setContent({
        ...content,
        slides: slides.map((s) => (s.id === id ? { ...s, data } : s)),
      });
    },
    [content, slides]
  );

  const reorderSlides = useCallback(
    (newSlides: Slide[]) => {
      setContent({ ...content, slides: newSlides });
    },
    [content]
  );

  const changeTheme = useCallback(
    (themeId: ThemeId) => {
      setContent({ ...content, theme: themeId });
    },
    [content]
  );

  const handleAddClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setQuickMenuPosition({ x: rect.right + 8, y: rect.top + rect.height / 2 });
    setShowQuickMenu(true);
  };

  // Empty state
  if (slides.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Play className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create Your First Slide
          </h2>
          <p className="text-gray-500 mb-8">
            Build engaging lessons with beautiful templates. Choose a slide type
            to get started.
          </p>
          <button
            onClick={() => setShowTemplatePicker(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Slide
          </button>
        </div>

        {showTemplatePicker && (
          <TemplatePicker
            currentTheme={content.theme}
            onSelectTemplate={(template) => addSlide(template)}
            onChangeTheme={changeTheme}
            onClose={() => setShowTemplatePicker(false)}
          />
        )}
      </div>
    );
  }

  // Fullscreen presentation mode
  if (isFullscreen && selectedSlide) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <SlideCanvas
          slide={selectedSlide}
          theme={theme}
          isEditing={false}
          onUpdate={() => {}}
        />

        {/* Navigation */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-lg rounded-full px-4 py-2">
          <button
            onClick={() => navigateSlide('prev')}
            disabled={selectedIndex === 0}
            className="p-2 text-white disabled:opacity-30 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white text-sm font-medium min-w-[60px] text-center">
            {selectedIndex + 1} / {slides.length}
          </span>
          <button
            onClick={() => navigateSlide('next')}
            disabled={selectedIndex === slides.length - 1}
            className="p-2 text-white disabled:opacity-30 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Exit button */}
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-gray-100">
      {/* Left sidebar - Slide thumbnails */}
      <div className="w-48 flex-shrink-0 bg-white border-r border-gray-200">
        <SlideThumbnails
          slides={slides}
          selectedSlideId={selectedSlideId}
          theme={theme}
          onSelectSlide={setSelectedSlideId}
          onAddSlide={addSlide}
          onDeleteSlide={deleteSlide}
          onDuplicateSlide={duplicateSlide}
          onReorderSlides={reorderSlides}
        />
      </div>

      {/* Main canvas area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex-shrink-0 h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Slide
            </button>
            <button
              onClick={() => setShowTemplatePicker(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Palette className="w-4 h-4" />
              Theme
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Edit/Preview toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setIsEditing(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                  isEditing
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                  !isEditing
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                Preview
              </button>
            </div>

            {/* Fullscreen */}
            <button
              onClick={() => setIsFullscreen(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Present fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          {selectedSlide && (
            <SlideCanvas
              slide={selectedSlide}
              theme={theme}
              isEditing={isEditing}
              onUpdate={(data) => updateSlide(selectedSlide.id, data)}
            />
          )}
        </div>

        {/* Bottom navigation */}
        <div className="flex-shrink-0 h-12 bg-white border-t border-gray-200 flex items-center justify-center gap-4">
          <button
            onClick={() => navigateSlide('prev')}
            disabled={selectedIndex === 0}
            className="p-2 text-gray-600 disabled:text-gray-300 hover:bg-gray-100 rounded-lg transition-colors disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-500 min-w-[80px] text-center">
            Slide {selectedIndex + 1} of {slides.length}
          </span>
          <button
            onClick={() => navigateSlide('next')}
            disabled={selectedIndex === slides.length - 1}
            className="p-2 text-gray-600 disabled:text-gray-300 hover:bg-gray-100 rounded-lg transition-colors disabled:hover:bg-transparent"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Modals */}
      {showTemplatePicker && (
        <TemplatePicker
          currentTheme={content.theme}
          onSelectTemplate={(template) => addSlide(template, selectedSlideId || undefined)}
          onChangeTheme={changeTheme}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}

      {showQuickMenu && (
        <QuickTemplateMenu
          position={quickMenuPosition}
          currentTheme={content.theme}
          onSelect={(template) => addSlide(template, selectedSlideId || undefined)}
          onClose={() => setShowQuickMenu(false)}
        />
      )}
    </div>
  );
}
