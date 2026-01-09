-- Add is_borrowable boolean column to items table
-- true = borrowable (must be returned)
-- false = requestable (permanent request)

ALTER TABLE items 
ADD COLUMN is_borrowable BOOLEAN DEFAULT true NOT NULL;

-- Add index for filtering
CREATE INDEX idx_items_borrowable ON items(is_borrowable);

-- Add comment for clarity
COMMENT ON COLUMN items.is_borrowable IS 'true = borrowable item (must return), false = requestable item (permanent)';
