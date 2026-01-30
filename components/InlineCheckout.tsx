import React, { useState } from 'react';
import { Lock, ShieldCheck, CreditCard, AlertCircle, CheckCircle, Clock, Infinity as InfinityIcon } from 'lucide-react';
import { Button } from './Button';
import { initializePayment } from '../services/paymentService';
import { Course } from '../types';

interface InlineCheckoutProps {
  course: Course;
  isAuthenticated: boolean;
  onLoginRequired: () => void;
}

export const InlineCheckout: React.FC<InlineCheckoutProps> = ({
  course,
  isAuthenticated,
  onLoginRequired,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const originalPrice = Math.round(course.price * 1.2);
  const discount = originalPrice - course.price;
  const discountPercent = Math.round((discount / originalPrice) * 100);

  const handlePayment = async () => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await initializePayment({
        courseId: course.id,
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

  if (!showCheckout) {
    return (
      <div className="space-y-4">
        {/* Price Display */}
        <div className="flex items-end gap-3">
          <span className="text-4xl font-bold text-gray-900 tracking-tight font-sans">
            R{course.price}
          </span>
          <span className="text-lg text-gray-400 line-through mb-1 font-medium">
            R{originalPrice}
          </span>
          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full mb-1">
            {discountPercent}% OFF
          </span>
        </div>

        {/* Urgency */}
        <div className="flex items-center gap-2 text-orange-600 text-sm font-medium">
          <Clock className="h-4 w-4" />
          <span>Sale ends soon!</span>
        </div>

        {/* Main CTA */}
        <Button
          onClick={() => setShowCheckout(true)}
          size="lg"
          className="w-full py-4 text-base shadow-lg shadow-primary-600/30 font-bold h-14"
        >
          Enroll Now
        </Button>

        {/* Guarantee */}
        <p className="text-center text-xs text-gray-500 font-semibold">
          30-Day Money-Back Guarantee
        </p>

        {/* Quick Benefits */}
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Instant access after payment</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <InfinityIcon className="h-4 w-4 text-primary-600" />
            <span>Lifetime access to all content</span>
          </div>
        </div>
      </div>
    );
  }

  // Expanded checkout view
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Quick Checkout</h3>
        <button
          onClick={() => setShowCheckout(false)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Payment Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Course Price</span>
          <span className="text-gray-400 line-through">R{originalPrice}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-green-600 font-medium">Discount ({discountPercent}% off)</span>
          <span className="text-green-600">-R{discount}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 mt-2">
          <div className="flex justify-between">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-xl text-primary-600">R{course.price}</span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-primary-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">Paystack</p>
            <p className="text-xs text-gray-500">Card, Bank Transfer, EFT</p>
          </div>
          <div className="flex gap-1">
            {/* Payment method icons */}
            <div className="w-8 h-5 bg-blue-600 rounded text-white text-[8px] font-bold flex items-center justify-center">VISA</div>
            <div className="w-8 h-5 bg-orange-500 rounded text-white text-[8px] font-bold flex items-center justify-center">MC</div>
          </div>
        </div>
      </div>

      {/* Security Badges */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Lock className="h-3 w-3" />
          <span>256-bit SSL</span>
        </div>
        <div className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" />
          <span>PCI Compliant</span>
        </div>
      </div>

      {/* Pay Button */}
      <Button
        onClick={handlePayment}
        disabled={loading}
        size="lg"
        className="w-full py-4 text-base shadow-lg shadow-primary-600/30 font-bold h-14 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <Lock className="h-5 w-5" />
            <span>Pay R{course.price} Securely</span>
          </>
        )}
      </Button>

      {/* Terms */}
      <p className="text-xs text-gray-500 text-center">
        By completing purchase, you agree to our Terms of Service
      </p>

      {/* Guarantee */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
        <p className="text-sm text-green-700 font-medium">
          30-Day Money-Back Guarantee
        </p>
        <p className="text-xs text-green-600 mt-1">
          Not satisfied? Get a full refund, no questions asked.
        </p>
      </div>
    </div>
  );
};
