import { useState } from 'react';
import {
  HelpCircle,
  Plus,
  Trash2,
  GripVertical,
  Check,
  X
} from 'lucide-react';
import { QuizPageData, QuizQuestion } from '../../../types';

interface QuizBlockProps {
  data: QuizPageData;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (data: QuizPageData) => void;
  onDelete: () => void;
}

export function QuizBlock({
  data,
  isSelected,
  onSelect,
  onUpdate,
  onDelete
}: QuizBlockProps) {
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: crypto.randomUUID(),
      question: '',
      options: ['', ''],
      correctAnswerIndex: 0
    };
    onUpdate({
      ...data,
      questions: [...data.questions, newQuestion]
    });
  };

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    const newQuestions = [...data.questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    onUpdate({
      ...data,
      questions: newQuestions
    });
  };

  const deleteQuestion = (index: number) => {
    onUpdate({
      ...data,
      questions: data.questions.filter((_, i) => i !== index)
    });
  };

  const addOption = (questionIndex: number) => {
    const question = data.questions[questionIndex];
    updateQuestion(questionIndex, {
      options: [...question.options, '']
    });
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = data.questions[questionIndex];
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    updateQuestion(questionIndex, { options: newOptions });
  };

  const deleteOption = (questionIndex: number, optionIndex: number) => {
    const question = data.questions[questionIndex];
    if (question.options.length <= 2) return; // Minimum 2 options

    const newOptions = question.options.filter((_, i) => i !== optionIndex);
    const newCorrectIndex = question.correctAnswerIndex >= optionIndex && question.correctAnswerIndex > 0
      ? question.correctAnswerIndex - 1
      : question.correctAnswerIndex;

    updateQuestion(questionIndex, {
      options: newOptions,
      correctAnswerIndex: Math.min(newCorrectIndex, newOptions.length - 1)
    });
  };

  const setCorrectAnswer = (questionIndex: number, optionIndex: number) => {
    updateQuestion(questionIndex, { correctAnswerIndex: optionIndex });
  };

  const updatePassingScore = (score: number) => {
    onUpdate({
      ...data,
      passingScore: Math.max(0, Math.min(100, score))
    });
  };

  return (
    <div
      className={`relative group rounded-lg border transition-all overflow-hidden ${
        isSelected
          ? 'border-blue-400 shadow-sm'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-600" />
          <span className="font-medium text-amber-800">Quiz</span>
          <span className="text-sm text-amber-600">
            ({data.questions.length} question{data.questions.length !== 1 ? 's' : ''})
          </span>
        </div>

        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
            title="Delete quiz"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Questions */}
      <div className="p-4 space-y-4">
        {data.questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <HelpCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No questions yet</p>
            <p className="text-xs text-gray-400 mt-1">Click below to add your first question</p>
          </div>
        ) : (
          data.questions.map((question, qIndex) => (
            <div
              key={question.id}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              {/* Question header */}
              <div className="flex items-start gap-2 mb-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                  {qIndex + 1}
                </span>
                <input
                  type="text"
                  value={question.question}
                  onChange={(e) => updateQuestion(qIndex, { question: e.target.value })}
                  placeholder="Enter your question..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
                {isSelected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteQuestion(qIndex);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Options */}
              <div className="ml-8 space-y-2">
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCorrectAnswer(qIndex, oIndex);
                      }}
                      className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        question.correctAnswerIndex === oIndex
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                      title={question.correctAnswerIndex === oIndex ? 'Correct answer' : 'Mark as correct'}
                    >
                      {question.correctAnswerIndex === oIndex && (
                        <Check className="w-3 h-3" />
                      )}
                    </button>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                      placeholder={`Option ${oIndex + 1}`}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {isSelected && question.options.length > 2 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteOption(qIndex, oIndex);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove option"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {isSelected && question.options.length < 6 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addOption(qIndex);
                    }}
                    className="ml-7 text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add option
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {/* Add question button */}
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              addQuestion();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        )}

        {/* Passing score */}
        {isSelected && data.questions.length > 0 && (
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <label className="text-sm text-gray-600">Passing score:</label>
            <input
              type="number"
              value={data.passingScore}
              onChange={(e) => updatePassingScore(parseInt(e.target.value) || 0)}
              min={0}
              max={100}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
        )}
      </div>
    </div>
  );
}
