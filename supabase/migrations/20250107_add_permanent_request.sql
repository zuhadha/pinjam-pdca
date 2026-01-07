-- Migration: Add Permanent Item Request Support
-- Created: 2025-01-07
-- Purpose: Extend borrow_requests to support permanent item requests (non-returnable)

-- Add new columns
ALTER TABLE borrow_requests
  ADD COLUMN is_permanent BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN department TEXT;

-- Add index for filtering by type
CREATE INDEX idx_borrow_requests_is_permanent ON borrow_requests(is_permanent);

-- Make datetime fields nullable for permanent requests
-- (Permanent requests don't need dates)
ALTER TABLE borrow_requests
  ALTER COLUMN start_datetime DROP NOT NULL,
  ALTER COLUMN end_datetime DROP NOT NULL;

-- Update check constraint to allow NULL dates for permanent requests
ALTER TABLE borrow_requests
  DROP CONSTRAINT IF EXISTS check_end_after_start;

ALTER TABLE borrow_requests
  ADD CONSTRAINT check_end_after_start 
  CHECK (
    (is_permanent = true) OR 
    (is_permanent = false AND end_datetime > start_datetime)
  );

-- Add comments
COMMENT ON COLUMN borrow_requests.is_permanent IS 'True if this is a permanent item request (not returned), false for borrowing';
COMMENT ON COLUMN borrow_requests.department IS 'Department requesting the item (optional)';

-- Note: Existing data will have is_permanent = false (default), maintaining current behavior
