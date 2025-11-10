-- Add cancellation_reason column to orders table
-- This allows vendors to provide a reason when cancelling orders
-- Run this in your Supabase SQL Editor

ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN orders.cancellation_reason IS 'Reason provided by vendor when cancelling an order';
