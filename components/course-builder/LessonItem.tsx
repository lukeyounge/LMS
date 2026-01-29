import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  FileText,
  Video,
  HelpCircle,
  Code,
  Image,
  MoreHorizontal,
  Pencil,
  Trash2,
  Lock,
  Unlock
} from 'lucide-react';
import { Lesson, LessonType } from '../../types';

interface LessonItemProps {
  lesson: Lesson;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<Lesson>) => void;
  onDelete: () => void;
}

const lessonTypeIcons: Record<LessonType, typeof FileText> = {
  [LessonType.TEXT]: FileText,
  [LessonType.VIDEO]: Video,
  [LessonType.QUIZ]: HelpCircle,
  [LessonType.ASSIGNMENT]: Code
};

const lessonTypeColors: Record<LessonType, string> = {
  [LessonType.TEXT]: 'text-blue-500',
  [LessonType.VIDEO]: 'text-purple-500',
  [LessonType.QUIZ]: 'text-amber-500',
  [LessonType.ASSIGNMENT]: 'text-green-500'
};

export function LessonItem({
  lesson,
  isSelected,
  onSelect,
  onUpdate,
  onDelete
}: LessonItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(lesson.title);
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
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const Icon = lessonTypeIcons[lesson.type];
  const iconColor = lessonTypeColors[lesson.type];

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
    if (editTitle.trim() && editTitle !== lesson.title) {
      onUpdate({ title: editTitle.trim() });
    } else {
      setEditTitle(lesson.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditTitle(lesson.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-1 px-2 py-1.5 my-0.5 rounded-md transition-colors cursor-pointer ${
        isSelected
          ? 'bg-blue-100 border border-blue-300'
          : isDragging
          ? 'bg-blue-50'
          : 'hover:bg-gray-100'
      }`}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="p-0.5 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100"
      >
        <GripVertical className="w-3 h-3" />
      </button>

      {/* Type icon */}
      <Icon className={`w-4 h-4 ${iconColor} flex-shrink-0`} />

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
            onClick={(e) => e.stopPropagation()}
            className="w-full px-1 py-0.5 text-sm border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <span className="block truncate text-sm text-gray-700">
            {lesson.title}
          </span>
        )}
      </div>

      {/* Duration */}
      <span className="text-xs text-gray-400 mr-1">
        {lesson.duration}m
      </span>

      {/* Lock indicator */}
      {lesson.isLocked && (
        <Lock className="w-3 h-3 text-gray-400" />
      )}

      {/* Menu button */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-0.5 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                setIsEditing(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Pencil className="w-4 h-4" />
              Rename
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                onUpdate({ isLocked: !lesson.isLocked });
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {lesson.isLocked ? (
                <>
                  <Unlock className="w-4 h-4" />
                  Unlock
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Lock
                </>
              )}
            </button>
            <hr className="my-1" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                if (confirm('Delete this lesson?')) {
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
  );
}
