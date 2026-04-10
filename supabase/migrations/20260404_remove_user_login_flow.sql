-- Migration: Remove User Login Flow & Add Borrower Identity Fields
-- Created: 2026-04-04
-- Purpose: 
--   1. Store borrower identity (name, email, division) directly on borrow_requests
--   2. Remove user_id FK from borrow_requests (no longer needed for public users)
--   3. Make return tokens reusable (remove 'used' column)
--   4. Update RLS policies to allow anonymous inserts

-- ==================================================
-- 1. Add borrower identity columns to borrow_requests
-- ==================================================
ALTER TABLE borrow_requests
  ADD COLUMN IF NOT EXISTS borrower_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS borrower_email TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS borrower_division TEXT NOT NULL DEFAULT '';

-- ==================================================
-- 2. Remove user_id FK from borrow_requests
--    (Only admin users need auth; borrowers are anonymous)
-- ==================================================

-- Drop dependent RLS policies that reference user_id first
DROP POLICY IF EXISTS "Allow users to view own requests" ON borrow_requests;
DROP POLICY IF EXISTS "Allow users to create own requests" ON borrow_requests;

-- Drop user_id column (FK to users)
ALTER TABLE borrow_requests DROP COLUMN IF EXISTS user_id CASCADE;

-- ==================================================
-- 3. Update return_tokens: make token reusable
--    Remove 'used' and 'used_at' columns
-- ==================================================
ALTER TABLE return_tokens
  DROP COLUMN IF EXISTS used,
  DROP COLUMN IF EXISTS used_at;

-- Drop the index on 'used' (no longer needed)
DROP INDEX IF EXISTS idx_return_tokens_used;

-- ==================================================
-- 4. Update RLS policies for borrow_requests
-- ==================================================

-- Drop existing admin policies to recreate them cleanly
DROP POLICY IF EXISTS "Allow admins to view all requests" ON borrow_requests;
DROP POLICY IF EXISTS "Allow admins to update requests" ON borrow_requests;

-- Allow anyone (anon) to INSERT borrow requests (no auth needed for borrowers)
CREATE POLICY "Allow public to create borrow requests" ON borrow_requests
  FOR INSERT WITH CHECK (true);

-- Allow anyone to SELECT their own request by token (handled in app code via service role)
-- Admins can view all requests
CREATE POLICY "Allow admins to view all requests" ON borrow_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to update requests (for verifying returns)
CREATE POLICY "Allow admins to update requests" ON borrow_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==================================================
-- 5. Update RLS for borrow_items (remove user_id-based policies)
-- ==================================================
DROP POLICY IF EXISTS "Allow users to view own request items" ON borrow_items;
DROP POLICY IF EXISTS "Allow users to create request items" ON borrow_items;

-- Allow public to insert borrow_items (linked to borrow_request)
CREATE POLICY "Allow public to create borrow items" ON borrow_items
  FOR INSERT WITH CHECK (true);

-- Admins can view all borrow_items
-- (existing "Allow admins to view all request items" and "Allow admins to manage request items" should still exist)

-- ==================================================
-- 6. Update RLS for borrow_logs (remove user_id-based policies)
-- ==================================================
DROP POLICY IF EXISTS "Allow users to view own request logs" ON borrow_logs;

-- Allow public INSERT to borrow_logs (for system events like return declaration)
DROP POLICY IF EXISTS "Allow admins to create logs" ON borrow_logs;
CREATE POLICY "Allow public to create logs" ON borrow_logs
  FOR INSERT WITH CHECK (true);

-- ==================================================
-- 7. Update RLS for reminder_logs (remove user_id-based check)
-- ==================================================
DROP POLICY IF EXISTS "Allow users to view own reminder logs" ON reminder_logs;

-- ==================================================
-- 8. Update comments
-- ==================================================
COMMENT ON COLUMN borrow_requests.borrower_name IS 'Name of the person borrowing (no auth required)';
COMMENT ON COLUMN borrow_requests.borrower_email IS 'Email of borrower for notifications and return confirmation';
COMMENT ON COLUMN borrow_requests.borrower_division IS 'Division/department of the borrower';
COMMENT ON TABLE return_tokens IS 'Reusable tokens for return confirmation from email links. Created at borrow time, valid until end_datetime + 30 days.';
