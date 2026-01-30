import { supabase } from '../lib/supabaseClient';
import {
  Transaction,
  PaymentGateway,
  InitializePaymentRequest,
  InitializePaymentResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
} from '../types';

/**
 * Payment Service
 * Handles all payment-related operations via Supabase Edge Functions
 */

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Get authentication headers for Edge Function calls
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Initialize a payment for a course
 * Returns authorization URL to redirect user to payment gateway
 */
export async function initializePayment(
  request: InitializePaymentRequest
): Promise<InitializePaymentResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(
      `${FUNCTIONS_URL}/functions/v1/initialize-payment`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to initialize payment');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error initializing payment:', error);
    throw new Error(error.message || 'Failed to initialize payment');
  }
}

/**
 * Verify a payment after redirect from payment gateway
 * Creates enrollment if payment is successful
 */
export async function verifyPayment(
  request: VerifyPaymentRequest
): Promise<VerifyPaymentResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(
      `${FUNCTIONS_URL}/functions/v1/verify-payment`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to verify payment');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    throw new Error(error.message || 'Failed to verify payment');
  }
}

/**
 * Get all transactions for the current user
 */
export async function getUserTransactions(): Promise<Transaction[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        courses (
          title,
          thumbnail_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((txn: any) => ({
      id: txn.id,
      userId: txn.user_id,
      courseId: txn.course_id,
      gatewayId: txn.gateway_id,
      amount: txn.amount,
      currency: txn.currency,
      status: txn.status,
      gatewayReference: txn.gateway_reference,
      gatewayResponse: txn.gateway_response,
      createdAt: new Date(txn.created_at),
      completedAt: txn.completed_at ? new Date(txn.completed_at) : undefined,
      // Include course info for display
      course: txn.courses,
    }));
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    throw new Error(error.message || 'Failed to fetch transactions');
  }
}

/**
 * Get a specific transaction by ID
 */
export async function getTransaction(transactionId: string): Promise<Transaction | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return {
      id: data.id,
      userId: data.user_id,
      courseId: data.course_id,
      gatewayId: data.gateway_id,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      gatewayReference: data.gateway_reference,
      gatewayResponse: data.gateway_response,
      createdAt: new Date(data.created_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    };
  } catch (error: any) {
    console.error('Error fetching transaction:', error);
    throw new Error(error.message || 'Failed to fetch transaction');
  }
}

/**
 * Get all active payment gateways
 */
export async function getPaymentGateways(): Promise<PaymentGateway[]> {
  try {
    const { data, error } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('is_active', true)
      .order('display_name');

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((gateway: any) => ({
      id: gateway.id,
      name: gateway.name,
      displayName: gateway.display_name,
      isActive: gateway.is_active,
      config: gateway.config || {},
      createdAt: new Date(gateway.created_at),
      updatedAt: new Date(gateway.updated_at),
    }));
  } catch (error: any) {
    console.error('Error fetching payment gateways:', error);
    throw new Error(error.message || 'Failed to fetch payment gateways');
  }
}

/**
 * Get course transactions (for instructors)
 */
export async function getCourseTransactions(courseId: string): Promise<Transaction[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    // Verify user owns the course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      throw new Error('Course not found');
    }

    if (course.instructor_id !== user.id) {
      throw new Error('Not authorized to view course transactions');
    }

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        users (
          name,
          email
        )
      `)
      .eq('course_id', courseId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((txn: any) => ({
      id: txn.id,
      userId: txn.user_id,
      courseId: txn.course_id,
      gatewayId: txn.gateway_id,
      amount: txn.amount,
      currency: txn.currency,
      status: txn.status,
      gatewayReference: txn.gateway_reference,
      gatewayResponse: txn.gateway_response,
      createdAt: new Date(txn.created_at),
      completedAt: txn.completed_at ? new Date(txn.completed_at) : undefined,
      // Include user info for instructor dashboard
      user: txn.users,
    }));
  } catch (error: any) {
    console.error('Error fetching course transactions:', error);
    throw new Error(error.message || 'Failed to fetch course transactions');
  }
}
