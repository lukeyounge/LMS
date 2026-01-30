import React, { useEffect, useState } from 'react';
import { getUserTransactions } from '../services/paymentService';
import { Transaction } from '../types';
import { CheckCircle, XCircle, Clock, RefreshCw, CreditCard } from 'lucide-react';

export const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getUserTransactions();
      setTransactions(data);
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'refunded':
        return <RefreshCw className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide";

    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'refunded':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
        <h2 className="font-sans text-xl font-bold text-gray-900 mb-6">Payment History</h2>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
        <h2 className="font-sans text-xl font-bold text-gray-900 mb-6">Payment History</h2>
        <div className="text-center py-12">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
        <h2 className="font-sans text-xl font-bold text-gray-900 mb-6">Payment History</h2>
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No transactions yet</p>
          <p className="text-sm text-gray-500 mt-2">Your payment history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
      <h2 className="font-sans text-xl font-bold text-gray-900 mb-6">Payment History</h2>

      <div className="space-y-4">
        {transactions.map((transaction: any) => (
          <div
            key={transaction.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                {transaction.course?.thumbnail_url && (
                  <img
                    src={transaction.course.thumbnail_url}
                    alt={transaction.course.title}
                    className="w-16 h-16 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {transaction.course?.title || 'Course'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(transaction.createdAt)}
                  </p>
                  {transaction.gatewayReference && (
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      Ref: {transaction.gatewayReference}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 ml-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(transaction.status)}
                  <span className={getStatusBadge(transaction.status)}>
                    {transaction.status}
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {transaction.currency} {transaction.amount.toFixed(2)}
                </p>
              </div>
            </div>

            {transaction.status === 'completed' && transaction.completedAt && (
              <div className="border-t border-gray-100 pt-3 mt-3">
                <p className="text-xs text-gray-500">
                  Completed on {formatDate(transaction.completedAt)}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
