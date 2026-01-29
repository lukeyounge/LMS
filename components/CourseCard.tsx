import React from 'react';
import { Course } from '../types';
import { Star, Users, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <Link to={`/course/${course.id}`} className="group h-full">
        <div className="bg-white rounded-2xl overflow-hidden hover:shadow-card-hover shadow-card transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1 ring-1 ring-gray-100">
        {/* Image Container */}
        <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
            <img 
            src={course.thumbnailUrl} 
            alt={course.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-gray-900 shadow-sm">
            {course.level}
            </div>
            <div className="absolute bottom-3 left-3 text-white font-medium text-xs flex items-center gap-2">
                <span className="bg-primary-600 px-2 py-0.5 rounded text-white font-semibold shadow-sm">{course.category}</span>
            </div>
        </div>
        
        <div className="p-6 flex flex-col flex-1">
            <h3 className="font-sans text-xl font-bold text-gray-900 mb-2 leading-snug group-hover:text-primary-600 transition-colors tracking-tight">
                {course.title}
            </h3>
            <p className="text-sm text-gray-600 mb-6 line-clamp-2 leading-relaxed flex-1">
                {course.description}
            </p>
            
            {/* Meta Data */}
            <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 mb-5 border-b border-gray-100 pb-5">
            <div className="flex items-center gap-1.5 text-gray-700">
                <Star className="h-3.5 w-3.5 text-yellow-500 fill-current" />
                <span>{course.rating}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>{course.totalStudents.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                <span>{course.sections.length} Modules</span>
            </div>
            </div>
            
            <div className="flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-0.5">Instructor</span>
                <span className="text-xs font-bold text-gray-800">{course.instructorName}</span>
            </div>
            <div className="text-right">
                <span className="block text-lg font-bold text-primary-700">
                    {course.price === 0 ? 'Free' : `R${course.price}`}
                </span>
            </div>
            </div>
        </div>
        </div>
    </Link>
  );
};