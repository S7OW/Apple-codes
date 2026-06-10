-- Add payment_gateway column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'tap';

-- Rename stripe_payment_id to payment_gateway_id if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'stripe_payment_id'
  ) THEN
    ALTER TABLE orders RENAME COLUMN stripe_payment_id TO payment_gateway_id;
  END IF;
END $$;

-- Add payment_gateway_id column if it doesn't exist (for fresh installs)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_gateway_id TEXT;

-- Add checkout_payment_id column for Tap charge ID
ALTER TABLE orders ADD COLUMN IF NOT EXISTS checkout_payment_id TEXT;

-- Update existing orders to use 'tap' as default gateway
UPDATE orders SET payment_gateway = 'tap' WHERE payment_gateway IS NULL;