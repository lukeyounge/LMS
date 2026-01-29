import React, { useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCourse } from '../context/CourseContext';
import { useAuth } from '../context/AuthContext';
import { Award, Printer, ArrowLeft, Share2 } from 'lucide-react';
import { Button } from '../components/Button';

export const Certificate: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { courses } = useCourse();
  const { user } = useAuth();
  const certificateRef = useRef<HTMLDivElement>(null);

  const course = courses.find(c => c.id === courseId);

  if (!course || !user) return <div className="p-10 text-center">Certificate unavailable</div>;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 flex flex-col items-center">
      {/* Toolbar */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8 print:hidden">
        <Link to="/dashboard">
            <Button variant="ghost" className="gap-2"><ArrowLeft className="h-4 w-4"/> Back to Dashboard</Button>
        </Link>
        <div className="flex gap-4">
            <Button variant="outline" onClick={handlePrint} className="gap-2 bg-white">
                <Printer className="h-4 w-4" /> Print / PDF
            </Button>
            <Button variant="outline" className="gap-2 bg-white">
                <Share2 className="h-4 w-4" /> Share
            </Button>
        </div>
      </div>

      {/* Certificate Container */}
      <div ref={certificateRef} className="bg-white p-2 shadow-2xl max-w-4xl w-full aspect-[1.414/1] print:shadow-none print:w-full print:absolute print:top-0 print:left-0 print:m-0">
        <div className="h-full w-full border-[20px] border-double border-primary-900 p-10 flex flex-col items-center justify-between text-center relative bg-white">
          
            {/* Corner Decorations */}
            <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-primary-600"></div>
            <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-primary-600"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-primary-600"></div>
            <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-primary-600"></div>

            <div className="mt-8">
                <div className="inline-block p-4 rounded-full bg-primary-50 mb-4">
                    <Award className="h-16 w-16 text-primary-600" />
                </div>
                <h1 className="text-4xl md:text-6xl font-serif text-primary-900 font-bold uppercase tracking-widest mb-2">Certificate</h1>
                <h2 className="text-xl md:text-2xl text-primary-600 font-light uppercase tracking-widest">Of Completion</h2>
            </div>

            <div className="flex-1 flex flex-col justify-center w-full">
                <p className="text-gray-500 italic text-lg mb-4 font-serif">This is to certify that</p>
                <h3 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 border-b-2 border-gray-200 pb-4 mb-6 mx-auto w-3/4">
                    {user.name}
                </h3>
                <p className="text-gray-500 italic text-lg mb-4 font-serif">has successfully completed the course</p>
                <h4 className="text-2xl md:text-3xl font-bold text-primary-800 mb-8 max-w-2xl mx-auto">
                    {course.title}
                </h4>
            </div>

            <div className="w-full flex flex-col md:flex-row justify-between items-end px-4 md:px-12 pb-4 mt-auto gap-8">
                <div className="text-center">
                    <div className="text-lg font-serif border-t border-gray-400 pt-2 px-8 min-w-[200px]">
                        {new Date().toLocaleDateString()}
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Date Completed</p>
                </div>

                {/* Seal */}
                <div className="hidden md:flex h-24 w-24 rounded-full bg-primary-50 border-4 border-primary-600 items-center justify-center text-primary-800 font-bold text-[10px] uppercase text-center p-2 mx-4 shadow-inner">
                   <div className="border border-primary-300 rounded-full h-20 w-20 flex items-center justify-center">
                        Verified<br/>LMS Platform
                   </div>
                </div>

                <div className="text-center">
                    <div className="text-lg font-serif border-t border-gray-400 pt-2 px-8 min-w-[200px] italic">
                        {course.instructorName}
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Instructor Signature</p>
                </div>
            </div>
        </div>
      </div>
      
      <style>{`
        @media print {
          @page { size: landscape; margin: 0; }
          body * { visibility: hidden; }
          #root { display: none; }
          .print\\:absolute { position: absolute !important; top: 0; left: 0; width: 100%; height: 100%; visibility: visible; z-index: 9999; }
          .print\\:absolute * { visibility: visible; }
        }
      `}</style>
    </div>
  );
};