import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCcw, ArrowRight } from 'lucide-react';
import { Button } from './Button';

interface QuizQuestion {
  id: number | string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

interface QuizData {
  passingScore: number;
  questions: QuizQuestion[];
}

interface QuizViewerProps {
  content: string;
  onPass: () => void;
}

export const QuizViewer: React.FC<QuizViewerProps> = ({ content, onPass }) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  let quizData: QuizData;
  try {
    quizData = JSON.parse(content);
  } catch (e) {
    return <div className="text-red-500 p-4">Error loading quiz data. Invalid format.</div>;
  }

  const handleSelect = (questionId: string | number, optionIndex: number) => {
    if (isSubmitted) return;
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = () => {
    // Check if all questions are answered
    if (Object.keys(answers).length < quizData.questions.length) {
      setError("Please answer all questions before submitting.");
      return;
    }
    setError(null);

    let correctCount = 0;
    quizData.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / quizData.questions.length) * 100);
    setScore(finalScore);
    setIsSubmitted(true);
    
    const isPassed = finalScore >= quizData.passingScore;
    setPassed(isPassed);

    if (isPassed) {
      onPass();
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setIsSubmitted(false);
    setScore(0);
    setPassed(false);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-primary-50 border-b border-primary-100 p-6">
        <h2 className="text-xl font-bold text-primary-900 mb-2">Knowledge Check</h2>
        <p className="text-primary-700 text-sm">
          Pass with {quizData.passingScore}% or higher to complete this lesson.
        </p>
      </div>

      {/* Questions */}
      <div className="p-6 md:p-8 space-y-8">
        {quizData.questions.map((q, index) => (
          <div key={q.id} className="pb-6 border-b border-gray-100 last:border-0">
            <h3 className="font-semibold text-lg text-gray-800 mb-4">
              {index + 1}. {q.question}
            </h3>
            
            <div className="space-y-3">
              {q.options.map((option, optIdx) => {
                const isSelected = answers[q.id] === optIdx;
                const isCorrect = q.correctAnswerIndex === optIdx;
                
                let optionStyle = "border-gray-200 hover:bg-gray-50";
                let icon = null;

                if (isSubmitted) {
                  if (isCorrect) {
                    optionStyle = "bg-green-50 border-green-200 text-green-800";
                    icon = <CheckCircle className="h-5 w-5 text-green-600" />;
                  } else if (isSelected && !isCorrect) {
                    optionStyle = "bg-red-50 border-red-200 text-red-800";
                    icon = <XCircle className="h-5 w-5 text-red-600" />;
                  } else {
                    optionStyle = "opacity-50 border-gray-200";
                  }
                } else if (isSelected) {
                  optionStyle = "border-primary-500 bg-primary-50 text-primary-900 ring-1 ring-primary-500";
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelect(q.id, optIdx)}
                    disabled={isSubmitted}
                    className={`w-full text-left p-4 rounded-lg border flex items-center justify-between transition-all ${optionStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-primary-600' : 'border-gray-400'
                      }`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />}
                      </div>
                      <span>{option}</span>
                    </div>
                    {icon}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Results */}
      <div className="bg-gray-50 p-6 border-t border-gray-200">
        {error && (
          <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {!isSubmitted ? (
          <div className="flex justify-end">
            <Button onClick={handleSubmit} size="lg">Submit Quiz</Button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Your Score</div>
              <div className="flex items-center gap-3">
                <span className={`text-4xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                  {score}%
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              {!passed && (
                <Button variant="outline" onClick={handleRetry} className="gap-2">
                  <RefreshCcw className="h-4 w-4" /> Retry Quiz
                </Button>
              )}
              {passed && (
                <div className="text-green-700 font-medium flex items-center gap-2 animate-pulse">
                  <CheckCircle className="h-5 w-5" /> Lesson Completed!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
