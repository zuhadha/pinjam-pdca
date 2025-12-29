-- Rollback Migration: Remove Item Images Table
-- Created: 2025-01-29
-- Purpose: Rollback multi-image changes and restore single photo_url column

-- Step 1: Add back photo_url column to items table
ALTER TABLE items ADD COLUMN photo_url TEXT;

-- Step 2: Migrate first image from item_images back to photo_url
-- Only migrate the first image (display_order = 0)
UPDATE items
SET photo_url = (
  SELECT image_url
  FROM item_images
  WHERE item_images.item_id = items.id
  ORDER BY display_order
  LIMIT 1
);

-- Step 3: Drop item_images table (CASCADE will drop indexes)
DROP TABLE IF EXISTS item_images CASCADE;

-- Note: This rollback will lose all images except the first one per item
-- Supabase Storage files will need to be manually deleted if bucket exists
