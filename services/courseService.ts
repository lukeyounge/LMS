import { Course, Enrollment, Section, Lesson, LessonContent, LessonType, createEmptyLessonContent, EmbedInteraction, EmbedStatus, EmbedSubmissionType } from '../types';
import { SlideBasedContent, createEmptySlideContent } from '../components/course-builder/slides/slideTypes';
import { supabase } from '../lib/supabase';

// Union type for all content types
type AnyLessonContent = LessonContent | SlideBasedContent;

export const courseService = {
  // --- READ OPERATIONS ---

  async getAllCourses(): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        instructor:users!instructor_id(name)
      `)
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return data.map(course => ({
      id: course.id,
      instructorId: course.instructor_id,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnail_url,
      instructorName: course.instructor.name,
      price: course.price,
      category: course.category,
      level: course.level,
      totalStudents: course.total_students,
      rating: course.rating,
      sections: []
    }));
  },

  async getCourseById(id: string): Promise<Course | undefined> {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        instructor:users!instructor_id(name),
        sections(
          *,
          lessons(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(error.message);
    }

    const { data: { user } } = await supabase.auth.getUser();
    let enrollment = null;

    if (user) {
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', id)
        .single();

      enrollment = enrollmentData;
    }

    return {
      id: data.id,
      instructorId: data.instructor_id,
      title: data.title,
      description: data.description,
      thumbnailUrl: data.thumbnail_url,
      instructorName: data.instructor.name,
      price: data.price,
      category: data.category,
      level: data.level,
      totalStudents: data.total_students,
      rating: data.rating,
      sections: data.sections.map((section: any) => ({
        id: section.id,
        courseId: section.course_id,
        title: section.title,
        order: section.order,
        lessons: section.lessons.map((lesson: any) => ({
          id: lesson.id,
          sectionId: lesson.section_id,
          title: lesson.title,
          type: lesson.type,
          duration: lesson.duration,
          content: lesson.content,
          isCompleted: enrollment?.completed_lesson_ids?.includes(lesson.id) || false,
          isLocked: lesson.is_locked,
          order: lesson.order
        }))
      }))
    };
  },

  async getMyEnrollments(): Promise<Enrollment[]> {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .order('enrolled_at', { ascending: false });

    if (error) throw new Error(error.message);

    return data.map(enrollment => ({
      courseId: enrollment.course_id,
      progress: enrollment.progress,
      completedLessonIds: enrollment.completed_lesson_ids || [],
      lastAccessedLessonId: enrollment.last_accessed_lesson_id || undefined,
      enrolledAt: new Date(enrollment.enrolled_at)
    }));
  },

  // --- WRITE OPERATIONS ---

  async enrollInCourse(courseId: string): Promise<Enrollment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        user_id: user.id,
        course_id: courseId,
        progress: 0,
        completed_lesson_ids: []
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    await supabase.rpc('increment_course_students', { course_id: courseId });

    return {
      courseId: data.course_id,
      progress: data.progress,
      completedLessonIds: data.completed_lesson_ids || [],
      lastAccessedLessonId: data.last_accessed_lesson_id || undefined,
      enrolledAt: new Date(data.enrolled_at)
    };
  },

  async updateCourse(updatedCourse: Course): Promise<Course> {
    const { data, error } = await supabase
      .from('courses')
      .update({
        title: updatedCourse.title,
        description: updatedCourse.description,
        thumbnail_url: updatedCourse.thumbnailUrl,
        price: updatedCourse.price,
        category: updatedCourse.category,
        level: updatedCourse.level
      })
      .eq('id', updatedCourse.id)
      .select(`
        *,
        instructor:users!instructor_id(name)
      `)
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      instructorId: data.instructor_id,
      title: data.title,
      description: data.description,
      thumbnailUrl: data.thumbnail_url,
      instructorName: data.instructor.name,
      price: data.price,
      category: data.category,
      level: data.level,
      totalStudents: data.total_students,
      rating: data.rating,
      sections: []
    };
  },

  async createCourse(newCourse: Partial<Course>): Promise<Course> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('courses')
      .insert({
        instructor_id: user.id,
        title: newCourse.title!,
        description: newCourse.description!,
        thumbnail_url: newCourse.thumbnailUrl || 'https://via.placeholder.com/400x300?text=Course',
        price: newCourse.price || 0,
        category: newCourse.category || 'General',
        level: newCourse.level || 'Beginner',
        published: false
      })
      .select(`
        *,
        instructor:users!instructor_id(name)
      `)
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      instructorId: data.instructor_id,
      title: data.title,
      description: data.description,
      thumbnailUrl: data.thumbnail_url,
      instructorName: data.instructor.name,
      price: data.price,
      category: data.category,
      level: data.level,
      totalStudents: data.total_students,
      rating: data.rating,
      sections: []
    };
  },

  async deleteCourse(courseId: string): Promise<void> {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) throw new Error(error.message);
  },

  // --- SECTION CRUD ---

  async createSection(courseId: string, title: string): Promise<Section> {
    // Get the highest order number for existing sections
    const { data: existingSections } = await supabase
      .from('sections')
      .select('order')
      .eq('course_id', courseId)
      .order('order', { ascending: false })
      .limit(1);

    const nextOrder = existingSections && existingSections.length > 0 ? existingSections[0].order + 1 : 0;

    const { data, error } = await supabase
      .from('sections')
      .insert({
        course_id: courseId,
        title,
        order: nextOrder
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      courseId: data.course_id,
      title: data.title,
      order: data.order,
      lessons: []
    };
  },

  async updateSection(sectionId: string, updates: Partial<Pick<Section, 'title' | 'order'>>): Promise<Section> {
    const { data, error } = await supabase
      .from('sections')
      .update({
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.order !== undefined && { order: updates.order })
      })
      .eq('id', sectionId)
      .select(`*, lessons(*)`)
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      courseId: data.course_id,
      title: data.title,
      order: data.order,
      lessons: (data.lessons || []).map((lesson: any) => ({
        id: lesson.id,
        sectionId: lesson.section_id,
        title: lesson.title,
        type: lesson.type,
        duration: lesson.duration,
        content: lesson.content,
        isCompleted: false,
        isLocked: lesson.is_locked,
        order: lesson.order
      }))
    };
  },

  async deleteSection(sectionId: string): Promise<void> {
    const { error } = await supabase
      .from('sections')
      .delete()
      .eq('id', sectionId);

    if (error) throw new Error(error.message);
  },

  async reorderSections(courseId: string, sectionIds: string[]): Promise<void> {
    // Update each section's order based on its position in the array
    const updates = sectionIds.map((id, index) =>
      supabase
        .from('sections')
        .update({ order: index })
        .eq('id', id)
        .eq('course_id', courseId)
    );

    const results = await Promise.all(updates);
    const error = results.find(r => r.error)?.error;
    if (error) throw new Error(error.message);
  },

  // --- LESSON CRUD ---

  async createLesson(sectionId: string, title: string, type: LessonType = LessonType.TEXT): Promise<Lesson> {
    // Get the highest order number for existing lessons in this section
    const { data: existingLessons } = await supabase
      .from('lessons')
      .select('order')
      .eq('section_id', sectionId)
      .order('order', { ascending: false })
      .limit(1);

    const nextOrder = existingLessons && existingLessons.length > 0 ? existingLessons[0].order + 1 : 0;

    // Use slide-based content by default (v2)
    const emptyContent = createEmptySlideContent();

    const { data, error } = await supabase
      .from('lessons')
      .insert({
        section_id: sectionId,
        title,
        type,
        duration: 5,
        content: emptyContent,
        is_locked: false,
        order: nextOrder
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      sectionId: data.section_id,
      title: data.title,
      type: data.type,
      duration: data.duration,
      content: data.content,
      isCompleted: false,
      isLocked: data.is_locked,
      order: data.order
    };
  },

  async updateLesson(lessonId: string, updates: Partial<Pick<Lesson, 'title' | 'type' | 'duration' | 'content' | 'isLocked' | 'order'>>): Promise<Lesson> {
    const updateData: Record<string, any> = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.isLocked !== undefined) updateData.is_locked = updates.isLocked;
    if (updates.order !== undefined) updateData.order = updates.order;

    const { data, error } = await supabase
      .from('lessons')
      .update(updateData)
      .eq('id', lessonId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      sectionId: data.section_id,
      title: data.title,
      type: data.type,
      duration: data.duration,
      content: data.content,
      isCompleted: false,
      isLocked: data.is_locked,
      order: data.order
    };
  },

  async deleteLesson(lessonId: string): Promise<void> {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);

    if (error) throw new Error(error.message);
  },

  async reorderLessons(sectionId: string, lessonIds: string[]): Promise<void> {
    const updates = lessonIds.map((id, index) =>
      supabase
        .from('lessons')
        .update({ order: index })
        .eq('id', id)
        .eq('section_id', sectionId)
    );

    const results = await Promise.all(updates);
    const error = results.find(r => r.error)?.error;
    if (error) throw new Error(error.message);
  },

  // --- CURRICULUM BATCH SAVE ---

  async saveLessonContent(lessonId: string, content: AnyLessonContent): Promise<void> {
    const { error } = await supabase
      .from('lessons')
      .update({ content })
      .eq('id', lessonId);

    if (error) throw new Error(error.message);
  },

  // --- COURSE PUBLISH ---

  async publishCourse(courseId: string, published: boolean): Promise<void> {
    const { error } = await supabase
      .from('courses')
      .update({ published })
      .eq('id', courseId);

    if (error) throw new Error(error.message);
  },

  // --- INSTRUCTOR COURSES ---

  async getInstructorCourses(): Promise<Course[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        instructor:users!instructor_id(name),
        sections(
          *,
          lessons(*)
        )
      `)
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return data.map(course => ({
      id: course.id,
      instructorId: course.instructor_id,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnail_url,
      instructorName: course.instructor.name,
      price: course.price,
      category: course.category,
      level: course.level,
      totalStudents: course.total_students,
      rating: course.rating,
      published: course.published,
      sections: (course.sections || [])
        .sort((a: any, b: any) => a.order - b.order)
        .map((section: any) => ({
          id: section.id,
          courseId: section.course_id,
          title: section.title,
          order: section.order,
          lessons: (section.lessons || [])
            .sort((a: any, b: any) => a.order - b.order)
            .map((lesson: any) => ({
              id: lesson.id,
              sectionId: lesson.section_id,
              title: lesson.title,
              type: lesson.type,
              duration: lesson.duration,
              content: lesson.content,
              isCompleted: false,
              isLocked: lesson.is_locked,
              order: lesson.order
            }))
        }))
    }));
  },

  async completeLesson(courseId: string, lessonId: string): Promise<Enrollment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    if (enrollment.completed_lesson_ids?.includes(lessonId)) {
      const { data: updated, error: updateError } = await supabase
        .from('enrollments')
        .update({ last_accessed_lesson_id: lessonId })
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .select()
        .single();

      if (updateError) throw new Error(updateError.message);

      return {
        courseId: updated.course_id,
        progress: updated.progress,
        completedLessonIds: updated.completed_lesson_ids || [],
        lastAccessedLessonId: updated.last_accessed_lesson_id || undefined,
        enrolledAt: new Date(updated.enrolled_at)
      };
    }

    const updatedCompletedIds = [...(enrollment.completed_lesson_ids || []), lessonId];

    const { data: course } = await supabase
      .from('courses')
      .select(`sections(lessons(id))`)
      .eq('id', courseId)
      .single();

    let progress = 0;
    if (course) {
      const totalLessons = course.sections.reduce(
        (acc: number, section: any) => acc + section.lessons.length,
        0
      );
      progress = totalLessons > 0 ? Math.round((updatedCompletedIds.length / totalLessons) * 100) : 0;
    }

    const { data: updated, error: updateError } = await supabase
      .from('enrollments')
      .update({
        completed_lesson_ids: updatedCompletedIds,
        progress,
        last_accessed_lesson_id: lessonId
      })
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    return {
      courseId: updated.course_id,
      progress: updated.progress,
      completedLessonIds: updated.completed_lesson_ids || [],
      lastAccessedLessonId: updated.last_accessed_lesson_id || undefined,
      enrolledAt: new Date(updated.enrolled_at)
    };
  },

  // --- EMBED INTERACTION TRACKING ---

  /**
   * Track an interaction with an embedded webapp
   * Uses the database function for upsert to handle race conditions
   */
  async trackEmbedInteraction(
    courseId: string,
    lessonId: string,
    slideId: string,
    embedUrl: string,
    interaction: {
      status?: EmbedStatus;
      progress?: number;
      score?: number;
      timeSpentSeconds?: number;
      submissionData?: unknown;
      submissionType?: EmbedSubmissionType;
    }
  ): Promise<EmbedInteraction> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('upsert_embed_interaction', {
      p_course_id: courseId,
      p_lesson_id: lessonId,
      p_slide_id: slideId,
      p_embed_url: embedUrl,
      p_status: interaction.status || null,
      p_progress: interaction.progress ?? null,
      p_score: interaction.score ?? null,
      p_time_spent_seconds: interaction.timeSpentSeconds ?? null,
      p_submission_data: interaction.submissionData ? JSON.stringify(interaction.submissionData) : null,
      p_submission_type: interaction.submissionType || null
    });

    if (error) throw new Error(error.message);

    return mapEmbedInteraction(data);
  },

  /**
   * Get all embed interactions for a specific lesson
   */
  async getEmbedInteractions(courseId: string, lessonId: string): Promise<EmbedInteraction[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // First get the enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (enrollmentError) {
      if (enrollmentError.code === 'PGRST116') return []; // Not enrolled
      throw new Error(enrollmentError.message);
    }

    const { data, error } = await supabase
      .from('embed_interactions')
      .select('*')
      .eq('enrollment_id', enrollment.id)
      .eq('lesson_id', lessonId);

    if (error) throw new Error(error.message);

    return (data || []).map(mapEmbedInteraction);
  },

  /**
   * Get a specific embed interaction by slide ID
   */
  async getEmbedInteractionBySlide(courseId: string, lessonId: string, slideId: string): Promise<EmbedInteraction | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // First get the enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (enrollmentError) {
      if (enrollmentError.code === 'PGRST116') return null; // Not enrolled
      throw new Error(enrollmentError.message);
    }

    const { data, error } = await supabase
      .from('embed_interactions')
      .select('*')
      .eq('enrollment_id', enrollment.id)
      .eq('lesson_id', lessonId)
      .eq('slide_id', slideId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(error.message);
    }

    return mapEmbedInteraction(data);
  }
};

// Helper function to map database row to EmbedInteraction type
function mapEmbedInteraction(row: any): EmbedInteraction {
  return {
    id: row.id,
    enrollmentId: row.enrollment_id,
    lessonId: row.lesson_id,
    slideId: row.slide_id,
    embedUrl: row.embed_url,
    status: row.status,
    progress: row.progress || 0,
    score: row.score ?? undefined,
    timeSpentSeconds: row.time_spent_seconds || 0,
    submissionData: row.submission_data ?? undefined,
    submissionType: row.submission_type ?? undefined,
    startedAt: row.started_at ? new Date(row.started_at) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    lastInteractionAt: new Date(row.last_interaction_at)
  };
}
