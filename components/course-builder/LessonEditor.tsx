import { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  FileText,
  Clock,
  Lock,
  Unlock,
  Plus
} from 'lucide-react';
import {
  Lesson,
  LessonContent,
  Page,
  PageType,
  isPageBasedContent,
  createPage,
  createEmptyLessonContent
} from '../../types';
import { BlockRenderer } from './blocks/BlockRenderer';
import { SlashCommandMenu } from './SlashCommandMenu';

interface LessonEditorProps {
  lesson: Lesson;
  onUpdateLesson: (updates: Partial<Lesson>) => void;
  onUpdateContent: (content: LessonContent) => void;
}

interface SortableBlockProps {
  page: Page;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (data: Page['data']) => void;
  onDelete: () => void;
}

function SortableBlock({
  page,
  isSelected,
  onSelect,
  onUpdate,
  onDelete
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      {/* Drag handle - appears on hover */}
      <button
        {...attributes}
        {...listeners}
        className="absolute -left-8 top-2 p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <BlockRenderer
        page={page}
        isSelected={isSelected}
        onSelect={onSelect}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </div>
  );
}

export function LessonEditor({
  lesson,
  onUpdateLesson,
  onUpdateContent
}: LessonEditorProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeBlock, setActiveBlock] = useState<Page | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 });

  // Get content - handle both old string format and new page-based format
  const content: LessonContent = isPageBasedContent(lesson.content)
    ? lesson.content
    : createEmptyLessonContent();

  const pages = content.pages.sort((a, b) => a.order - b.order);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const block = pages.find(p => p.id === event.active.id);
    if (block) setActiveBlock(block);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveBlock(null);

    if (!over || active.id === over.id) return;

    const oldIndex = pages.findIndex(p => p.id === active.id);
    const newIndex = pages.findIndex(p => p.id === over.id);

    const newPages = [...pages];
    const [moved] = newPages.splice(oldIndex, 1);
    newPages.splice(newIndex, 0, moved);

    // Update orders
    const reorderedPages = newPages.map((p, i) => ({ ...p, order: i }));

    onUpdateContent({
      pages: reorderedPages
    });
  };

  const addBlock = useCallback((type: PageType, afterBlockId?: string) => {
    const newOrder = afterBlockId
      ? (pages.find(p => p.id === afterBlockId)?.order ?? pages.length - 1) + 1
      : pages.length;

    const newPage = createPage(type, newOrder);

    // Shift orders of blocks after the insertion point
    const updatedPages = pages.map(p =>
      p.order >= newOrder ? { ...p, order: p.order + 1 } : p
    );

    onUpdateContent({
      pages: [...updatedPages, newPage].sort((a, b) => a.order - b.order)
    });

    setSelectedBlockId(newPage.id);
    setShowSlashMenu(false);
  }, [pages, onUpdateContent]);

  const updateBlock = useCallback((blockId: string, data: Page['data']) => {
    const updatedPages = pages.map(p =>
      p.id === blockId ? { ...p, data } : p
    );
    onUpdateContent({ pages: updatedPages });
  }, [pages, onUpdateContent]);

  const deleteBlock = useCallback((blockId: string) => {
    const updatedPages = pages.filter(p => p.id !== blockId);
    // Reorder remaining blocks
    const reorderedPages = updatedPages.map((p, i) => ({ ...p, order: i }));
    onUpdateContent({ pages: reorderedPages });

    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  }, [pages, selectedBlockId, onUpdateContent]);

  const handleTitleChange = (title: string) => {
    onUpdateLesson({ title });
  };

  const handleDurationChange = (duration: number) => {
    onUpdateLesson({ duration: Math.max(1, duration) });
  };

  const handleLockToggle = () => {
    onUpdateLesson({ isLocked: !lesson.isLocked });
  };

  const handleAddBlockClick = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setSlashMenuPosition({ x: rect.left, y: rect.bottom + 8 });
    setShowSlashMenu(true);
  };

  // Handle keyboard shortcut for slash command
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === '/' && !showSlashMenu) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSlashMenuPosition({ x: rect.left, y: rect.bottom + 8 });
        setShowSlashMenu(true);
      }
    }
    if (e.key === 'Escape') {
      setShowSlashMenu(false);
      setSelectedBlockId(null);
    }
  }, [showSlashMenu]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Lesson header */}
      <div className="flex-shrink-0 px-8 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          {/* Title */}
          <div className="flex-1">
            <input
              type="text"
              value={lesson.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Lesson title"
              className="w-full text-2xl font-bold text-gray-900 border-0 border-b-2 border-transparent hover:border-gray-200 focus:border-blue-500 focus:outline-none transition-colors pb-1"
            />
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-4 h-4" />
            <input
              type="number"
              value={lesson.duration}
              onChange={(e) => handleDurationChange(parseInt(e.target.value) || 1)}
              min={1}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm">min</span>
          </div>

          {/* Lock toggle */}
          <button
            onClick={handleLockToggle}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              lesson.isLocked
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={lesson.isLocked ? 'Lesson is locked' : 'Lesson is unlocked'}
          >
            {lesson.isLocked ? (
              <>
                <Lock className="w-4 h-4" />
                Locked
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                Unlocked
              </>
            )}
          </button>
        </div>
      </div>

      {/* Block editor */}
      <div
        className="flex-1 overflow-y-auto"
        onClick={() => setSelectedBlockId(null)}
      >
        <div className="max-w-3xl mx-auto px-8 py-6">
          {pages.length === 0 ? (
            // Empty state
            <div className="text-center py-16">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Start building your lesson
              </h3>
              <p className="text-gray-500 mb-6">
                Add content blocks like text, videos, quizzes, and more
              </p>
              <button
                onClick={handleAddBlockClick}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add your first block
              </button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={pages.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {pages.map((page) => (
                    <SortableBlock
                      key={page.id}
                      page={page}
                      isSelected={selectedBlockId === page.id}
                      onSelect={() => setSelectedBlockId(page.id)}
                      onUpdate={(data) => updateBlock(page.id, data)}
                      onDelete={() => deleteBlock(page.id)}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeBlock && (
                  <div className="bg-white border border-blue-300 rounded-lg p-4 shadow-lg opacity-90">
                    <span className="text-sm text-gray-600">
                      {activeBlock.type} block
                    </span>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}

          {/* Add block button (always visible when there are blocks) */}
          {pages.length > 0 && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleAddBlockClick}
                className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add block
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Slash command menu */}
      {showSlashMenu && (
        <SlashCommandMenu
          position={slashMenuPosition}
          onSelect={(type) => addBlock(type)}
          onClose={() => setShowSlashMenu(false)}
        />
      )}
    </div>
  );
}
