import React from 'react';
import { CheckCircle, Play, X, Sparkles, BookOpen, MessageSquare, Award } from 'lucide-react';
import { Button } from './Button';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseName: string;
  userEmail?: string;
  onStartLearning: () => void;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  onClose,
  courseName,
  userEmail,
  onStartLearning,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all overflow-hidden">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Success Header with gradient */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-8 pt-10 pb-8 text-center text-white relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full"></div>

            <div className="relative">
              <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-5 w-5" />
                <h2 className="text-2xl font-bold">You're In!</h2>
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-green-100">Payment successful</p>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Welcome to
            </h3>
            <p className="text-xl font-bold text-primary-600 text-center mb-6">
              {courseName}
            </p>

            {userEmail && (
              <p className="text-sm text-gray-500 text-center mb-6">
                Receipt sent to: <span className="font-medium text-gray-700">{userEmail}</span>
              </p>
            )}

            {/* Quick tips */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick tips:</h4>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <BookOpen className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
                  <span>Lessons auto-save your progress</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <MessageSquare className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
                  <span>Ask the AI tutor if you get stuck</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <Award className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
                  <span>Certificate awarded on completion</span>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <Button
              onClick={onStartLearning}
              size="lg"
              className="w-full py-4 text-base shadow-lg shadow-primary-600/30 font-bold flex items-center justify-center gap-2"
            >
              <Play className="h-5 w-5" />
              Start Learning Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
