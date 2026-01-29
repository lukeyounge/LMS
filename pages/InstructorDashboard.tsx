import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, DollarSign, BookOpen, Edit, Sparkles, Trash2, X, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { useCourse } from '../context/CourseContext';
import { useAuth } from '../context/AuthContext';
import { Course, Lesson, Section, LessonType } from '../types';
import { generateCourseCurriculum } from '../services/geminiService';

export const InstructorDashboard: React.FC = () => {
  const { courses, addCourse, deleteCourse } = useCourse();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Generator State
  const [showGenerator, setShowGenerator] = useState(false);
  const [genTopic, setGenTopic] = useState('');
  const [genLevel, setGenLevel] = useState('Beginner');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  if (!user) return null;

  // Filter courses owned by the current user
  const myCourses = courses.filter(c => c.instructorId === user.id);

  // Calculate simple stats
  const totalStudents = myCourses.reduce((acc, c) => acc + c.totalStudents, 0);
  const totalRevenue = myCourses.reduce((acc, c) => acc + (c.totalStudents * c.price), 0);

  const handleCreateEmptyCourse = async () => {
    setIsCreating(true);
    try {
      const newCourse: Course = {
        id: '',  // Supabase will generate the ID
        instructorId: user.id,
        title: 'Untitled Course',
        description: 'Add a description...',
        thumbnailUrl: 'https://picsum.photos/800/600?grayscale',
        instructorName: user.name,
        price: 0,
        category: 'Uncategorized',
        level: 'Beginner',
        sections: [],
        totalStudents: 0,
        rating: 0
      };

      const createdCourse = await addCourse(newCourse);
      if (createdCourse) {
        navigate(`/instructor/edit/${createdCourse.id}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTopic.trim()) return;

    setIsGenerating(true);
    try {
      const generatedData = await generateCourseCurriculum(genTopic, genLevel);
      
      const newCourseId = `c${Date.now()}`;
      
      // Process sections to ensure they have IDs
      const sections = (generatedData.sections || []).map((sec: any, idx: number) => ({
        id: `s${Date.now()}-${idx}`,
        courseId: newCourseId,
        title: sec.title || `Section ${idx + 1}`,
        order: idx + 1,
        lessons: (sec.lessons || []).map((les: any, lIdx: number) => ({
          id: `l${Date.now()}-${idx}-${lIdx}`,
          sectionId: `s${Date.now()}-${idx}`,
          title: les.title || `Lesson ${lIdx + 1}`,
          type: (['VIDEO', 'TEXT', 'QUIZ'].includes(les.type) ? les.type : 'TEXT') as LessonType,
          duration: 10,
          content: les.content || 'Content pending...',
          isCompleted: false,
          isLocked: false
        }))
      }));

      const newCourse: Course = {
        id: newCourseId,
        instructorId: user.id,
        title: generatedData.title || genTopic,
        description: generatedData.description || `A course about ${genTopic}`,
        thumbnailUrl: `https://picsum.photos/seed/${newCourseId}/800/600`,
        instructorName: user.name,
        price: 0, // Default to free, let user set price
        category: generatedData.category || 'Development',
        level: (['Beginner', 'Intermediate', 'Advanced'].includes(genLevel) ? genLevel : 'Beginner') as any,
        sections: sections,
        totalStudents: 0,
        rating: 0
      };

      const createdCourse = await addCourse(newCourse);
      if (createdCourse) {
        navigate(`/instructor/edit/${createdCourse.id}`);
      }
    } catch (error) {
      console.error("Generation failed", error);
      alert("Failed to generate course. Please try again.");
    } finally {
      setIsGenerating(false);
      setShowGenerator(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      deleteCourse(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instructor Studio</h1>
          <p className="text-gray-500 mt-1">Manage your courses and view performance.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleCreateEmptyCourse} variant="outline" className="gap-2" isLoading={isCreating} disabled={isCreating}>
            {!isCreating && <Plus className="h-4 w-4" />} {isCreating ? 'Creating...' : 'Empty Course'}
          </Button>
          <Button onClick={() => setShowGenerator(true)} className="gap-2 bg-gradient-to-r from-primary-600 to-primary-500 border-none shadow-lg hover:shadow-primary-500/30">
            <Sparkles className="h-4 w-4" /> Generate with AI
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-full text-blue-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm text-gray-500 font-medium">Active Courses</div>
            <div className="text-2xl font-bold text-gray-900">{myCourses.length}</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-full text-green-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm text-gray-500 font-medium">Total Students</div>
            <div className="text-2xl font-bold text-gray-900">{totalStudents.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-purple-50 p-3 rounded-full text-purple-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm text-gray-500 font-medium">Total Revenue</div>
            <div className="text-2xl font-bold text-gray-900">R{totalRevenue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-6">Your Courses</h2>
      
      {myCourses.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Students</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myCourses.map(course => (
                <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img src={course.thumbnailUrl} alt="" className="h-10 w-16 object-cover rounded bg-gray-200" />
                      <div>
                        <div className="font-medium text-gray-900">{course.title}</div>
                        <div className="text-xs text-gray-500">{course.sections.length} Sections</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {course.price === 0 ? 'Free' : `R${course.price}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {course.totalStudents.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span> {course.rating}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/instructor/edit/${course.id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Edit className="h-3 w-3" /> Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(course.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">You haven't created any courses yet.</p>
          <div className="flex justify-center gap-4">
             <Button onClick={handleCreateEmptyCourse} variant="outline" isLoading={isCreating} disabled={isCreating}>
               {isCreating ? 'Creating...' : 'Create Empty Course'}
             </Button>
             <Button onClick={() => setShowGenerator(true)} className="gap-2">
               <Sparkles className="h-4 w-4" /> Generate with AI
             </Button>
          </div>
        </div>
      )}

      {/* AI Generator Modal */}
      {showGenerator && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-primary-600">
                <Sparkles className="h-5 w-5" />
                <h3 className="font-bold text-lg">AI Course Generator</h3>
              </div>
              <button onClick={() => setShowGenerator(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">What would you like to teach?</label>
                <input 
                  type="text" 
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="e.g. Advanced Pottery, Intro to Astrophysics..."
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none placeholder-gray-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience Level</label>
                <select 
                  value={genLevel}
                  onChange={(e) => setGenLevel(e.target.value)}
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg gap-2" 
                  disabled={isGenerating || !genTopic}
                  isLoading={isGenerating}
                >
                  {isGenerating ? 'Generating Curriculum...' : 'Generate Course'}
                  {!isGenerating && <Sparkles className="h-4 w-4" />}
                </Button>
                <p className="text-xs text-center text-gray-500 mt-3">
                  AI will generate a title, description, and full lesson plan.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};