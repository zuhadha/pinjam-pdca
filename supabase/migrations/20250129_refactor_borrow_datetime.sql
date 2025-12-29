-- Migration: Refactor Borrow Datetime - Add TIMESTAMPTZ fields
-- Created: 2025-01-29
-- Purpose: Replace DATE fields with TIMESTAMPTZ, add usage_location and is_same_day

-- Step 1: Add new columns with temporary defaults
ALTER TABLE borrow_requests 
  ADD COLUMN usage_location TEXT NOT NULL DEFAULT 'Lokasi tidak dicatat',
  ADD COLUMN start_datetime TIMESTAMPTZ,
  ADD COLUMN end_datetime TIMESTAMPTZ,
  ADD COLUMN is_same_day BOOLEAN DEFAULT false NOT NULL;

-- Step 2: Migrate existing data from DATE to TIMESTAMPTZ
-- Convert start_date to start_datetime (set time to 00:00:00 UTC)
-- Convert end_date to end_datetime (set time to 23:59:59 UTC)
UPDATE borrow_requests
SET 
  start_datetime = (start_date::timestamp AT TIME ZONE 'UTC'),
  end_datetime = ((end_date::timestamp + interval '23 hours 59 minutes 59 seconds') AT TIME ZONE 'UTC'),
  is_same_day = (start_date = end_date)
WHERE start_datetime IS NULL;

-- Step 3: Make datetime columns NOT NULL after data migration
ALTER TABLE borrow_requests 
  ALTER COLUMN start_datetime SET NOT NULL,
  ALTER COLUMN end_datetime SET NOT NULL;

-- Step 4: Drop old DATE columns
ALTER TABLE borrow_requests 
  DROP COLUMN start_date,
  DROP COLUMN end_date;

-- Step 5: Add check constraint to ensure end is after start
ALTER TABLE borrow_requests
  ADD CONSTRAINT check_end_after_start CHECK (end_datetime > start_datetime);

-- Step 6: Update indexes
-- Drop old index on end_date
DROP INDEX IF EXISTS idx_borrow_requests_end_date;

-- Create new indexes for datetime fields
CREATE INDEX idx_borrow_requests_start_datetime ON borrow_requests(start_datetime);
CREATE INDEX idx_borrow_requests_end_datetime ON borrow_requests(end_datetime);
CREATE INDEX idx_borrow_requests_is_same_day ON borrow_requests(is_same_day);

-- Step 7: Add comment for documentation
COMMENT ON COLUMN borrow_requests.start_datetime IS 'Start datetime of borrowing period (UTC)';
COMMENT ON COLUMN borrow_requests.end_datetime IS 'End datetime of borrowing period (UTC)';
COMMENT ON COLUMN borrow_requests.usage_location IS 'Location where borrowed items will be used';
COMMENT ON COLUMN borrow_requests.is_same_day IS 'Flag indicating if borrowing is within same calendar day';
