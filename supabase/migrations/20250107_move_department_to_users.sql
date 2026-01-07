-- Migration: Add department to users, remove from borrow_requests
-- Created: 2025-01-07
-- Purpose: Move department field to user level (better normalization)

-- 1. Add department to users table
ALTER TABLE users ADD COLUMN department TEXT;

-- 2. Create index for department filtering
CREATE INDEX idx_users_department ON users(department);

-- 3. Remove department from borrow_requests (not needed per transaction)
ALTER TABLE borrow_requests DROP COLUMN IF EXISTS department;

-- 4. Add comment
COMMENT ON COLUMN users.department IS 'User department/division (e.g., Human Capital, SHE, IT, etc.)';
