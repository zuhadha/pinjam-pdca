-- Migration Name: 20260410_add_item_units
-- Description: Add item tracking system by creating item_units and borrow_item_units

-- 1. Create item_units table
CREATE TABLE item_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true NOT NULL,
  condition TEXT DEFAULT 'good' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(item_id, code) -- A code should be unique within an item at least, or across all items? Unique across all items is safer.
);

-- Make code generally unique across all inventory
ALTER TABLE item_units DROP CONSTRAINT item_units_item_id_code_key;
ALTER TABLE item_units ADD CONSTRAINT item_units_code_key UNIQUE(code);

-- 2. Create borrow_item_units table
CREATE TABLE borrow_item_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  borrow_item_id UUID REFERENCES borrow_items(id) ON DELETE CASCADE NOT NULL,
  item_unit_id UUID REFERENCES item_units(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(borrow_item_id, item_unit_id)
);

-- 3. Indexes
CREATE INDEX idx_item_units_item_id ON item_units(item_id);
CREATE INDEX idx_item_units_code ON item_units(code);
CREATE INDEX idx_item_units_is_available ON item_units(is_available);
CREATE INDEX idx_borrow_item_units_borrow_item_id ON borrow_item_units(borrow_item_id);
CREATE INDEX idx_borrow_item_units_item_unit_id ON borrow_item_units(item_unit_id);

-- 4. Triggers for updated_at
CREATE TRIGGER update_item_units_updated_at BEFORE UPDATE ON item_units
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Trigger to automatically sync stock_total and stock_available in items
CREATE OR REPLACE FUNCTION sync_item_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE items 
    SET stock_total = (SELECT count(*) FROM item_units WHERE item_id = NEW.item_id),
        stock_available = (SELECT count(*) FROM item_units WHERE item_id = NEW.item_id AND is_available = true)
    WHERE id = NEW.item_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_available != NEW.is_available THEN
      UPDATE items 
      SET stock_total = (SELECT count(*) FROM item_units WHERE item_id = NEW.item_id),
          stock_available = (SELECT count(*) FROM item_units WHERE item_id = NEW.item_id AND is_available = true)
      WHERE id = NEW.item_id;
    END IF;
    IF OLD.item_id != NEW.item_id THEN
      -- Recalculate for OLD
      UPDATE items 
      SET stock_total = (SELECT count(*) FROM item_units WHERE item_id = OLD.item_id),
          stock_available = (SELECT count(*) FROM item_units WHERE item_id = OLD.item_id AND is_available = true)
      WHERE id = OLD.item_id;
      -- Recalculate for NEW
      UPDATE items 
      SET stock_total = (SELECT count(*) FROM item_units WHERE item_id = NEW.item_id),
          stock_available = (SELECT count(*) FROM item_units WHERE item_id = NEW.item_id AND is_available = true)
      WHERE id = NEW.item_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE items 
    SET stock_total = (SELECT count(*) FROM item_units WHERE item_id = OLD.item_id),
        stock_available = (SELECT count(*) FROM item_units WHERE item_id = OLD.item_id AND is_available = true)
    WHERE id = OLD.item_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_item_stock
AFTER INSERT OR UPDATE OR DELETE ON item_units
FOR EACH ROW EXECUTE FUNCTION sync_item_stock();

-- 6. RLS Policies
ALTER TABLE item_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_item_units ENABLE ROW LEVEL SECURITY;

-- item_units policies (public read, admin write)
CREATE POLICY "Allow everyone to view item_units" ON item_units
  FOR SELECT USING (true);

CREATE POLICY "Allow admins to manage item_units" ON item_units
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- borrow_item_units policies
CREATE POLICY "Allow admins to view all request item_units" ON borrow_item_units
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Allow admins to manage request item_units" ON borrow_item_units
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role bypasses RLS automatically, so no need for public policies if handled via server actions

-- Reset existing items stock to 0 to await user manual code creation
UPDATE items SET stock_total = 0, stock_available = 0;
