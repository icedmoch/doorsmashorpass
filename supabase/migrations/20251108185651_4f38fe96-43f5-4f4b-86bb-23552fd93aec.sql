-- Add stripe_account_id to profiles table for deliverers
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_account_id text;

-- Add stripe_payment_intent_id to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id text;