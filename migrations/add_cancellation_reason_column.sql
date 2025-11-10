-- Migration: Add cancellation_reason column to orders table
-- Date: 2025-11-09
-- Purpose: Allow vendors to provide a reason when cancelling orders
-- This improves customer communication and helps track cancellation patterns

-- ============================================
-- ADD CANCELLATION REASON COLUMN
-- ============================================

-- Add the column (nullable to support existing orders without cancellation reason)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Add helpful comment to column
COMMENT ON COLUMN public.orders.cancellation_reason IS 'Reason provided by vendor when cancelling an order. Used for customer communication and analytics.';

-- Optional: Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_orders_cancellation_reason 
ON public.orders(cancellation_reason) 
WHERE cancellation_reason IS NOT NULL;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify the column was added successfully:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'orders' AND column_name = 'cancellation_reason';

-- ============================================
-- ROLLBACK (if needed)
-- ============================================
-- To remove this column (use with caution - data will be lost):
-- DROP INDEX IF EXISTS idx_orders_cancellation_reason;
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS cancellation_reason;

-- ============================================
-- AFTER RUNNING THIS MIGRATION
-- ============================================
-- Uncomment the cancellation_reason code in:
-- backend/src/routes/vendor.js (around line 173)
-- 
-- Change from:
--   // if (status === 'cancelled' && reason) {
--   //   updateData.cancellation_reason = reason;
--   // }
-- 
-- To:
--   if (status === 'cancelled' && reason) {
--     updateData.cancellation_reason = reason;
--   }
