import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourse } from '../context/CourseContext';
import { useAuth } from '../context/AuthContext';
import { initializePayment } from '../services/paymentService';
import { Button } from '../components/Button';
import { Lock, CreditCard, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';

export const Checkout: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { courses, getEnrollment } = useCourse();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const course = courses.find(c => c.id === courseId);
  const enrollment = courseId ? getEnrollment(courseId) : null;

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Redirect if course not found
    if (!course) {
      navigate('/');
      return;
    }

    // Redirect if already enrolled
    if (enrollment) {
      navigate(`/course/${courseId}`);
      return;
    }

    // Redirect if course is free
    if (course.price === 0) {
      navigate(`/course/${courseId}`);
      return;
    }
  }, [course, enrollment, courseId, isAuthenticated, navigate]);

  if (!course) {
    return <div className="p-20 text-center font-serif text-2xl text-gray-400">Loading...</div>;
  }

  const handlePayment = async () => {
    if (!courseId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await initializePayment({
        courseId,
        gateway: 'paystack',
      });

      // Redirect to Paystack checkout
      window.location.href = response.authorizationUrl;
    } catch (err: any) {
      console.error('Payment initialization error:', err);
      setError(err.message || 'Failed to initialize payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Course</span>
          </button>
          <h1 className="font-sans text-3xl font-bold text-gray-900">Checkout</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Payment Form Column */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
              <h2 className="font-sans text-xl font-bold text-gray-900 mb-6">Payment Method</h2>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Payment Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Payment Gateway Selection */}
              <div className="space-y-4 mb-8">
                <div className="border-2 border-primary-500 rounded-lg p-4 bg-primary-50/50 cursor-pointer hover:bg-primary-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-primary-500 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-gray-700" />
                        <span className="font-semibold text-gray-900">Paystack</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Secure payment via Paystack (Card, Bank Transfer, EFT)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Secure Payment</p>
                    <p className="mt-1">Your payment information is encrypted and secure. We do not store your card details.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary Column */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 sticky top-8">
              <h2 className="font-sans text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              {/* Course Info */}
              <div className="mb-6">
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{course.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-6 mb-6 space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Course Price</span>
                  <span className="font-semibold">R{course.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Tax</span>
                  <span className="font-semibold">R0.00</span>
                </div>
              </div>

              {/* Total */}
              <div className="border-t-2 border-gray-300 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-primary-600">R{course.price.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">ZAR (South African Rand)</p>
              </div>

              {/* Pay Button */}
              <Button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    <span>Proceed to Payment</span>
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By completing your purchase, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
