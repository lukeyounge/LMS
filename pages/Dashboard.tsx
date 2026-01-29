import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { useCourse } from '../context/CourseContext';
import { Award, PlayCircle, BarChart } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { courses, enrollments, isLoading } = useCourse();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Filter courses based on enrollment
  const enrolledCoursesList = enrollments.map(enrollment => {
    const course = courses.find(c => c.id === enrollment.courseId);
    if (!course) return null;
    return {
      ...course,
      progress: enrollment.progress,
      completedLessonsCount: enrollment.completedLessonIds.length,
      lastLessonId: enrollment.lastAccessedLessonId
    };
  }).filter((c): c is NonNullable<typeof c> => c !== null);

  const completedCount = enrolledCoursesList.filter(c => c.progress === 100).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-full text-blue-600">
             <PlayCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-gray-500 text-sm font-medium mb-1">Courses in Progress</div>
            <div className="text-3xl font-bold text-gray-900">{enrolledCoursesList.length - completedCount}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-full text-green-600">
             <Award className="h-6 w-6" />
          </div>
          <div>
             <div className="text-gray-500 text-sm font-medium mb-1">Completed Courses</div>
             <div className="text-3xl font-bold text-gray-900">{completedCount}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-purple-50 p-3 rounded-full text-purple-600">
             <BarChart className="h-6 w-6" />
          </div>
          <div>
             <div className="text-gray-500 text-sm font-medium mb-1">Certificates Earned</div>
             <div className="text-3xl font-bold text-gray-900">{completedCount}</div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-6">Continue Learning</h2>
      
      <div className="space-y-6">
        {enrolledCoursesList.length > 0 ? (
          enrolledCoursesList.map(item => {
            // Calculate total lessons dynamically
            const totalLessons = item.sections.reduce((acc, s) => acc + s.lessons.length, 0);
            
            // Determine link target
            let linkTarget = `/learn/${item.id}/lesson/${item.sections[0]?.lessons[0]?.id}`;
            if (item.lastLessonId) {
              linkTarget = `/learn/${item.id}/lesson/${item.lastLessonId}`;
            }

            const isCompleted = item.progress === 100;

            return (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
                <div className="md:w-64 h-48 md:h-auto relative bg-gray-200 group">
                  <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  {isCompleted && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Award className="h-12 w-12 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{item.instructorName}</p>
                    
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                      <div className="bg-primary-600 h-2 rounded-full transition-all duration-500" style={{ width: `${item.progress}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-500 flex justify-between">
                      <span>{item.progress}% Complete</span>
                      <span>{item.completedLessonsCount}/{totalLessons} Lessons</span>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    {isCompleted && (
                      <Link to={`/certificate/${item.id}`}>
                        <Button variant="outline" className="gap-2">
                          <Award className="h-4 w-4" /> View Certificate
                        </Button>
                      </Link>
                    )}
                    <Link to={linkTarget}>
                      <Button>
                        {item.progress === 0 ? 'Start Course' : isCompleted ? 'Review Course' : 'Continue Learning'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
            <Link to="/">
              <Button>Browse Courses</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};