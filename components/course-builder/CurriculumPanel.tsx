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
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { Section, Lesson } from '../../types';
import { SectionItem } from './SectionItem';
import { LessonItem } from './LessonItem';
import { Plus, BookOpen } from 'lucide-react';

interface CurriculumPanelProps {
  sections: Section[];
  selectedLessonId: string | null;
  onSelectLesson: (lessonId: string | null) => void;
  onAddSection: () => void;
  onUpdateSection: (sectionId: string, title: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onReorderSections: (sectionIds: string[]) => void;
  onAddLesson: (sectionId: string) => void;
  onUpdateLesson: (lessonId: string, updates: Partial<Lesson>) => void;
  onDeleteLesson: (lessonId: string) => void;
  onReorderLessons: (sectionId: string, lessonIds: string[]) => void;
}

export function CurriculumPanel({
  sections,
  selectedLessonId,
  onSelectLesson,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onReorderSections,
  onAddLesson,
  onUpdateLesson,
  onDeleteLesson,
  onReorderLessons
}: CurriculumPanelProps) {
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map(s => s.id))
  );

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

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;

    // Check if it's a section or lesson
    const section = sections.find(s => s.id === activeId);
    if (section) {
      setActiveSection(section);
      return;
    }

    const lesson = sections.flatMap(s => s.lessons).find(l => l.id === activeId);
    if (lesson) {
      setActiveLesson(lesson);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveSection(null);
    setActiveLesson(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Check if dragging a section
    const activeSectionIndex = sections.findIndex(s => s.id === activeId);
    if (activeSectionIndex !== -1) {
      const overSectionIndex = sections.findIndex(s => s.id === overId);
      if (overSectionIndex !== -1) {
        const newOrder = [...sections];
        const [moved] = newOrder.splice(activeSectionIndex, 1);
        newOrder.splice(overSectionIndex, 0, moved);
        onReorderSections(newOrder.map(s => s.id));
      }
      return;
    }

    // Check if dragging a lesson
    const activeSection = sections.find(s => s.lessons.some(l => l.id === activeId));
    if (activeSection) {
      const activeLessonIndex = activeSection.lessons.findIndex(l => l.id === activeId);
      const overLessonIndex = activeSection.lessons.findIndex(l => l.id === overId);

      if (overLessonIndex !== -1) {
        const newLessons = [...activeSection.lessons];
        const [moved] = newLessons.splice(activeLessonIndex, 1);
        newLessons.splice(overLessonIndex, 0, moved);
        onReorderLessons(activeSection.id, newLessons.map(l => l.id));
      }
    }
  };

  const totalLessons = sections.reduce((acc, s) => acc + s.lessons.length, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">Curriculum</h2>
        </div>
        <span className="text-xs text-gray-500">
          {sections.length} sections, {totalLessons} lessons
        </span>
      </div>

      {/* Section list */}
      <div className="flex-1 overflow-y-auto p-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {sections.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No sections yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Add a section to get started
                </p>
              </div>
            ) : (
              sections.map(section => (
                <SectionItem
                  key={section.id}
                  section={section}
                  isExpanded={expandedSections.has(section.id)}
                  selectedLessonId={selectedLessonId}
                  onToggle={() => toggleSection(section.id)}
                  onUpdate={(title) => onUpdateSection(section.id, title)}
                  onDelete={() => onDeleteSection(section.id)}
                  onAddLesson={() => onAddLesson(section.id)}
                  onSelectLesson={onSelectLesson}
                  onUpdateLesson={onUpdateLesson}
                  onDeleteLesson={onDeleteLesson}
                  onReorderLessons={(lessonIds) => onReorderLessons(section.id, lessonIds)}
                />
              ))
            )}
          </SortableContext>

          <DragOverlay>
            {activeSection && (
              <div className="bg-white border border-blue-300 rounded-lg p-3 shadow-lg opacity-90">
                <span className="font-medium">{activeSection.title}</span>
              </div>
            )}
            {activeLesson && (
              <div className="bg-white border border-blue-300 rounded-lg p-2 shadow-lg opacity-90">
                <span className="text-sm">{activeLesson.title}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Add section button */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={onAddSection}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Section
        </button>
      </div>
    </div>
  );
}
