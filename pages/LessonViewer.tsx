import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Lesson, LessonType, isPageBasedContent, Page, LessonContent, EmbedStatus, EmbedSubmissionType } from '../types';
import { isSlideBasedContent, SlideBasedContent, themes } from '../components/course-builder/slides/slideTypes';
import { SlideCanvas, EmbedEventHandlers } from '../components/course-builder/slides/SlideCanvas';
import { ChevronLeft, ChevronRight, CheckCircle, Menu, X, PlayCircle, FileText, Sparkles, HelpCircle, Volume2, StopCircle, ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '../components/Button';
import { GeminiTutor } from '../components/GeminiTutor';
import { QuizViewer } from '../components/QuizViewer';
import { useCourse } from '../context/CourseContext';
import { generateLessonAudio } from '../services/geminiService';
import { courseService } from '../services/courseService';

export const LessonViewer: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const { courses, completeLesson, isLessonCompleted } = useCourse();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  
  // Audio State
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const course = courses.find(c => c.id === courseId);

  useEffect(() => {
    // Stop audio if lesson changes
    stopAudio();
    
    if (course && lessonId) {
      let foundLesson = null;
      course.sections.forEach(sec => {
        const l = sec.lessons.find(l => l.id === lessonId);
        if (l) foundLesson = l;
      });
      setCurrentLesson(foundLesson);
    }
  }, [courseId, lessonId, course]);

  useEffect(() => {
    return () => {
        stopAudio();
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    };
  }, []);

  const stopAudio = () => {
    if (audioSourceRef.current) {
        try {
            audioSourceRef.current.stop();
        } catch (e) { }
        audioSourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const handlePlayAudio = async () => {
    if (isPlaying) {
        stopAudio();
        return;
    }

    if (!currentLesson || currentLesson.type !== LessonType.TEXT) return;

    setIsAudioLoading(true);
    try {
        const audioBufferData = await generateLessonAudio(currentLesson.content);
        if (audioBufferData) {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const buffer = await audioContextRef.current.decodeAudioData(audioBufferData);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);
            source.onended = () => setIsPlaying(false);
            source.start(0);
            audioSourceRef.current = source;
            setIsPlaying(true);
        } else {
            alert("Could not generate audio for this lesson.");
        }
    } catch (e) {
        console.error("Playback error", e);
        alert("Error playing audio.");
    } finally {
        setIsAudioLoading(false);
    }
  };

  if (!course || !currentLesson) {
    return <div className="p-10 text-center text-white bg-gray-900 h-screen">Lesson not found</div>;
  }

  // Find next/prev lessons for navigation
  const allLessons = course.sections.flatMap(s => s.lessons);
  const currentIndex = allLessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const isCompleted = isLessonCompleted(course.id, currentLesson.id);

  const handleNext = () => {
    if (courseId && lessonId && currentLesson.type !== LessonType.QUIZ) {
      completeLesson(courseId, lessonId);
    }
  };

  const handleQuizPass = () => {
    if (courseId && lessonId) {
      completeLesson(courseId, lessonId);
    }
  };

  const getAiContext = () => {
    let contentSummary = '';
    if (currentLesson.type === LessonType.VIDEO) {
        contentSummary = `Video Lesson: ${currentLesson.title}. URL: ${currentLesson.content}`;
    } else if (currentLesson.type === LessonType.QUIZ) {
        contentSummary = `QUIZ MODE. Data: ${currentLesson.content}`;
    } else {
        contentSummary = currentLesson.content;
    }
    return `Course: ${course.title}. Lesson: ${currentLesson.title}. Type: ${currentLesson.type}. Content: ${contentSummary}`;
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Dark Sidebar Navigation */}
      <div 
        className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } bg-gray-900 border-r border-gray-800 flex-shrink-0 transition-all duration-300 flex flex-col relative z-20 text-gray-300`}
      >
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gray-900">
          <div>
            <Link to="/dashboard" className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-white mb-1 flex items-center gap-1 transition-colors">
                <ArrowLeft className="h-3 w-3" /> Dashboard
            </Link>
            <h2 className="font-bold text-white text-base leading-tight pr-2">{course.title}</h2>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {course.sections.map(section => (
            <div key={section.id}>
              <div className="px-5 py-4 bg-gray-900/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-y border-gray-800/50 sticky top-0 backdrop-blur-sm z-10">
                {section.title}
              </div>
              <div>
                {section.lessons.map(lesson => {
                   const completed = isLessonCompleted(course.id, lesson.id);
                   let Icon = FileText;
                   if (lesson.type === LessonType.VIDEO) Icon = PlayCircle;
                   if (lesson.type === LessonType.QUIZ) Icon = HelpCircle;

                   const active = lesson.id === lessonId;

                   return (
                    <Link 
                      key={lesson.id}
                      to={`/learn/${courseId}/lesson/${lesson.id}`}
                      className={`flex items-center gap-3 px-5 py-3 text-sm border-l-[3px] transition-all ${
                        active 
                          ? 'border-primary-500 bg-gray-800 text-white' 
                          : 'border-transparent hover:bg-gray-800/50 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {completed ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Icon className={`h-4 w-4 ${active ? 'text-primary-400' : 'text-gray-600'}`} />
                        )}
                      </div>
                      <span className="line-clamp-2">{lesson.title}</span>
                    </Link>
                   );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar in Sidebar */}
        <div className="p-5 border-t border-gray-800 bg-gray-900">
            <div className="text-xs text-gray-400 mb-2 flex justify-between">
                <span>Course Progress</span>
                <span className="text-white">35%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div className="bg-green-500 h-1.5 rounded-full w-[35%]"></div>
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative bg-white">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-100 h-16 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <Menu className="h-6 w-6" />
              </button>
            )}
            <h1 className="text-lg font-bold text-gray-800 line-clamp-1">{currentLesson.title}</h1>
          </div>
          
          <div className="flex items-center gap-3">
             {currentLesson.type === LessonType.TEXT && (
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePlayAudio}
                    isLoading={isAudioLoading}
                    className={`gap-2 rounded-full border-gray-200 ${isPlaying ? 'bg-primary-50 text-primary-600 border-primary-200' : ''}`}
                >
                    {isPlaying ? <StopCircle className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    {isPlaying ? 'Stop' : 'Listen'}
                </Button>
             )}
             <Button 
                variant="primary" 
                size="sm" 
                onClick={() => setAiChatOpen(true)} 
                className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 border-none shadow-md hover:shadow-indigo-500/20"
             >
                <Sparkles className="h-3.5 w-3.5" /> AI Tutor
             </Button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 md:p-12">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-card border border-gray-100 p-8 md:p-12 min-h-[60vh]">

            {/* Render Content Based on Type */}
            {isSlideBasedContent(currentLesson.content) ? (
              // New slide-based content format (v2)
              <SlideBasedViewer
                content={currentLesson.content}
                onComplete={() => {
                  if (courseId && lessonId) {
                    completeLesson(courseId, lessonId);
                  }
                }}
                courseId={courseId || ''}
                lessonId={lessonId || ''}
              />
            ) : isPageBasedContent(currentLesson.content) ? (
              // New page-based content format
              <div className="space-y-6">
                {(currentLesson.content as LessonContent).pages
                  .sort((a, b) => a.order - b.order)
                  .map(page => (
                    <PageRenderer key={page.id} page={page} onQuizPass={handleQuizPass} />
                  ))}
              </div>
            ) : currentLesson.type === LessonType.VIDEO ? (
              <div className="aspect-video bg-black rounded-xl shadow-2xl overflow-hidden mb-8 ring-4 ring-gray-100">
                <iframe
                  src={currentLesson.content as string}
                  title={currentLesson.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : currentLesson.type === LessonType.QUIZ ? (
              <div className="mb-8">
                <QuizViewer content={currentLesson.content as string} onPass={handleQuizPass} />
              </div>
            ) : (
              <div className="prose prose-lg prose-slate max-w-none prose-headings:font-serif prose-headings:font-bold prose-img:rounded-xl">
                 {(currentLesson.content as string).split('\n').map((line, i) => {
                   if (line.startsWith('# ')) return <h1 key={i} className="mb-6">{line.replace('# ', '')}</h1>
                   if (line.startsWith('## ')) return <h2 key={i} className="mb-4 mt-8">{line.replace('## ', '')}</h2>
                   return <p key={i} className="mb-4 text-gray-600 leading-relaxed">{line}</p>
                 })}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-10 border-t border-gray-100 mt-12">
              <div>
                {prevLesson ? (
                  <Link to={`/learn/${courseId}/lesson/${prevLesson.id}`}>
                    <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary-600">
                      <ChevronLeft className="h-4 w-4" /> Previous Lesson
                    </Button>
                  </Link>
                ) : <div/>}
              </div>
              
              <div>
                {nextLesson ? (
                  currentLesson.type === LessonType.QUIZ && !isCompleted ? (
                    <Button disabled className="gap-2 opacity-50 cursor-not-allowed bg-gray-300 text-gray-500">
                      Pass Quiz to Continue <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Link to={`/learn/${courseId}/lesson/${nextLesson.id}`} onClick={handleNext}>
                      <Button size="lg" className="gap-2 shadow-lg shadow-primary-600/20">
                        Next Lesson <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )
                ) : (
                  <Link to="/dashboard" onClick={handleNext}>
                    <Button size="lg" className={`gap-2 ${currentLesson.type === LessonType.QUIZ && !isCompleted ? 'opacity-50 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20'}`} disabled={currentLesson.type === LessonType.QUIZ && !isCompleted}>
                      Complete Course <CheckCircle className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Tutor Component */}
        <GeminiTutor
          isOpen={aiChatOpen}
          onClose={() => setAiChatOpen(false)}
          context={getAiContext()}
        />
      </div>
    </div>
  );
};

// Page renderer for new content format
function PageRenderer({ page, onQuizPass }: { page: Page; onQuizPass: () => void }) {
  switch (page.data.type) {
    case 'text':
      return (
        <div
          className="prose prose-lg prose-slate max-w-none prose-headings:font-serif prose-headings:font-bold prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: page.data.html }}
        />
      );

    case 'video': {
      const videoData = page.data;
      let embedUrl = videoData.url;

      // Convert YouTube URLs to embed format
      if (videoData.provider === 'youtube') {
        if (videoData.url.includes('youtu.be/')) {
          const videoId = videoData.url.split('youtu.be/')[1]?.split('?')[0];
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (videoData.url.includes('youtube.com/watch')) {
          const urlParams = new URLSearchParams(new URL(videoData.url).search);
          const videoId = urlParams.get('v');
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      } else if (videoData.provider === 'vimeo') {
        const match = videoData.url.match(/vimeo\.com\/(\d+)/);
        if (match) {
          embedUrl = `https://player.vimeo.com/video/${match[1]}`;
        }
      } else if (videoData.provider === 'loom') {
        const match = videoData.url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
        if (match) {
          embedUrl = `https://www.loom.com/embed/${match[1]}`;
        }
      }

      return (
        <div className="aspect-video bg-black rounded-xl shadow-2xl overflow-hidden ring-4 ring-gray-100">
          <iframe
            src={embedUrl}
            title="Video"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    case 'image': {
      const imageData = page.data;
      return (
        <figure className="my-6">
          <img
            src={imageData.url}
            alt={imageData.alt}
            className="w-full max-h-[500px] object-contain rounded-xl shadow-lg"
          />
          {imageData.caption && (
            <figcaption className="text-center text-sm text-gray-500 mt-2 italic">
              {imageData.caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case 'code': {
      const codeData = page.data;
      return (
        <div className="rounded-xl overflow-hidden shadow-lg">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-400 text-sm">
            <span className="capitalize">{codeData.language}</span>
          </div>
          <pre className="p-4 bg-gray-900 text-gray-100 font-mono text-sm overflow-x-auto">
            <code>{codeData.code}</code>
          </pre>
        </div>
      );
    }

    case 'quiz': {
      const quizData = page.data;
      const quizJson = JSON.stringify({
        passingScore: quizData.passingScore,
        questions: quizData.questions
      });
      return <QuizViewer content={quizJson} onPass={onQuizPass} />;
    }

    case 'embed': {
      const embedData = page.data;
      return (
        <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-lg">
          <iframe
            src={embedData.embedUrl}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      );
    }

    case 'divider': {
      const dividerData = page.data;
      if (dividerData.style === 'space') {
        return <div className="h-8" />;
      }
      if (dividerData.style === 'dots') {
        return (
          <div className="flex items-center justify-center py-4">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mx-1" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mx-1" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mx-1" />
          </div>
        );
      }
      return <hr className="border-gray-200 my-6" />;
    }

    default:
      return null;
  }
}

// Slide-based content viewer for students
function SlideBasedViewer({
  content,
  onComplete,
  courseId,
  lessonId,
}: {
  content: SlideBasedContent;
  onComplete: () => void;
  courseId: string;
  lessonId: string;
}) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slides = content.slides.sort((a, b) => a.order - b.order);
  const currentSlide = slides[currentSlideIndex];
  const theme = themes[content.theme];
  const isLastSlide = currentSlideIndex === slides.length - 1;

  // Embed event handlers for tracking interactions
  const embedHandlers: EmbedEventHandlers = {
    onEmbedEvent: useCallback(async (
      slideId: string,
      embedUrl: string,
      event: {
        status?: EmbedStatus;
        progress?: number;
        score?: number;
        submissionData?: unknown;
        submissionType?: EmbedSubmissionType;
      }
    ) => {
      try {
        await courseService.trackEmbedInteraction(
          courseId,
          lessonId,
          slideId,
          embedUrl,
          {
            status: event.status,
            progress: event.progress,
            score: event.score,
            submissionData: event.submissionData,
            submissionType: event.submissionType,
          }
        );
        // If embed completed, could optionally trigger lesson completion
        if (event.status === 'completed') {
          console.log('Embed completed:', slideId, 'score:', event.score);
        }
      } catch (error) {
        console.error('Failed to track embed interaction:', error);
      }
    }, [courseId, lessonId]),
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentSlideIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentSlideIndex < slides.length - 1) {
          setCurrentSlideIndex((i) => i + 1);
        }
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex, slides.length, isFullscreen]);

  if (slides.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        This lesson has no content yet.
      </div>
    );
  }

  // Fullscreen mode
  if (isFullscreen && currentSlide) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <SlideCanvas
          slide={currentSlide}
          theme={theme}
          isEditing={false}
          onUpdate={() => {}}
          embedHandlers={embedHandlers}
        />

        {/* Navigation */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-lg rounded-full px-4 py-2">
          <button
            onClick={() => setCurrentSlideIndex((i) => Math.max(0, i - 1))}
            disabled={currentSlideIndex === 0}
            className="p-2 text-white disabled:opacity-30 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white text-sm font-medium min-w-[60px] text-center">
            {currentSlideIndex + 1} / {slides.length}
          </span>
          <button
            onClick={() => {
              if (currentSlideIndex < slides.length - 1) {
                setCurrentSlideIndex((i) => i + 1);
              }
            }}
            disabled={currentSlideIndex === slides.length - 1}
            className="p-2 text-white disabled:opacity-30 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Exit button */}
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fullscreen toggle */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsFullscreen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
          Fullscreen
        </button>
      </div>

      {/* Slide canvas */}
      <div className="flex-1 min-h-[400px] rounded-xl overflow-hidden shadow-lg border border-gray-200">
        {currentSlide && (
          <SlideCanvas
            slide={currentSlide}
            theme={theme}
            isEditing={false}
            onUpdate={() => {}}
            embedHandlers={embedHandlers}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <button
          onClick={() => setCurrentSlideIndex((i) => Math.max(0, i - 1))}
          disabled={currentSlideIndex === 0}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 disabled:text-gray-300 hover:bg-gray-100 rounded-lg transition-colors disabled:hover:bg-transparent"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlideIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlideIndex
                  ? 'bg-blue-600'
                  : index < currentSlideIndex
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {isLastSlide ? (
          <button
            onClick={onComplete}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Complete
            <CheckCircle className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setCurrentSlideIndex((i) => i + 1)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}