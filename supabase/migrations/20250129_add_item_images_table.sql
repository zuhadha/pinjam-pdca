-- Migration: Add Item Images Table for Multi-Image Support
-- Created: 2025-01-29
-- Purpose: Replace single photo_url with multi-image support using Supabase Storage

-- Step 1: Create item_images table
CREATE TABLE item_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  image_path TEXT NOT NULL, -- Path in Supabase Storage bucket (e.g. "item-uuid/filename.jpg")
  image_url TEXT NOT NULL, -- Full public URL from Supabase Storage
  display_order INTEGER DEFAULT 0 NOT NULL,
  file_name TEXT,
  file_size INTEGER, -- in bytes
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 2: Create indexes for performance
CREATE INDEX idx_item_images_item_id ON item_images(item_id);
CREATE INDEX idx_item_images_display_order ON item_images(item_id, display_order);

-- Step 3: Migrate existing photo_url data to item_images
-- Only migrate non-null and non-empty URLs
INSERT INTO item_images (item_id, image_path, image_url, display_order, file_name)
SELECT 
  id,
  photo_url, -- Use existing URL as path (will be replaced when admin re-uploads)
  photo_url,
  0, -- First image
  'migrated-image.jpg'
FROM items
WHERE photo_url IS NOT NULL AND photo_url != '';

-- Step 4: Drop old photo_url column from items table
ALTER TABLE items DROP COLUMN photo_url;

-- Step 5: Add comments for documentation
COMMENT ON TABLE item_images IS 'Stores multiple images per item with metadata';
COMMENT ON COLUMN item_images.image_path IS 'Storage path in Supabase bucket';
COMMENT ON COLUMN item_images.image_url IS 'Public URL for direct access';
COMMENT ON COLUMN item_images.display_order IS 'Order of images in carousel (0-based)';
COMMENT ON COLUMN item_images.file_size IS 'File size in bytes (max 5MB = 5242880 bytes)';
