-- Migration: Simplify Workflow - Remove Approval Process
-- Created: 2024-12-24
-- Purpose: Update existing pending/approved requests to borrowed status

-- Update all pending requests to borrowed
UPDATE borrow_requests 
SET 
  status = 'borrowed',
  approved_at = created_at,
  approved_by = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
WHERE status = 'pending';

-- Update all approved requests to borrowed
UPDATE borrow_requests
SET status = 'borrowed'
WHERE status = 'approved';

-- Note: rejected requests remain as-is for historical record
-- They won't appear in active filters going forward
