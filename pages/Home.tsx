import React, { useMemo } from 'react';
import { CourseCard } from '../components/CourseCard';
import { Sparkles, Search, ArrowRight } from 'lucide-react';
import { useCourse } from '../context/CourseContext';
import { Button } from '../components/Button';

export const Home: React.FC = () => {
  const { courses, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, isLoading } = useCourse();

  // Extract unique categories dynamically
  const categories = useMemo(() => {
    const cats = new Set(courses.map(c => c.category));
    return ['All', ...Array.from(cats)];
  }, [courses]);

  // Filter courses based on search query and category
  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructorName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Premium Hero Section */}
      {!searchQuery && (
        <div className="bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
                <div className="max-w-4xl">
                    <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 text-primary-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-8">
                        <Sparkles className="h-3 w-3" />
                        <span>AI-Powered Learning Platform</span>
                    </div>
                    <h1 className="font-serif text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-[1.1] tracking-tight">
                        Master your craft with <span className="text-primary-600 italic">world-class</span> instruction.
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-500 mb-12 leading-relaxed max-w-2xl font-light">
                        Join a community of lifelong learners. Access premium courses in design, development, and business powered by next-gen AI tutoring.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Button size="lg" className="rounded-full px-10 text-lg h-14 shadow-xl shadow-primary-900/10 font-bold">
                            Explore Courses <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button size="lg" variant="outline" className="rounded-full px-10 text-lg h-14 border-gray-300 text-gray-700 hover:text-gray-900 font-semibold bg-white">
                            Become an Instructor
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
              <h2 className="font-sans text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                {searchQuery ? `Search Results` : 'Featured Collections'}
              </h2>
              <p className="text-gray-500 text-lg">Hand-picked courses for your career growth</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
             {categories.map(cat => (
               <button
                 key={cat}
                 onClick={() => setSelectedCategory(cat)}
                 className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
                   selectedCategory === cat 
                     ? 'bg-gray-900 text-white border-gray-900 shadow-lg' 
                     : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                 }`}
               >
                 {cat}
               </button>
             ))}
          </div>
        </div>

        {/* Results Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {filteredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 mb-6">
              <Search className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
              We couldn't find any courses matching "{searchQuery}" in the {selectedCategory} category.
            </p>
            <Button 
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              variant="outline"
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};