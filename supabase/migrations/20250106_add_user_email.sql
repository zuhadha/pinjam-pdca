-- Migration: Add email field to users table
-- Created: 2025-01-06
-- Purpose: Add email field for sending reminder emails

-- Add email column
ALTER TABLE users ADD COLUMN email TEXT;

-- Create index for email lookups
CREATE INDEX idx_users_email ON users(email);

-- Update existing users with placeholder emails based on username
-- You should update these with real email addresses
UPDATE users SET email = username || '@garudafood.com' WHERE email IS NULL;

-- Make email NOT NULL after populating existing records
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- Add unique constraint (optional, comment out if users can share emails)
-- ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Add comment
COMMENT ON COLUMN users.email IS 'User email address for notifications and communications';
