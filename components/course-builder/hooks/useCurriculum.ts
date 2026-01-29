import { useState, useEffect, useCallback, useRef } from 'react';
import { Course, Section, Lesson, LessonContent, LessonType } from '../../../types';
import { courseService } from '../../../services/courseService';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseCurriculumReturn {
  course: Course | null;
  sections: Section[];
  selectedLessonId: string | null;
  selectedLesson: Lesson | null;
  saveStatus: SaveStatus;
  error: string | null;
  isLoading: boolean;

  // Course actions
  updateCourseDetails: (updates: Partial<Course>) => Promise<void>;
  publishCourse: (published: boolean) => Promise<void>;

  // Section actions
  addSection: (title?: string) => Promise<void>;
  updateSection: (sectionId: string, title: string) => Promise<void>;
  deleteSection: (sectionId: string) => Promise<void>;
  reorderSections: (sectionIds: string[]) => Promise<void>;

  // Lesson actions
  addLesson: (sectionId: string, title?: string) => Promise<void>;
  updateLesson: (lessonId: string, updates: Partial<Lesson>) => Promise<void>;
  deleteLesson: (lessonId: string) => Promise<void>;
  reorderLessons: (sectionId: string, lessonIds: string[]) => Promise<void>;
  selectLesson: (lessonId: string | null) => void;

  // Content actions
  updateLessonContent: (lessonId: string, content: LessonContent) => void;
  forceSave: () => Promise<void>;
}

export function useCurriculum(courseId: string): UseCurriculumReturn {
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Track pending content saves for autosave
  const pendingContentSaves = useRef<Map<string, LessonContent>>(new Map());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load course data
  useEffect(() => {
    const loadCourse = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await courseService.getCourseById(courseId);
        if (data) {
          setCourse(data);
          setSections(data.sections || []);
        } else {
          setError('Course not found');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [courseId]);

  // Get selected lesson
  const selectedLesson = selectedLessonId
    ? sections.flatMap(s => s.lessons).find(l => l.id === selectedLessonId) || null
    : null;

  // Autosave logic
  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('saving');

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const saves = Array.from(pendingContentSaves.current.entries());

        await Promise.all(
          saves.map(([lessonId, content]) =>
            courseService.saveLessonContent(lessonId, content)
          )
        );

        pendingContentSaves.current.clear();
        setSaveStatus('saved');

        // Reset to idle after a moment
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err: any) {
        setSaveStatus('error');
        setError(err.message);
      }
    }, 1500);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Warn on navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingContentSaves.current.size > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // --- COURSE ACTIONS ---

  const updateCourseDetails = useCallback(async (updates: Partial<Course>) => {
    if (!course) return;

    setSaveStatus('saving');
    try {
      const updatedCourse = { ...course, ...updates };
      await courseService.updateCourse(updatedCourse);
      setCourse(updatedCourse);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) {
      setSaveStatus('error');
      setError(err.message);
    }
  }, [course]);

  const publishCourse = useCallback(async (published: boolean) => {
    if (!course) return;

    setSaveStatus('saving');
    try {
      await courseService.publishCourse(course.id, published);
      setCourse(prev => prev ? { ...prev, published } as Course : null);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) {
      setSaveStatus('error');
      setError(err.message);
    }
  }, [course]);

  // --- SECTION ACTIONS ---

  const addSection = useCallback(async (title = 'New Section') => {
    try {
      setSaveStatus('saving');
      const newSection = await courseService.createSection(courseId, title);
      setSections(prev => [...prev, newSection]);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) {
      setSaveStatus('error');
      setError(err.message);
    }
  }, [courseId]);

  const updateSection = useCallback(async (sectionId: string, title: string) => {
    try {
      setSaveStatus('saving');
      await courseService.updateSection(sectionId, { title });
      setSections(prev =>
        prev.map(s => s.id === sectionId ? { ...s, title } : s)
      );
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) {
      setSaveStatus('error');
      setError(err.message);
    }
  }, []);

  const deleteSection = useCallback(async (sectionId: string) => {
    try {
      setSaveStatus('saving');
      await courseService.deleteSection(sectionId);
      setSections(prev => prev.filter(s => s.id !== sectionId));

      // Clear selection if deleted lesson was selected
      if (selectedLessonId) {
        const deletedSection = sections.find(s => s.id === sectionId);
        if (deletedSection?.lessons.some(l => l.id === selectedLessonId)) {
          setSelectedLessonId(null);
        }
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) {
      setSaveStatus('error');
      setError(err.message);
    }
  }, [sections, selectedLessonId]);

  const reorderSections = useCallback(async (sectionIds: string[]) => {
    // Optimistic update
    setSections(prev => {
      const sectionMap = new Map(prev.map(s => [s.id, s]));
      return sectionIds.map((id, index) => ({
        ...sectionMap.get(id)!,
        order: index
      }));
    });

    try {
      await courseService.reorderSections(courseId, sectionIds);
    } catch (err: any) {
      setError(err.message);
      // Reload to restore correct order on error
      const data = await courseService.getCourseById(courseId);
      if (data) setSections(data.sections || []);
    }
  }, [courseId]);

  // --- LESSON ACTIONS ---

  const addLesson = useCallback(async (sectionId: string, title = 'New Lesson') => {
    try {
      setSaveStatus('saving');
      const newLesson = await courseService.createLesson(sectionId, title, LessonType.TEXT);
      setSections(prev =>
        prev.map(s =>
          s.id === sectionId
            ? { ...s, lessons: [...s.lessons, newLesson] }
            : s
        )
      );
      setSelectedLessonId(newLesson.id);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) {
      setSaveStatus('error');
      setError(err.message);
    }
  }, []);

  const updateLesson = useCallback(async (lessonId: string, updates: Partial<Lesson>) => {
    try {
      setSaveStatus('saving');

      // Extract only the fields that courseService.updateLesson accepts
      const serviceUpdates: Partial<Pick<Lesson, 'title' | 'type' | 'duration' | 'content' | 'isLocked' | 'order'>> = {};
      if (updates.title !== undefined) serviceUpdates.title = updates.title;
      if (updates.type !== undefined) serviceUpdates.type = updates.type;
      if (updates.duration !== undefined) serviceUpdates.duration = updates.duration;
      if (updates.content !== undefined) serviceUpdates.content = updates.content;
      if (updates.isLocked !== undefined) serviceUpdates.isLocked = updates.isLocked;
      if (updates.order !== undefined) serviceUpdates.order = updates.order;

      await courseService.updateLesson(lessonId, serviceUpdates);

      setSections(prev =>
        prev.map(s => ({
          ...s,
          lessons: s.lessons.map(l =>
            l.id === lessonId ? { ...l, ...updates } : l
          )
        }))
      );

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) {
      setSaveStatus('error');
      setError(err.message);
    }
  }, []);

  const deleteLesson = useCallback(async (lessonId: string) => {
    try {
      setSaveStatus('saving');
      await courseService.deleteLesson(lessonId);

      setSections(prev =>
        prev.map(s => ({
          ...s,
          lessons: s.lessons.filter(l => l.id !== lessonId)
        }))
      );

      if (selectedLessonId === lessonId) {
        setSelectedLessonId(null);
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) {
      setSaveStatus('error');
      setError(err.message);
    }
  }, [selectedLessonId]);

  const reorderLessons = useCallback(async (sectionId: string, lessonIds: string[]) => {
    // Optimistic update
    setSections(prev =>
      prev.map(s => {
        if (s.id !== sectionId) return s;
        const lessonMap = new Map(s.lessons.map(l => [l.id, l]));
        return {
          ...s,
          lessons: lessonIds.map((id, index) => ({
            ...lessonMap.get(id)!,
            order: index
          }))
        };
      })
    );

    try {
      await courseService.reorderLessons(sectionId, lessonIds);
    } catch (err: any) {
      setError(err.message);
      // Reload to restore correct order on error
      const data = await courseService.getCourseById(courseId);
      if (data) setSections(data.sections || []);
    }
  }, [courseId]);

  const selectLesson = useCallback((lessonId: string | null) => {
    setSelectedLessonId(lessonId);
  }, []);

  // --- CONTENT ACTIONS ---

  const updateLessonContent = useCallback((lessonId: string, content: LessonContent) => {
    // Update local state immediately
    setSections(prev =>
      prev.map(s => ({
        ...s,
        lessons: s.lessons.map(l =>
          l.id === lessonId ? { ...l, content } : l
        )
      }))
    );

    // Queue for autosave
    pendingContentSaves.current.set(lessonId, content);
    scheduleSave();
  }, [scheduleSave]);

  const forceSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (pendingContentSaves.current.size === 0) return;

    setSaveStatus('saving');
    try {
      const saves = Array.from(pendingContentSaves.current.entries());
      await Promise.all(
        saves.map(([lessonId, content]) =>
          courseService.saveLessonContent(lessonId, content)
        )
      );
      pendingContentSaves.current.clear();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) {
      setSaveStatus('error');
      setError(err.message);
    }
  }, []);

  return {
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
  };
}
