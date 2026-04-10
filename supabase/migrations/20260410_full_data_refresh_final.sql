-- DESCRIPTION: Migration script to reset all data (except users) and populate with new inventory.
-- USAGE: Run this in the Supabase SQL Editor.

DO $$
DECLARE
    -- Category IDs
    cat_kabel UUID;
    cat_presentasi UUID;
    cat_multimedia UUID;
    cat_atk UUID;
    cat_teknis UUID;

    -- Item IDs
    item_id UUID;
BEGIN
    -- 1. DELETE EXISTING DATA (Order matters due to FKs)
    DELETE FROM reminder_logs;
    DELETE FROM return_tokens;
    DELETE FROM borrow_item_units;
    DELETE FROM borrow_items;
    DELETE FROM borrow_logs;
    DELETE FROM borrow_requests;
    DELETE FROM item_units;
    DELETE FROM item_images;
    DELETE FROM items;
    DELETE FROM categories;

    -- 2. CREATE CATEGORIES
    INSERT INTO categories (name, description, icon) VALUES 
    ('Kabel & Konektor', 'Berbagai jenis kabel perpanjangan, splitter, dan konverter', '🔌') RETURNING id INTO cat_kabel;
    
    INSERT INTO categories (name, description, icon) VALUES 
    ('Alat Presentasi', 'Pointer laser, remote mouse, dan alat bantu presentasi lainnya', '📽️') RETURNING id INTO cat_presentasi;
    
    INSERT INTO categories (name, description, icon) VALUES 
    ('Peralatan Multimedia', 'Kamera, speaker bluetooth, dan perangkat pendukung audio/video', '📷') RETURNING id INTO cat_multimedia;
    
    INSERT INTO categories (name, description, icon) VALUES 
    ('Alat Tulis & Kantor', 'Peralatan ukur, pemotong, dan alat bantu kantor umum', '📏') RETURNING id INTO cat_atk;
    
    INSERT INTO categories (name, description, icon) VALUES 
    ('Peralatan Teknis', 'Alat kerja teknis seperti Glue Gun, Hot Wire, dan pengisi daya', '🛠️') RETURNING id INTO cat_teknis;

    -- 3. INSERT ITEMS & UNITS

    -- CATEGORY: KABEL & KONEKTOR
    -- Item: Kabel Roll Krisbow 1,4 meter x 5 lubang
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Kabel Roll Krisbow 1,4 meter x 5 lubang', cat_kabel, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-K05', 'good');
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-K10', 'good');

    -- Item: Kabel Roll 5 meter x 4 lubang
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Kabel Roll 5 meter x 4 lubang', cat_kabel, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA K-04', 'good');
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA K-07', 'good');
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA K-08', 'good');
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA K-06', 'good');

    -- Item: Kabel Roll 1,5 meter x 4 lubang
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Kabel Roll 1,5 meter x 4 lubang', cat_kabel, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA K-09', 'good');

    -- Item: Kabel Splitter
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Kabel Splitter', cat_kabel, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-KS', 'good');

    -- Item: Kabel VGA to HDMI
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Kabel VGA to HDMI', cat_kabel, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-V1', 'good');

    -- Item: Kabel HDMI to VGA
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Kabel HDMI to VGA', cat_kabel, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-V2', 'good');
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-V3', 'good');

    -- Item: Kabel VGA
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Kabel VGA', cat_kabel, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-V4', 'good');

    -- Item: USB to USB Cable
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('USB to USB Cable', cat_kabel, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-V5', 'good');

    -- Item: HDMI to HDMI Cable
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('HDMI to HDMI Cable', cat_kabel, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-V6', 'good');

    -- Item: USB Extended
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('USB Extended', cat_kabel, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-V7', 'good');

    -- Item: Speaker Cable
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Speaker Cable', cat_kabel, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-V8', 'good');
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-V9', 'good');

    -- CATEGORY: ALAT PRESENTASI
    -- Item: Pointer Laser Merah (Merging normal and "new")
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Pointer Laser Merah', cat_presentasi, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-P1', 'good');
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-P2', 'good');
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-P4', 'good'); -- Merged from "Merah (new)"

    -- Item: Pointer Laser Hijau (Merging "Hijau" and "Green laser pointer")
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Pointer Laser Hijau', cat_presentasi, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-P3', 'good');
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-P5', 'good');
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-P6', 'good');

    -- Item: Air Remote Mouse
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Air Remote Mouse', cat_presentasi, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-P7', 'good');

    -- CATEGORY: PERALATAN MULTIMEDIA
    -- Item: Speaker Bluetooth EPOS
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Speaker Bluetooth EPOS', cat_multimedia, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-B', 'good');

    -- Item: Camera Sony
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Camera Sony', cat_multimedia, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-CS01', 'good');

    -- Item: Camera Canon
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Camera Canon', cat_multimedia, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-CS02', 'good');

    -- Item: Handycam Sony
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Handycam Sony', cat_multimedia, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-CS03', 'good');

    -- Item: Card Reader
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Card Reader', cat_multimedia, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-CR', 'good');

    -- Item: Flash Kamera
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Flash Kamera', cat_multimedia, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-FC', 'good');

    -- CATEGORY: ALAT TULIS & KANTOR
    -- Item: Penggaris 30 cm
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Penggaris 30 cm', cat_atk, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-PG1', 'good');

    -- Item: Sharperner
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Sharperner', cat_atk, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-SP', 'good');

    -- Item: Cutter
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Cutter', cat_atk, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-CU1', 'good');
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-CU2', 'good');

    -- Item: Meteran
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Meteran', cat_atk, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-MT1', 'good');

    -- Item: Label Printer
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Label Printer', cat_atk, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-LP', 'good');

    -- CATEGORY: PERALATAN TEKNIS
    -- Item: Hot Wire
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Hot Wire', cat_teknis, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-HW', 'good');

    -- Item: Glue Gun
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Glue Gun', cat_teknis, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-GG1', 'good');
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-GG2', 'good');

    -- Item: Battery Charging
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Battery Charging', cat_teknis, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-BC', 'good');

    -- Item: Peniup Balon Otomatis
    INSERT INTO items (name, category_id, is_borrowable) VALUES ('Peniup Balon Otomatis', cat_teknis, true) RETURNING id INTO item_id;
    INSERT INTO item_units (item_id, code, condition) VALUES (item_id, 'PDCA-BA', 'good');

END $$;
