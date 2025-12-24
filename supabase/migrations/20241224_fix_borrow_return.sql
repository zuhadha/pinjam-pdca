-- Migration to fix borrow system issues
-- Run this in Supabase SQL Editor after the initial schema

-- 1. Add 'return_declared' to request_status enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'request_status' 
    AND e.enumlabel = 'return_declared'
  ) THEN
    ALTER TYPE request_status ADD VALUE 'return_declared';
  END IF;
END$$;

-- 2. Drop existing policy if exists and create new one for users to update their own requests
DROP POLICY IF EXISTS "Allow users to update own requests for return" ON borrow_requests;

CREATE POLICY "Allow users to update own requests for return" ON borrow_requests
  FOR UPDATE USING (
    user_id = auth.uid() 
    AND status IN ('approved', 'borrowed')
  )
  WITH CHECK (
    user_id = auth.uid() 
    AND status = 'borrowed'
    AND return_declared_at IS NOT NULL
  );

-- 3. Drop existing policy if exists and create new one for users to create borrow logs
DROP POLICY IF EXISTS "Allow users to create logs" ON borrow_logs;

CREATE POLICY "Allow users to create logs" ON borrow_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM borrow_requests
      WHERE id = request_id AND user_id = auth.uid()
    )
  );

-- 4. Verify the changes
SELECT 
  enumlabel as status_value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'request_status'
ORDER BY e.enumsortorder;
