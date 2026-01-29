import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourse } from '../context/CourseContext';
import { Button } from '../components/Button';
import { ArrowLeft, Plus, Save, Trash2, GripVertical, CheckCircle, XCircle, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Course, Lesson, LessonType, Section } from '../types';
import { generateLessonContent, generateQuizQuestions, generateCourseImage } from '../services/geminiService';

// Helper interface for the UI state of a quiz
interface QuizState {
  passingScore: number;
  questions: {
    id: number;
    question: string;
    options: string[];
    correctAnswerIndex: number;
  }[];
}

export const CourseEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { courses, updateCourse } = useCourse();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'curriculum'>('details');
  const [isSaving, setIsSaving] = useState(false);
  const [generatingLessonId, setGeneratingLessonId] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Load course data
  useEffect(() => {
    const found = courses.find(c => c.id === id);
    if (found) {
      // Deep copy to avoid direct mutation before save
      setCourse(JSON.parse(JSON.stringify(found)));
    }
  }, [id, courses]);

  if (!course) return <div className="p-10 text-center">Loading...</div>;

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API delay
    setTimeout(() => {
      updateCourse(course);
      setIsSaving(false);
    }, 600);
  };

  const handleGenerateImage = async () => {
    if (!course.title) return;
    setIsGeneratingImage(true);
    try {
      const imageData = await generateCourseImage(course.title);
      if (imageData) {
        setCourse({ ...course, thumbnailUrl: imageData });
      }
    } catch (e) {
      alert("Failed to generate image.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // --- Curriculum Handlers ---

  const addSection = () => {
    const newSection: Section = {
      id: `s${Date.now()}`,
      courseId: course.id,
      title: 'New Section',
      order: course.sections.length + 1,
      lessons: []
    };
    setCourse({ ...course, sections: [...course.sections, newSection] });
  };

  const deleteSection = (sectionIndex: number) => {
    const newSections = [...course.sections];
    newSections.splice(sectionIndex, 1);
    setCourse({ ...course, sections: newSections });
  };

  const updateSectionTitle = (index: number, title: string) => {
    const newSections = [...course.sections];
    newSections[index].title = title;
    setCourse({ ...course, sections: newSections });
  };

  const addLesson = (sectionIndex: number) => {
    const section = course.sections[sectionIndex];
    const newLesson: Lesson = {
      id: `l${Date.now()}`,
      sectionId: section.id,
      title: 'New Lesson',
      type: LessonType.TEXT,
      duration: 5,
      content: '',
      isCompleted: false,
      isLocked: false
    };
    
    const newSections = [...course.sections];
    newSections[sectionIndex].lessons.push(newLesson);
    setCourse({ ...course, sections: newSections });
  };

  const updateLesson = (sectionIndex: number, lessonIndex: number, field: keyof Lesson, value: any) => {
    const newSections = [...course.sections];
    // Create deep copy of the lesson we are modifying to ensure immutability
    const updatedLesson = { ...newSections[sectionIndex].lessons[lessonIndex], [field]: value };
    newSections[sectionIndex].lessons[lessonIndex] = updatedLesson;
    setCourse({ ...course, sections: newSections });
  };

  const deleteLesson = (sectionIndex: number, lessonIndex: number) => {
    const newSections = [...course.sections];
    newSections[sectionIndex].lessons.splice(lessonIndex, 1);
    setCourse({ ...course, sections: newSections });
  };

  // --- AI Handlers ---

  const handleGenerateText = async (sIdx: number, lIdx: number) => {
    const lesson = course.sections[sIdx].lessons[lIdx];
    if (!lesson.title) {
        alert("Please enter a lesson title first.");
        return;
    }
    
    setGeneratingLessonId(lesson.id);
    try {
        const content = await generateLessonContent(lesson.title, course.title);
        if (content) {
            updateLesson(sIdx, lIdx, 'content', content);
        }
    } catch (e) {
        alert("Failed to generate content. Please check your API key.");
    } finally {
        setGeneratingLessonId(null);
    }
  };

  const handleGenerateQuiz = async (sIdx: number, lIdx: number, currentQuizState: QuizState) => {
    const lesson = course.sections[sIdx].lessons[lIdx];
    if (!lesson.title) {
        alert("Please enter a lesson title first to generate relevant questions.");
        return;
    }

    setGeneratingLessonId(lesson.id);
    try {
        const result = await generateQuizQuestions(lesson.title, course.level);
        if (result && result.questions) {
             const updatedQuizState = {
                 ...currentQuizState,
                 questions: [...currentQuizState.questions, ...result.questions]
             };
             updateLesson(sIdx, lIdx, 'content', JSON.stringify(updatedQuizState));
        }
    } catch (e) {
        alert("Failed to generate quiz questions.");
    } finally {
        setGeneratingLessonId(null);
    }
  };

  // --- Quiz Builder Logic ---

  const renderQuizBuilder = (sIdx: number, lIdx: number, currentContent: string) => {
    const lessonId = course.sections[sIdx].lessons[lIdx].id;
    let quizState: QuizState;
    try {
      quizState = JSON.parse(currentContent);
      // Basic validation to ensure structure matches
      if (!Array.isArray(quizState.questions)) throw new Error();
    } catch {
      quizState = { passingScore: 80, questions: [] };
    }

    const updateQuizState = (newState: QuizState) => {
      updateLesson(sIdx, lIdx, 'content', JSON.stringify(newState));
    };

    const addQuestion = () => {
      const newQuestion = {
        id: Date.now(),
        question: 'New Question',
        options: ['Option 1', 'Option 2'],
        correctAnswerIndex: 0
      };
      updateQuizState({
        ...quizState,
        questions: [...quizState.questions, newQuestion]
      });
    };

    const removeQuestion = (qIdx: number) => {
      const newQuestions = [...quizState.questions];
      newQuestions.splice(qIdx, 1);
      updateQuizState({ ...quizState, questions: newQuestions });
    };

    const updateQuestionText = (qIdx: number, text: string) => {
      const newQuestions = [...quizState.questions];
      newQuestions[qIdx].question = text;
      updateQuizState({ ...quizState, questions: newQuestions });
    };

    const addOption = (qIdx: number) => {
      const newQuestions = [...quizState.questions];
      newQuestions[qIdx].options.push(`Option ${newQuestions[qIdx].options.length + 1}`);
      updateQuizState({ ...quizState, questions: newQuestions });
    };

    const updateOptionText = (qIdx: number, oIdx: number, text: string) => {
      const newQuestions = [...quizState.questions];
      newQuestions[qIdx].options[oIdx] = text;
      updateQuizState({ ...quizState, questions: newQuestions });
    };

    const setCorrectOption = (qIdx: number, oIdx: number) => {
      const newQuestions = [...quizState.questions];
      newQuestions[qIdx].correctAnswerIndex = oIdx;
      updateQuizState({ ...quizState, questions: newQuestions });
    };

    const removeOption = (qIdx: number, oIdx: number) => {
        const newQuestions = [...quizState.questions];
        newQuestions[qIdx].options.splice(oIdx, 1);
        if (newQuestions[qIdx].correctAnswerIndex >= oIdx && newQuestions[qIdx].correctAnswerIndex > 0) {
            newQuestions[qIdx].correctAnswerIndex--;
        }
        updateQuizState({ ...quizState, questions: newQuestions });
    };

    return (
      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <label className="text-sm font-semibold text-blue-900">Passing Score (%)</label>
                <input 
                    type="number" 
                    min="0" 
                    max="100"
                    value={quizState.passingScore}
                    onChange={(e) => updateQuizState({ ...quizState, passingScore: parseInt(e.target.value) || 0 })}
                    className="w-20 px-2 py-1 rounded border border-blue-200 text-sm bg-white text-gray-900"
                />
            </div>
            <Button 
                size="sm" 
                variant="outline"
                className="text-primary-600 border-primary-200 hover:bg-primary-50 gap-2"
                onClick={() => handleGenerateQuiz(sIdx, lIdx, quizState)}
                isLoading={generatingLessonId === lessonId}
            >
                <Sparkles className="h-4 w-4" /> AI Generate Questions
            </Button>
        </div>

        <div className="space-y-4">
          {quizState.questions.map((q, qIdx) => (
            <div key={q.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 mr-4">
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Question {qIdx + 1}</label>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                    placeholder="Enter question text..."
                  />
                </div>
                <button onClick={() => removeQuestion(qIdx)} className="text-gray-400 hover:text-red-500 p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <input 
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={q.correctAnswerIndex === oIdx}
                      onChange={() => setCorrectOption(qIdx, oIdx)}
                      className="text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOptionText(qIdx, oIdx, e.target.value)}
                      className={`flex-1 border rounded px-2 py-1 text-sm outline-none bg-white text-gray-900 ${q.correctAnswerIndex === oIdx ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}
                    />
                    {q.options.length > 2 && (
                        <button onClick={() => removeOption(qIdx, oIdx)} className="text-gray-400 hover:text-red-500">
                            <XCircle className="h-4 w-4" />
                        </button>
                    )}
                  </div>
                ))}
                <button onClick={() => addOption(qIdx)} className="text-xs text-primary-600 font-medium hover:underline mt-2 flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Add Option
                </button>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={addQuestion} variant="outline" size="sm" className="mt-4 w-full border-dashed">
          <Plus className="h-4 w-4 mr-2" /> Add Manual Question
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/instructor')} className="text-gray-500">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-6 w-px bg-gray-300"></div>
          <h1 className="font-bold text-lg text-gray-800 truncate max-w-xs md:max-w-md">
            Editing: {course.title}
          </h1>
        </div>
        <Button onClick={handleSave} isLoading={isSaving} className="gap-2">
          <Save className="h-4 w-4" /> Save Changes
        </Button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Course Details
          </button>
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'curriculum' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Curriculum
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
        
        {/* DETAILS TAB */}
        {activeTab === 'details' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
              <input
                type="text"
                value={course.title}
                onChange={e => setCourse({ ...course, title: e.target.value })}
                className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={4}
                value={course.description}
                onChange={e => setCourse({ ...course, description: e.target.value })}
                className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={course.category}
                  onChange={e => setCourse({ ...course, category: e.target.value })}
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="Development">Development</option>
                  <option value="Business">Business</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Uncategorized">Uncategorized</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <select
                  value={course.level}
                  onChange={e => setCourse({ ...course, level: e.target.value as any })}
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (R)</label>
                <input
                  type="number"
                  min="0"
                  value={course.price}
                  onChange={e => setCourse({ ...course, price: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={course.thumbnailUrl}
                    onChange={e => setCourse({ ...course, thumbnailUrl: e.target.value })}
                    className="flex-1 bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleGenerateImage}
                    isLoading={isGeneratingImage}
                    className="flex-shrink-0 gap-2"
                  >
                    <ImageIcon className="h-4 w-4" /> AI Generate
                  </Button>
                </div>
                {course.thumbnailUrl && (
                  <div className="mt-2 h-32 w-48 rounded overflow-hidden bg-gray-100 border border-gray-200">
                    <img src={course.thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CURRICULUM TAB */}
        {activeTab === 'curriculum' && (
          <div className="space-y-6">
            {course.sections.map((section, sIdx) => (
              <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Section Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                  <div className="flex-1">
                    <input 
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                      className="bg-transparent font-bold text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500 rounded px-2 py-1 w-full"
                    />
                  </div>
                  <button onClick={() => deleteSection(sIdx)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                {/* Lessons List */}
                <div className="p-4 space-y-4 bg-white">
                  {section.lessons.map((lesson, lIdx) => (
                    <div key={lesson.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:border-primary-200 transition-colors">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="text-xs font-bold text-gray-400">Lesson {lIdx + 1}</div>
                           <button onClick={() => deleteLesson(sIdx, lIdx)} className="ml-auto text-gray-400 hover:text-red-500">
                             <Trash2 className="h-4 w-4" />
                           </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <label className="text-xs text-gray-500 block mb-1">Title</label>
                            <input
                              type="text"
                              value={lesson.title}
                              onChange={(e) => updateLesson(sIdx, lIdx, 'title', e.target.value)}
                              className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Type</label>
                            <select
                              value={lesson.type}
                              onChange={(e) => {
                                // Reset content to reasonable defaults when switching types
                                let defaultContent = '';
                                if (e.target.value === 'QUIZ') defaultContent = JSON.stringify({passingScore: 80, questions: []});
                                else if (e.target.value === 'TEXT') defaultContent = '';
                                else defaultContent = 'https://www.youtube.com/embed/...';
                                
                                const newSections = [...course.sections];
                                newSections[sIdx].lessons[lIdx] = {
                                    ...newSections[sIdx].lessons[lIdx],
                                    type: e.target.value as LessonType,
                                    content: defaultContent
                                };
                                setCourse({ ...course, sections: newSections });
                              }}
                              className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                            >
                              <option value="VIDEO">Video</option>
                              <option value="TEXT">Text</option>
                              <option value="QUIZ">Quiz</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          {lesson.type === 'QUIZ' ? (
                            renderQuizBuilder(sIdx, lIdx, lesson.content)
                          ) : (
                            <>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-xs text-gray-500 block">
                                  {lesson.type === 'VIDEO' ? 'Video URL / Embed Link' : 'Content (Markdown)'}
                                </label>
                                {lesson.type === 'TEXT' && (
                                    <button 
                                        onClick={() => handleGenerateText(sIdx, lIdx)}
                                        disabled={generatingLessonId === lesson.id}
                                        className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
                                    >
                                        {generatingLessonId === lesson.id ? (
                                            <span className="animate-pulse">Writing...</span>
                                        ) : (
                                            <>
                                                <Sparkles className="h-3 w-3" /> Write with AI
                                            </>
                                        )}
                                    </button>
                                )}
                              </div>
                              <textarea
                                rows={lesson.type === 'TEXT' ? 5 : 1}
                                value={lesson.content}
                                onChange={(e) => updateLesson(sIdx, lIdx, 'content', e.target.value)}
                                className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary-500 outline-none font-mono text-xs"
                                placeholder={lesson.type === 'VIDEO' ? 'https://...' : 'Enter content or use AI to generate...'}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" size="sm" onClick={() => addLesson(sIdx)} className="w-full border-dashed border-2">
                    <Plus className="h-4 w-4 mr-2" /> Add Lesson
                  </Button>
                </div>
              </div>
            ))}

            <Button onClick={addSection} size="lg" className="w-full py-4 bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-dashed border-gray-300 shadow-none">
              <Plus className="h-5 w-5 mr-2" /> Add Section
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};