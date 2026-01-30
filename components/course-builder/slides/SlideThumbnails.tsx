import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, Copy, MoreVertical } from 'lucide-react';
import { Slide, Theme, SlideTemplate } from './slideTypes';

interface SlideThumbnailsProps {
  slides: Slide[];
  selectedSlideId: string | null;
  theme: Theme;
  onSelectSlide: (id: string) => void;
  onAddSlide: (template: SlideTemplate, afterSlideId?: string) => void;
  onDeleteSlide: (id: string) => void;
  onDuplicateSlide: (id: string) => void;
  onReorderSlides: (slides: Slide[]) => void;
}

interface SortableThumbnailProps {
  slide: Slide;
  index: number;
  isSelected: boolean;
  theme: Theme;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

// Get a preview label for the slide
function getSlidePreview(slide: Slide): string {
  switch (slide.data.template) {
    case 'title':
      return slide.data.headline || 'Title Slide';
    case 'content':
      return slide.data.heading || 'Content';
    case 'media':
      return 'Media';
    case 'split':
      return 'Split Layout';
    case 'quiz':
      return slide.data.question?.slice(0, 20) || 'Quiz';
    case 'webapp':
      return slide.data.title || 'Webapp';
    case 'code':
      return slide.data.heading || 'Code';
    case 'bullets':
      return slide.data.heading || 'Key Points';
    case 'canva':
      return slide.data.title || 'Canva';
    default:
      return 'Slide';
  }
}

// Get template icon
function getTemplateIcon(template: SlideTemplate): string {
  const icons: Record<SlideTemplate, string> = {
    title: 'T',
    content: '¶',
    media: '🖼',
    split: '⫼',
    quiz: '?',
    webapp: '◎',
    code: '</>',
    bullets: '•',
    canva: '▣',
  };
  return icons[template] || '□';
}

function SortableThumbnail({
  slide,
  index,
  isSelected,
  theme,
  onSelect,
  onDelete,
  onDuplicate,
}: SortableThumbnailProps) {
  const [showMenu, setShowMenu] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg cursor-pointer transition-all ${
        isSelected
          ? 'ring-2 ring-blue-500 ring-offset-2'
          : 'hover:ring-2 hover:ring-gray-300'
      }`}
      onClick={onSelect}
    >
      {/* Slide number */}
      <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
        {index + 1}
      </div>

      {/* Thumbnail preview */}
      <div
        className="aspect-video rounded-lg overflow-hidden border border-gray-200"
        style={{ backgroundColor: theme.colors.background }}
        {...attributes}
        {...listeners}
      >
        {/* Mini preview */}
        <div className="w-full h-full p-2 flex flex-col items-center justify-center">
          <span className="text-lg opacity-50">{getTemplateIcon(slide.data.template)}</span>
          <span
            className="text-[10px] mt-1 text-center line-clamp-2 px-1"
            style={{ color: theme.colors.textMuted }}
          >
            {getSlidePreview(slide)}
          </span>
        </div>
      </div>

      {/* Action menu button */}
      <button
        className="absolute top-1 right-1 p-1 rounded bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
      >
        <MoreVertical className="w-3 h-3 text-gray-500" />
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]">
            <button
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
                setShowMenu(false);
              }}
            >
              <Copy className="w-3 h-3" />
              Duplicate
            </button>
            <button
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setShowMenu(false);
              }}
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function SlideThumbnails({
  slides,
  selectedSlideId,
  theme,
  onSelectSlide,
  onAddSlide,
  onDeleteSlide,
  onDuplicateSlide,
  onReorderSlides,
}: SlideThumbnailsProps) {
  const [activeSlide, setActiveSlide] = useState<Slide | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const slide = slides.find((s) => s.id === event.active.id);
    if (slide) setActiveSlide(slide);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveSlide(null);

    if (!over || active.id === over.id) return;

    const oldIndex = slides.findIndex((s) => s.id === active.id);
    const newIndex = slides.findIndex((s) => s.id === over.id);

    const newSlides = [...slides];
    const [moved] = newSlides.splice(oldIndex, 1);
    newSlides.splice(newIndex, 0, moved);

    // Update orders
    const reorderedSlides = newSlides.map((s, i) => ({ ...s, order: i }));
    onReorderSlides(reorderedSlides);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">Slides</h3>
      </div>

      {/* Thumbnails list */}
      <div className="flex-1 overflow-y-auto p-4 pl-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={slides.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {slides.map((slide, index) => (
                <SortableThumbnail
                  key={slide.id}
                  slide={slide}
                  index={index}
                  isSelected={selectedSlideId === slide.id}
                  theme={theme}
                  onSelect={() => onSelectSlide(slide.id)}
                  onDelete={() => onDeleteSlide(slide.id)}
                  onDuplicate={() => onDuplicateSlide(slide.id)}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeSlide && (
              <div
                className="aspect-video w-32 rounded-lg border-2 border-blue-500 shadow-lg"
                style={{ backgroundColor: theme.colors.background }}
              >
                <div className="w-full h-full flex items-center justify-center text-sm opacity-50">
                  {getTemplateIcon(activeSlide.data.template)}
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {/* Add slide button */}
        <button
          onClick={() => onAddSlide('content')}
          className="mt-4 w-full aspect-video rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-blue-500"
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs">Add Slide</span>
        </button>
      </div>
    </div>
  );
}
