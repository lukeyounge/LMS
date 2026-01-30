import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-paystack-signature, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Paystack secret key for signature verification
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return new Response('Configuration error', { status: 500 });
    }

    // Get request body as text for signature verification
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (!signature) {
      console.error('Missing x-paystack-signature header');
      return new Response('Unauthorized', { status: 401 });
    }

    // Verify webhook signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(paystackSecretKey);
    const messageData = encoder.encode(body);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (computedSignature !== signature) {
      console.error('Invalid webhook signature');
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse webhook payload
    const event = JSON.parse(body);

    console.log('Paystack webhook event:', event.event);

    // Only process charge.success events
    if (event.event !== 'charge.success') {
      console.log('Ignoring event type:', event.event);
      return new Response('OK', { status: 200 });
    }

    const paymentData = event.data;
    const reference = paymentData.reference;

    if (!reference) {
      console.error('No reference in webhook data');
      return new Response('Bad Request', { status: 400 });
    }

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

    // Find transaction by reference
    const { data: transaction, error: txnError } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('gateway_reference', reference)
      .single();

    if (txnError || !transaction) {
      console.error('Transaction not found for reference:', reference);
      return new Response('Transaction not found', { status: 404 });
    }

    // If already completed, skip (idempotency)
    if (transaction.status === 'completed') {
      console.log('Transaction already completed, skipping');
      return new Response('OK', { status: 200 });
    }

    // Verify payment status
    if (paymentData.status !== 'success') {
      console.log('Payment not successful:', paymentData.status);

      // Update transaction status
      await supabaseClient
        .from('transactions')
        .update({
          status: paymentData.status === 'failed' ? 'failed' : 'pending',
          gateway_response: paymentData,
        })
        .eq('id', transaction.id);

      return new Response('OK', { status: 200 });
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

      return new Response('Amount mismatch', { status: 400 });
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
      return new Response('Database error', { status: 500 });
    }

    // Create enrollment using helper function
    try {
      const { error: enrollError } = await supabaseClient.rpc(
        'create_enrollment_from_transaction',
        { transaction_uuid: transaction.id }
      );

      if (enrollError) {
        console.error('Error creating enrollment:', enrollError);
        // Transaction is marked completed but enrollment failed
        // This should be retried or handled manually
        // Don't return error to Paystack (prevent retry loop)
      } else {
        console.log('Enrollment created successfully for transaction:', transaction.id);
      }
    } catch (enrollError) {
      console.error('Enrollment error:', enrollError);
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Error in paystack-webhook:', error);
    return new Response('Internal server error', { status: 500 });
  }
});
