import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyPaymentRequest {
  reference: string;
}

interface VerifyPaymentResponse {
  status: 'success' | 'failed' | 'pending';
  courseId?: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { reference }: VerifyPaymentRequest = await req.json();

    if (!reference) {
      return new Response(
        JSON.stringify({ error: 'reference is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find transaction by reference
    const { data: transaction, error: txnError } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('gateway_reference', reference)
      .eq('user_id', user.id)
      .single();

    if (txnError || !transaction) {
      return new Response(
        JSON.stringify({
          status: 'failed',
          message: 'Transaction not found',
        } as VerifyPaymentResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If already completed, return success
    if (transaction.status === 'completed') {
      return new Response(
        JSON.stringify({
          status: 'success',
          courseId: transaction.course_id,
          message: 'Payment already verified',
        } as VerifyPaymentResponse),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify payment with Paystack
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Payment gateway configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
        },
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      console.error('Paystack verification error:', paystackData);

      // Update transaction status
      await supabaseClient
        .from('transactions')
        .update({
          status: 'failed',
          gateway_response: paystackData,
        })
        .eq('id', transaction.id);

      return new Response(
        JSON.stringify({
          status: 'failed',
          message: 'Payment verification failed',
        } as VerifyPaymentResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentData = paystackData.data;

    // Check payment status
    if (paymentData.status !== 'success') {
      // Update transaction status
      await supabaseClient
        .from('transactions')
        .update({
          status: paymentData.status === 'failed' ? 'failed' : 'pending',
          gateway_response: paymentData,
        })
        .eq('id', transaction.id);

      return new Response(
        JSON.stringify({
          status: paymentData.status,
          message: `Payment ${paymentData.status}`,
        } as VerifyPaymentResponse),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify amount matches
    const paidAmount = paymentData.amount / 100; // Convert from cents
    const expectedAmount = transaction.amount;

    if (Math.abs(paidAmount - expectedAmount) > 0.01) {
      console.error(`Amount mismatch: expected ${expectedAmount}, got ${paidAmount}`);

      await supabaseClient
        .from('transactions')
        .update({
          status: 'failed',
          gateway_response: paymentData,
        })
        .eq('id', transaction.id);

      return new Response(
        JSON.stringify({
          status: 'failed',
          message: 'Payment amount mismatch',
        } as VerifyPaymentResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Payment successful - update transaction
    const { error: updateError } = await supabaseClient
      .from('transactions')
      .update({
        status: 'completed',
        completed_at: new Date(paymentData.paid_at || new Date()).toISOString(),
        gateway_response: paymentData,
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create enrollment using helper function
    try {
      const { error: enrollError } = await supabaseClient.rpc(
        'create_enrollment_from_transaction',
        { transaction_uuid: transaction.id }
      );

      if (enrollError) {
        console.error('Error creating enrollment:', enrollError);
        // Transaction is marked completed, but enrollment failed
        // This should be retried or handled manually
        return new Response(
          JSON.stringify({
            status: 'success',
            courseId: transaction.course_id,
            message: 'Payment successful, but enrollment creation failed. Please contact support.',
          } as VerifyPaymentResponse),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (enrollError) {
      console.error('Enrollment error:', enrollError);
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        courseId: transaction.course_id,
        message: 'Payment verified and enrollment created',
      } as VerifyPaymentResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-payment:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
