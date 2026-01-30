import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyPayment } from '../services/paymentService';
import { XCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';

type PaymentStatus = 'verifying' | 'success' | 'failed';

export const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<PaymentStatus>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const [courseId, setCourseId] = useState<string | null>(null);

  useEffect(() => {
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref'); // Paystack uses this param

    const paymentReference = reference || trxref;

    if (!paymentReference) {
      setStatus('failed');
      setMessage('Invalid payment reference. Please try again.');
      return;
    }

    // Verify payment
    const verify = async () => {
      try {
        const response = await verifyPayment({ reference: paymentReference });

        if (response.status === 'success') {
          // Trigger refresh event for any listening components
          window.dispatchEvent(new Event('payment-success'));

          // Redirect to course page with success parameter to show modal
          if (response.courseId) {
            navigate(`/course/${response.courseId}?payment=success`, { replace: true });
          } else {
            navigate('/', { replace: true });
          }
          return;
        } else {
          setStatus('failed');
          setMessage(response.message || 'Payment verification failed. Please contact support if you were charged.');
          setCourseId(response.courseId || null);
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        setMessage(error.message || 'Failed to verify payment. Please contact support.');
      }
    };

    verify();
  }, [searchParams, navigate]);

  const handleRetry = () => {
    if (courseId) {
      navigate(`/course/${courseId}`);
    } else {
      navigate('/');
    }
  };

  // Only show UI for verifying and failed states (success redirects)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 text-center">

          {/* Status Icon */}
          <div className="mb-6">
            {status === 'verifying' && (
              <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
              </div>
            )}
            {status === 'failed' && (
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            )}
          </div>

          {/* Status Title */}
          <h1 className="font-sans text-2xl font-bold text-gray-900 mb-3">
            {status === 'verifying' && 'Verifying Payment'}
            {status === 'failed' && 'Payment Failed'}
          </h1>

          {/* Status Message */}
          <p className="text-gray-600 mb-8">{message}</p>

          {/* Action Buttons - Only show for failed state */}
          {status === 'failed' && (
            <div className="space-y-3">
              <Button
                onClick={handleRetry}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Try Again
              </Button>

              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Back to Home
              </Button>
            </div>
          )}

          {/* Support Link */}
          {status === 'failed' && (
            <p className="text-sm text-gray-500 mt-6">
              Need help? <a href="mailto:support@lms.com" className="text-primary-600 hover:text-primary-700 underline">Contact Support</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
