import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus
} from 'lucide-react';
import { Section, Lesson } from '../../types';
import { LessonItem } from './LessonItem';

interface SectionItemProps {
  section: Section;
  isExpanded: boolean;
  selectedLessonId: string | null;
  onToggle: () => void;
  onUpdate: (title: string) => void;
  onDelete: () => void;
  onAddLesson: () => void;
  onSelectLesson: (lessonId: string | null) => void;
  onUpdateLesson: (lessonId: string, updates: Partial<Lesson>) => void;
  onDeleteLesson: (lessonId: string) => void;
  onReorderLessons: (lessonIds: string[]) => void;
}

export function SectionItem({
  section,
  isExpanded,
  selectedLessonId,
  onToggle,
  onUpdate,
  onDelete,
  onAddLesson,
  onSelectLesson,
  onUpdateLesson,
  onDeleteLesson,
  onReorderLessons
}: SectionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== section.title) {
      onUpdate(editTitle.trim());
    } else {
      setEditTitle(section.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditTitle(section.title);
      setIsEditing(false);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      {/* Section header */}
      <div
        className={`group flex items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
          isDragging ? 'bg-blue-50' : 'hover:bg-gray-50'
        }`}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Expand/collapse */}
        <button
          onClick={onToggle}
          className="p-1 text-gray-500 hover:text-gray-700"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 text-sm font-medium border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <span
              className="block truncate text-sm font-medium text-gray-900 cursor-pointer"
              onDoubleClick={() => setIsEditing(true)}
            >
              {section.title}
            </span>
          )}
        </div>

        {/* Lesson count */}
        <span className="text-xs text-gray-400 mr-1">
          {section.lessons.length}
        </span>

        {/* Menu button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setIsEditing(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Pencil className="w-4 h-4" />
                Rename
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onAddLesson();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
                Add Lesson
              </button>
              <hr className="my-1" />
              <button
                onClick={() => {
                  setShowMenu(false);
                  if (confirm('Delete this section and all its lessons?')) {
                    onDelete();
                  }
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lessons */}
      {isExpanded && (
        <div className="ml-6 pl-2 border-l border-gray-200">
          <SortableContext
            items={section.lessons.map(l => l.id)}
            strategy={verticalListSortingStrategy}
          >
            {section.lessons.map(lesson => (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                isSelected={selectedLessonId === lesson.id}
                onSelect={() => onSelectLesson(lesson.id)}
                onUpdate={(updates) => onUpdateLesson(lesson.id, updates)}
                onDelete={() => onDeleteLesson(lesson.id)}
              />
            ))}
          </SortableContext>

          {section.lessons.length === 0 && (
            <div className="py-3 text-center">
              <button
                onClick={onAddLesson}
                className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
              >
                + Add first lesson
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
