import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Course, Enrollment } from '../types';
import { courseService } from '../services/courseService';

interface CourseContextType {
  courses: Course[];
  enrollments: Enrollment[];
  searchQuery: string;
  selectedCategory: string;
  isLoading: boolean;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  enrollInCourse: (courseId: string) => Promise<void>;
  completeLesson: (courseId: string, lessonId: string) => Promise<void>;
  getEnrollment: (courseId: string) => Enrollment | undefined;
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  addCourse: (course: Course) => Promise<Course | null>;
  updateCourse: (course: Course) => Promise<void>;
  deleteCourse: (courseId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export const CourseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Initial Data Fetch
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [fetchedCourses, fetchedEnrollments] = await Promise.all([
        courseService.getAllCourses(),
        courseService.getMyEnrollments()
      ]);
      setCourses(fetchedCourses);
      setEnrollments(fetchedEnrollments);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const enrollInCourse = async (courseId: string) => {
    try {
      const newEnrollment = await courseService.enrollInCourse(courseId);
      setEnrollments(prev => [...prev, newEnrollment]);
    } catch (error) {
      console.error(error);
    }
  };

  const completeLesson = async (courseId: string, lessonId: string) => {
    try {
      const updatedEnrollment = await courseService.completeLesson(courseId, lessonId);
      setEnrollments(prev => prev.map(e => e.courseId === courseId ? updatedEnrollment : e));
    } catch (error) {
      console.error(error);
    }
  };

  const getEnrollment = (courseId: string) => {
    return enrollments.find(e => e.courseId === courseId);
  };

  const isLessonCompleted = (courseId: string, lessonId: string) => {
    const enrollment = enrollments.find(e => e.courseId === courseId);
    return enrollment ? enrollment.completedLessonIds.includes(lessonId) : false;
  };

  const addCourse = async (course: Course): Promise<Course | null> => {
    try {
      const newCourse = await courseService.createCourse(course);
      setCourses(prev => [...prev, newCourse]);
      return newCourse;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const updateCourse = async (updatedCourse: Course) => {
    try {
      const result = await courseService.updateCourse(updatedCourse);
      setCourses(prev => prev.map(c => c.id === result.id ? result : c));
    } catch (error) {
      console.error(error);
    }
  };

  const deleteCourse = async (courseId: string) => {
    try {
      await courseService.deleteCourse(courseId);
      setCourses(prev => prev.filter(c => c.id !== courseId));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <CourseContext.Provider value={{ 
      courses, 
      enrollments, 
      searchQuery,
      selectedCategory,
      isLoading,
      setSearchQuery,
      setSelectedCategory,
      enrollInCourse, 
      completeLesson, 
      getEnrollment,
      isLessonCompleted,
      addCourse,
      updateCourse,
      deleteCourse,
      refreshData
    }}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = () => {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
};