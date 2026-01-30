import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  Globe,
  EyeOff,
  Settings,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useCurriculum } from './hooks/useCurriculum';
import { AutosaveIndicator } from './AutosaveIndicator';
import { CurriculumPanel } from './CurriculumPanel';
import { SlideEditor } from './slides/SlideEditor';
import { CommandPalette } from './CommandPalette';
import { CourseDetailsPanel } from './CourseDetailsPanel';
import { SlideBasedContent } from './slides/slideTypes';

export function CourseBuilder() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const {
    course,
    sections,
    selectedLessonId,
    selectedLesson,
    saveStatus,
    error,
    isLoading,
    updateCourseDetails,
    publishCourse,
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
    addLesson,
    updateLesson,
    deleteLesson,
    reorderLessons,
    selectLesson,
    updateLessonContent,
    forceSave
  } = useCurriculum(courseId!);

  // Keyboard shortcuts
  useState(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      // Cmd/Ctrl + S for force save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        forceSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Course not found'}</p>
          <button
            onClick={() => navigate('/instructor')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const isPublished = (course as any).published;

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top header */}
      <header className="flex-shrink-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/instructor')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>

          <div className="h-6 w-px bg-gray-200" />

          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-gray-900 truncate max-w-md">
              {course.title}
            </h1>
            <AutosaveIndicator status={saveStatus} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetails(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>

          <button
            onClick={() => window.open(`/#/course/${courseId}`, '_blank')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>

          <button
            onClick={() => publishCourse(!isPublished)}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              isPublished
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isPublished ? (
              <>
                <EyeOff className="w-4 h-4" />
                Unpublish
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                Publish
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`flex-shrink-0 bg-white border-r border-gray-200 transition-all duration-200 ${
            sidebarCollapsed ? 'w-0' : 'w-72'
          }`}
        >
          {!sidebarCollapsed && (
            <CurriculumPanel
              sections={sections}
              selectedLessonId={selectedLessonId}
              onSelectLesson={selectLesson}
              onAddSection={() => addSection()}
              onUpdateSection={updateSection}
              onDeleteSection={deleteSection}
              onReorderSections={reorderSections}
              onAddLesson={addLesson}
              onUpdateLesson={updateLesson}
              onDeleteLesson={deleteLesson}
              onReorderLessons={reorderLessons}
            />
          )}
        </aside>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute left-[calc(theme(width.72)-12px)] top-1/2 -translate-y-1/2 z-10 w-6 h-12 bg-white border border-gray-200 rounded-r-lg shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
          style={{ left: sidebarCollapsed ? 0 : 'calc(18rem - 12px)' }}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Main editor area */}
        <main className="flex-1 overflow-hidden">
          {selectedLesson ? (
            <SlideEditor
              lesson={selectedLesson}
              onUpdateLesson={(updates) => updateLesson(selectedLesson.id, updates)}
              onUpdateContent={(content: SlideBasedContent) => updateLessonContent(selectedLesson.id, content)}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <ChevronLeft className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  Select a lesson to edit
                </h2>
                <p className="text-sm text-gray-500 max-w-sm">
                  Choose a lesson from the sidebar, or create a new section and lesson to get started
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Course details modal */}
      {showDetails && (
        <CourseDetailsPanel
          course={course}
          onUpdate={updateCourseDetails}
          onClose={() => setShowDetails(false)}
        />
      )}

      {/* Command palette */}
      {showCommandPalette && (
        <CommandPalette
          sections={sections}
          onSelectLesson={selectLesson}
          onAddSection={() => addSection()}
          onClose={() => setShowCommandPalette(false)}
        />
      )}
    </div>
  );
}
