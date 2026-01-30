-- Payment system tables and policies
-- Supports multiple payment gateways with pluggable architecture

-- Payment gateway configurations (admin-managed)
CREATE TABLE payment_gateways (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,           -- 'paystack', 'payfast', 'stripe'
  display_name TEXT NOT NULL,          -- 'Paystack', 'PayFast', 'Stripe'
  is_active BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',  -- Non-sensitive config (e.g., supported currencies)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions table (payment records)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  gateway_id UUID NOT NULL REFERENCES payment_gateways(id),

  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, completed, failed, refunded

  -- Gateway reference
  gateway_reference TEXT,              -- Paystack reference / PayFast m_payment_id
  gateway_response JSONB,              -- Full response for debugging

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Prevent duplicate completed payments for same user+course
  CONSTRAINT unique_completed_payment UNIQUE(user_id, course_id, status)
);

-- Remove the unique constraint for non-completed statuses (allows retries)
CREATE UNIQUE INDEX unique_completed_payment_idx
  ON transactions(user_id, course_id)
  WHERE status = 'completed';

-- Drop the named constraint since we're using partial unique index instead
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS unique_completed_payment;

-- Indexes for fast lookups
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_course ON transactions(course_id);
CREATE INDEX idx_transactions_gateway_reference ON transactions(gateway_reference);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Add payment reference to enrollments
ALTER TABLE enrollments
ADD COLUMN transaction_id UUID REFERENCES transactions(id),
ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'free';  -- free, paid, refunded

-- Index for enrollment payment lookups
CREATE INDEX idx_enrollments_transaction ON enrollments(transaction_id);
CREATE INDEX idx_enrollments_payment_status ON enrollments(payment_status);

-- RLS Policies for payment_gateways
ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;

-- Anyone can view active gateways (for checkout UI)
CREATE POLICY "Anyone can view active gateways" ON payment_gateways
  FOR SELECT USING (is_active = true);

-- Only service role can manage gateways
CREATE POLICY "Service role manages gateways" ON payment_gateways
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users view own transactions" ON transactions
  FOR SELECT USING (user_id = auth.uid());

-- Service role can manage all transactions (for Edge Functions)
CREATE POLICY "Service role manages transactions" ON transactions
  FOR ALL USING (auth.role() = 'service_role');

-- Instructors can view transactions for their courses
CREATE POLICY "Instructors view course transactions" ON transactions
  FOR SELECT USING (
    course_id IN (
      SELECT id FROM courses WHERE instructor_id = auth.uid()
    )
  );

-- Insert default Paystack gateway
INSERT INTO payment_gateways (name, display_name, is_active, config)
VALUES (
  'paystack',
  'Paystack',
  true,
  '{"supported_currencies": ["ZAR", "NGN", "GHS", "USD"]}'::jsonb
);

-- Helper function to get gateway by name
CREATE OR REPLACE FUNCTION get_gateway_by_name(gateway_name TEXT)
RETURNS UUID AS $$
DECLARE
  gateway_uuid UUID;
BEGIN
  SELECT id INTO gateway_uuid
  FROM payment_gateways
  WHERE name = gateway_name AND is_active = true
  LIMIT 1;

  IF gateway_uuid IS NULL THEN
    RAISE EXCEPTION 'Payment gateway % not found or inactive', gateway_name;
  END IF;

  RETURN gateway_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to create enrollment after successful payment
CREATE OR REPLACE FUNCTION create_enrollment_from_transaction(transaction_uuid UUID)
RETURNS UUID AS $$
DECLARE
  txn transactions;
  enrollment_uuid UUID;
BEGIN
  -- Get transaction details
  SELECT * INTO txn FROM transactions WHERE id = transaction_uuid;

  -- Verify transaction is completed
  IF txn.status != 'completed' THEN
    RAISE EXCEPTION 'Cannot create enrollment: transaction not completed';
  END IF;

  -- Check if enrollment already exists
  SELECT id INTO enrollment_uuid
  FROM enrollments
  WHERE user_id = txn.user_id AND course_id = txn.course_id;

  IF enrollment_uuid IS NOT NULL THEN
    -- Update existing enrollment with transaction reference
    UPDATE enrollments
    SET transaction_id = transaction_uuid,
        payment_status = 'paid'
    WHERE id = enrollment_uuid;

    RETURN enrollment_uuid;
  END IF;

  -- Create new enrollment
  INSERT INTO enrollments (user_id, course_id, transaction_id, payment_status, progress, completed_lesson_ids)
  VALUES (txn.user_id, txn.course_id, transaction_uuid, 'paid', 0, '{}')
  RETURNING id INTO enrollment_uuid;

  -- Increment course student count
  UPDATE courses
  SET total_students = total_students + 1
  WHERE id = txn.course_id;

  RETURN enrollment_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON TABLE transactions IS 'Stores payment transaction records for course purchases';
COMMENT ON TABLE payment_gateways IS 'Configuration for payment gateway integrations (Paystack, PayFast, etc.)';
COMMENT ON FUNCTION create_enrollment_from_transaction IS 'Creates or updates enrollment after successful payment transaction';
