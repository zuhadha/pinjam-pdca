-- Migration: Add RLS Policies for item_images table
-- Created: 2025-01-29
-- Purpose: Enable row-level security policies for item_images table

-- Enable RLS on item_images table
ALTER TABLE item_images ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view all item images (for catalog display)
CREATE POLICY "Public can view item images"
ON item_images FOR SELECT
USING (true);

-- Policy: Admin users can insert images
CREATE POLICY "Admin users can insert item images"
ON item_images FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admin users can update images
CREATE POLICY "Admin users can update item images"
ON item_images FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admin users can delete images
CREATE POLICY "Admin users can delete item images"
ON item_images FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
