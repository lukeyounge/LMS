import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useCourse } from '../context/CourseContext';
import { CheckCircle, PlayCircle, Award, Lock, Star, Globe, ShieldCheck, Infinity as InfinityIcon, FileText } from 'lucide-react';

export const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { courses, enrollInCourse, getEnrollment, isLessonCompleted } = useCourse();
  
  const course = courses.find(c => c.id === id);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!course) {
    return <div className="p-20 text-center font-serif text-2xl text-gray-400">Course not found</div>;
  }

  const enrollment = getEnrollment(course.id);
  const isEnrolled = !!enrollment;

  const handleAction = () => {
    if (isEnrolled) {
      const targetLessonId = enrollment.lastAccessedLessonId || course.sections[0]?.lessons[0]?.id;
      if (targetLessonId) {
        navigate(`/learn/${course.id}/lesson/${targetLessonId}`);
      }
    } else {
      enrollInCourse(course.id);
      if (course.sections.length > 0 && course.sections[0].lessons.length > 0) {
        navigate(`/learn/${course.id}/lesson/${course.sections[0].lessons[0].id}`);
      }
    }
  };

  const totalLessons = course.sections.reduce((acc, sec) => acc + sec.lessons.length, 0);

  return (
    <div className="bg-white min-h-screen">
      {/* Dark Header Section */}
      <div className="bg-primary-900 text-white pt-20 pb-32 relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-primary-800 rounded-full opacity-20 blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl">
                <div className="flex gap-3 mb-6">
                    <span className="bg-primary-800 text-primary-200 border border-primary-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest">
                        {course.category}
                    </span>
                    <span className="bg-white/10 text-white border border-white/10 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest">
                        {course.level}
                    </span>
                </div>
                {/* Keep Serif for Main Title as requested by aesthetic choice */}
                <h1 className="font-serif text-4xl md:text-6xl font-bold mb-6 leading-tight">{course.title}</h1>
                <p className="text-xl text-primary-100 mb-8 leading-relaxed font-light">
                    {course.description}
                </p>
                <div className="flex items-center gap-8 text-sm text-primary-200">
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-400 font-bold text-lg">{course.rating}</span>
                        <div className="flex text-yellow-400 text-xs gap-0.5">
                            <Star className="h-4 w-4 fill-current" />
                            <Star className="h-4 w-4 fill-current" />
                            <Star className="h-4 w-4 fill-current" />
                            <Star className="h-4 w-4 fill-current" />
                            <Star className="h-4 w-4 fill-current" />
                        </div>
                        <span className="ml-1 opacity-75">({course.totalStudents.toLocaleString()} ratings)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>English</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <span className="opacity-75">Created by</span>
                         <span className="text-white font-semibold underline decoration-primary-500 decoration-2 underline-offset-4">{course.instructorName}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* What you'll learn */}
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
              <h2 className="font-sans text-2xl font-bold text-gray-900 mb-6 tracking-tight">What you'll learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1,2,3,4].map((_, i) => (
                      <div key={i} className="flex gap-3 items-start">
                          <CheckCircle className="h-5 w-5 text-gray-900 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600 text-sm leading-relaxed font-medium">Master the fundamental concepts and apply them to real-world projects immediately.</span>
                      </div>
                  ))}
              </div>
            </div>

            {/* Curriculum */}
            <div>
              <div className="flex items-center justify-between mb-6">
                 <h2 className="font-sans text-2xl font-bold text-gray-900 tracking-tight">Course Content</h2>
                 <div className="text-sm font-semibold text-gray-500">
                    {course.sections.length} Sections • {totalLessons} Lessons
                 </div>
              </div>
              
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                {course.sections.map((section, idx) => (
                  <div key={section.id} className="border-b border-gray-100 last:border-0">
                    <div className="bg-gray-50 px-6 py-4 flex justify-between items-center cursor-default">
                      <span className="font-bold text-gray-900 text-sm flex items-center gap-3">
                        <span className="text-gray-400 font-medium">Section {idx + 1}</span>
                        {section.title}
                      </span>
                      <span className="text-xs text-gray-500 font-semibold">{section.lessons.length} lessons</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {section.lessons.map(lesson => {
                        const isCompleted = isLessonCompleted(course.id, lesson.id);
                        return (
                          <div key={lesson.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors group">
                            {lesson.type === 'VIDEO' ? <PlayCircle className="h-4 w-4 text-gray-400 group-hover:text-primary-600" /> : <FileText className="h-4 w-4 text-gray-400 group-hover:text-primary-600" />}
                            <span className="text-sm text-gray-600 font-medium flex-1 group-hover:text-gray-900">{lesson.title}</span>
                            
                            <div className="flex items-center gap-4">
                                {isCompleted ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                    lesson.isLocked && !isEnrolled && <Lock className="h-3 w-3 text-gray-300" />
                                )}
                                <span className="text-xs text-gray-400 w-12 text-right font-medium">{lesson.duration}m</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Description */}
            <div className="prose prose-lg prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tight prose-blue text-gray-600 max-w-none">
                <h2 className="text-gray-900">Description</h2>
                <p>{course.description}</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim. Phasellus molestie magna non est bibendum non venenatis nisl tempor. Suspendisse dictum feugiat nisl ut dapibus.</p>
                <h3>Who this course is for:</h3>
                <ul>
                    <li>Beginners who want to start their journey</li>
                    <li>Intermediate learners looking to brush up skills</li>
                </ul>
            </div>
          </div>

          {/* Sidebar Column (Sticky) */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-24 space-y-6">
                {/* Enrollment Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    <div className="relative aspect-video">
                        <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors hover:bg-black/20 cursor-pointer">
                             <div className="w-16 h-16 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg">
                                 <PlayCircle className="h-8 w-8 text-primary-600 ml-1" />
                             </div>
                        </div>
                    </div>
                    
                    <div className="p-8">
                        <div className="flex items-end gap-3 mb-8">
                            <span className="text-4xl font-bold text-gray-900 tracking-tight font-sans">
                            {course.price === 0 ? 'Free' : `R${course.price}`}
                            </span>
                            {course.price > 0 && <span className="text-lg text-gray-400 line-through mb-1 font-medium">R{Math.round(course.price * 1.2)}</span>}
                        </div>

                        <Button onClick={handleAction} size="lg" className="w-full py-4 text-base shadow-lg shadow-primary-600/30 mb-4 h-14 font-bold">
                            {isEnrolled ? 'Go to Dashboard' : 'Enroll Now'}
                        </Button>
                        
                        {!isEnrolled && (
                            <p className="text-center text-xs text-gray-500 mb-6 font-semibold">30-Day Money-Back Guarantee</p>
                        )}
                        
                        <div className="space-y-4 pt-6 border-t border-gray-100">
                            <h3 className="font-bold text-gray-900 text-sm">This course includes:</h3>
                            <ul className="space-y-3 text-sm text-gray-600 font-medium">
                            <li className="flex items-center gap-3">
                                <PlayCircle className="h-4 w-4 text-gray-900" />
                                <span>{totalLessons * 15 / 60} hours on-demand video</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <FileText className="h-4 w-4 text-gray-900" />
                                <span>{totalLessons} downloadable resources</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <InfinityIcon className="h-4 w-4 text-gray-900" />
                                <span>Full lifetime access</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Award className="h-4 w-4 text-gray-900" />
                                <span>Certificate of completion</span>
                            </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Trust Badge */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex items-center justify-center gap-4 text-gray-500 text-sm font-semibold">
                    <ShieldCheck className="h-5 w-5 text-gray-400" />
                    Secure Payment via Stripe
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};