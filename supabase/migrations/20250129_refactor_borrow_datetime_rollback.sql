-- Rollback Migration: Refactor Borrow Datetime
-- Created: 2025-01-29
-- Purpose: Rollback changes to restore DATE fields and remove new columns

-- Step 1: Add back the old DATE columns
ALTER TABLE borrow_requests 
  ADD COLUMN start_date DATE,
  ADD COLUMN end_date DATE;

-- Step 2: Migrate data back from TIMESTAMPTZ to DATE
UPDATE borrow_requests
SET 
  start_date = start_datetime::date,
  end_date = end_datetime::date;

-- Step 3: Make DATE columns NOT NULL
ALTER TABLE borrow_requests 
  ALTER COLUMN start_date SET NOT NULL,
  ALTER COLUMN end_date SET NOT NULL;

-- Step 4: Drop the constraint
ALTER TABLE borrow_requests
  DROP CONSTRAINT IF EXISTS check_end_after_start;

-- Step 5: Drop new columns
ALTER TABLE borrow_requests 
  DROP COLUMN start_datetime,
  DROP COLUMN end_datetime,
  DROP COLUMN usage_location,
  DROP COLUMN is_same_day;

-- Step 6: Restore old indexes
DROP INDEX IF EXISTS idx_borrow_requests_start_datetime;
DROP INDEX IF EXISTS idx_borrow_requests_end_datetime;
DROP INDEX IF EXISTS idx_borrow_requests_is_same_day;

-- Recreate old index
CREATE INDEX idx_borrow_requests_end_date ON borrow_requests(end_date);

-- Note: This rollback will result in loss of time information and usage_location data
