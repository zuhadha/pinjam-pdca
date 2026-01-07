-- Migration: Remove unused columns from items table
-- Created: 2025-01-07
-- Purpose: Clean up items table by removing is_sensitive and is_active

-- 1. Drop RLS policies that depend on these columns
DROP POLICY IF EXISTS "Allow everyone to view active items" ON items;

-- 2. Drop is_sensitive column (no longer need approval workflow)
ALTER TABLE items DROP COLUMN IF EXISTS is_sensitive;

-- 3. Drop is_active column (no soft delete needed, hard delete only)
ALTER TABLE items DROP COLUMN IF EXISTS is_active;

-- 4. Drop related indexes if they exist
DROP INDEX IF EXISTS idx_items_is_sensitive;
DROP INDEX IF EXISTS idx_items_is_active;

-- Note: All items are now treated equally (no sensitive items)
-- Note: Deletion is permanent (no soft delete)
