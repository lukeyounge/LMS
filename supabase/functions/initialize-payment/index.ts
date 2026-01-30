import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InitializePaymentRequest {
  courseId: string;
  gateway?: string;
}

interface InitializePaymentResponse {
  authorizationUrl: string;
  reference: string;
  transactionId: string;
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
    const { courseId, gateway = 'paystack' }: InitializePaymentRequest = await req.json();

    if (!courseId) {
      return new Response(
        JSON.stringify({ error: 'courseId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get course details
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('id, title, price, instructor_id')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return new Response(
        JSON.stringify({ error: 'Course not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify course has a price
    if (course.price <= 0) {
      return new Response(
        JSON.stringify({ error: 'Course is free, no payment required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is already enrolled
    const { data: existingEnrollment } = await supabaseClient
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (existingEnrollment) {
      return new Response(
        JSON.stringify({ error: 'Already enrolled in this course' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if there's already a completed payment
    const { data: existingTransaction } = await supabaseClient
      .from('transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('status', 'completed')
      .single();

    if (existingTransaction) {
      return new Response(
        JSON.stringify({ error: 'Payment already completed for this course' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get gateway ID
    const { data: gatewayData, error: gatewayError } = await supabaseClient
      .from('payment_gateways')
      .select('id')
      .eq('name', gateway)
      .eq('is_active', true)
      .single();

    if (gatewayError || !gatewayData) {
      return new Response(
        JSON.stringify({ error: `Payment gateway ${gateway} not available` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique reference
    const reference = `txn_${Date.now()}_${user.id.substring(0, 8)}`;

    // Create pending transaction in database
    const { data: transaction, error: txnError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: user.id,
        course_id: courseId,
        gateway_id: gatewayData.id,
        amount: course.price,
        currency: 'ZAR',
        status: 'pending',
        gateway_reference: reference,
      })
      .select()
      .single();

    if (txnError || !transaction) {
      console.error('Error creating transaction:', txnError);
      return new Response(
        JSON.stringify({ error: 'Failed to create transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user email for Paystack
    const { data: userData } = await supabaseClient
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single();

    const email = userData?.email || user.email;

    // Initialize Paystack payment
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Payment gateway configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert ZAR to cents (Paystack uses smallest currency unit)
    const amountInCents = Math.round(course.price * 100);

    // Get callback URL from environment or construct it
    const baseUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:3000';
    const callbackUrl = `${baseUrl}/#/payment/callback`;

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountInCents,
        currency: 'ZAR',
        reference,
        callback_url: callbackUrl,
        metadata: {
          course_id: courseId,
          course_title: course.title,
          user_id: user.id,
          transaction_id: transaction.id,
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      console.error('Paystack initialization error:', paystackData);

      // Update transaction status to failed
      await supabaseClient
        .from('transactions')
        .update({
          status: 'failed',
          gateway_response: paystackData,
        })
        .eq('id', transaction.id);

      return new Response(
        JSON.stringify({ error: 'Failed to initialize payment with gateway' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update transaction with gateway response
    await supabaseClient
      .from('transactions')
      .update({
        gateway_response: paystackData.data,
      })
      .eq('id', transaction.id);

    const response: InitializePaymentResponse = {
      authorizationUrl: paystackData.data.authorization_url,
      reference,
      transactionId: transaction.id,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in initialize-payment:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
