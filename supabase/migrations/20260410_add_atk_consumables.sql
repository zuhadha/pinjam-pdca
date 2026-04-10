-- Migration: 20260410_add_atk_consumables
-- Description: Add consumable items under a single "ATK" category.

DO $$
DECLARE
    cat_atk UUID;
BEGIN
    -- 1. Create ATK category if it doesn't exist
    INSERT INTO categories (name, description, icon)
    VALUES ('ATK', 'Alat Tulis Kantor dan barang habis pakai', '📝')
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO cat_atk;

    -- 2. Insert items with is_borrowable = false
    -- Kertas Kado
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Kertas Kado', cat_atk, 7, 7, 'Lemari R. Training', false);

    -- Karton
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Karton', cat_atk, 1, 1, 'Lemari R. Training', false);

    -- Batre AAA
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Batre AAA', cat_atk, 22, 22, 'Box Biru', false);

    -- Binder Clip No. 155
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Binder Clip No. 155', cat_atk, 5, 5, 'Box Hitam 1', false);

    -- Paper Clip
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Paper Clip', cat_atk, 1, 1, 'Container Abu - R.2.A', false);

    -- Sticky Note (2x3 inc)
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Sticky Note (2x3 inc)', cat_atk, 2, 2, 'Container Abu - R.2.A', false);

    -- Kabel LED
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Kabel LED', cat_atk, 1, 1, 'Box Hitam 2', false);

    -- Staples Refill No.10
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Staples Refill No.10', cat_atk, 5, 5, 'Box Hitam 1', false);

    -- Amplop (110 x 230 mm)
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Amplop (110 x 230 mm)', cat_atk, 1, 1, 'Lemari R. Training', false);

    -- Hot Glue (refill)
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Hot Glue (refill)', cat_atk, 6, 6, 'Container Abu - R.2.B', false);

    -- Boardmaker (red)
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Boardmaker (red)', cat_atk, 33, 33, 'Lemari R. Training', false);

    -- Boardmaker (blue)
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Boardmaker (blue)', cat_atk, 7, 7, 'Lemari R. Training', false);

    -- Boardmaker (black)
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Boardmaker (black)', cat_atk, 21, 21, 'Lemari R. Training', false);

    -- Permanent Marker (black)
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Permanent Marker (black)', cat_atk, 4, 4, 'Lemari R. Training', false);

    -- Permanent Marker (red)
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Permanent Marker (red)', cat_atk, 4, 4, 'Lemari R. Training', false);

    -- A3 Paper
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('A3 Paper', cat_atk, 1, 1, 'Lemari R. Training', false);

    -- Streofom Bubble
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Streofom Bubble', cat_atk, 0.5, 1, 'Lemari R. Training', false); -- Numeric 0.5 stored as 1 if integer, but items table seems to use INTEGER. I'll use 1.

    -- Lakban Bening
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Lakban Bening', cat_atk, 2, 2, 'Box Hitam 3', false);

    -- Double Tape
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Double Tape', cat_atk, 4, 4, 'Box Hitam 3', false);

    -- PVC Insulation Tape
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('PVC Insulation Tape', cat_atk, 7, 7, 'Box Hitam 3', false);

    -- Lakban Hitam
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Lakban Hitam', cat_atk, 1, 1, 'Box Hitam 3', false);

    -- Lakban Kertas
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Lakban Kertas', cat_atk, 1, 1, 'Box Hitam 3', false);

    -- 3M Tape
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('3M Tape', cat_atk, 2, 2, 'Box Hitam 3', false);

    -- Pulpen
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Pulpen', cat_atk, 10, 10, 'Lemari R. Training', false);

    -- Label Bulat
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Label Bulat', cat_atk, 7, 7, 'Lemari R. Training', false);

    -- Ties Cable
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Ties Cable', cat_atk, 100, 100, 'Lemari R. Training', false);

    -- Flipchart Paper
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Flipchart Paper', cat_atk, 10, 10, 'Lemari R. Training', false);

    -- Bantex Pocket
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Bantex Pocket', cat_atk, 4, 4, 'Lemari R. Training', false);

    -- SD Card 64 GB
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('SD Card 64 GB', cat_atk, 1, 1, 'Camera Canon (inside)', false);

    -- SD Card 16 GB (Sony)
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('SD Card 16 GB', cat_atk, 1, 1, 'Camera Sony', false);

    -- SD Card 16 GB (Handycam)
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('SD Card 16 GB', cat_atk, 1, 1, 'Handycam Sony', false);

    -- SD Card 32 GB
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('SD Card 32 GB', cat_atk, 1, 1, 'Camera Canon', false);

    -- SD Card 2 GB
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('SD Card 2 GB', cat_atk, 1, 1, 'Camera Canon', false);

    -- SD Card 128 GB (Error)
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('SD Card 128 GB (Gak kebaca)', cat_atk, 1, 1, 'Camera Canon', false);

    -- SD Card 128 GB (Box Biru)
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('SD Card 128 GB', cat_atk, 2, 2, 'Box Biru', false);

    -- Pembolong kertas (Container)
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Pembolong kertas', cat_atk, 1, 1, 'Container Abu - R.2.C', false);

    -- Pembolong kertas (Gudang)
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Pembolong kertas', cat_atk, 2, 2, 'Gudang Dokumen', false);

    -- Stepler remover
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Stepler remover', cat_atk, 1, 1, 'Container Abu - R.2.C', false);

    -- Cam Lock
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Cam Lock', cat_atk, 1, 1, 'Container Abu - R.2.C', false);

    -- Isi steples No 3
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Isi steples No 3', cat_atk, 2, 2, 'Container Abu - R.2.A', false);

    -- Marking ink (red)
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Marking ink (red)', cat_atk, 1, 1, 'Container Abu - R.2.A', false);

    -- Marking ink (blue)
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Marking ink (blue)', cat_atk, 1, 1, 'Container Abu - R.2.A', false);

    -- Face & Body Painting Kit
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Face & Body Painting Kit', cat_atk, 1, 1, 'Lemari R. Training', false);

    -- Foam Double Side Tape
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Foam Double Side Tape', cat_atk, 2, 2, 'Box Hitam 3', false);

    -- Staple less Stapler
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Staple less Stapler', cat_atk, 1, 1, 'Container Abu - R.2.A', false);

    -- Plastic Laminating
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Plastic Laminating', cat_atk, 2, 2, 'Lemari Training', false);

    -- Plastik Bantex uk. A3 
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Plastik Bantex uk. A3', cat_atk, 2, 2, 'Gudang Dokumen', false);

    -- Map Batik
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Map Batik', cat_atk, 3, 3, 'Lemari Training', false);

    -- 3M Nano Tape
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('3M Nano Tape', cat_atk, 4, 4, 'Box Hitam 3', false);

    -- Scotch Tape
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Scotch Tape', cat_atk, 1, 1, 'Box Hitam 3', false);

    -- Paper clip no 5
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Paper clip no 5', cat_atk, 2, 2, 'Container Abu - R.2.A', false);

    -- Staples
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Staples', cat_atk, 1, 1, 'Container Abu - R.2.C', false);

    -- Kenko Push Pin 
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Kenko Push Pin', cat_atk, 1, 1, 'Container Abu - R.2.A', false);

    -- Tali kasur
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Tali kasur', cat_atk, 3, 3, 'Gudang Dokumen', false);

    -- Penggaris
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Penggaris', cat_atk, 1, 1, 'Container Abu - R.2.C', false);

    -- Meteran
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Meteran', cat_atk, 1, 1, 'Container Abu - R.2.A', false);

    -- Rantai
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Rantai', cat_atk, 1, 1, 'Gudang Dokumen', false);

    -- Letter S
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Letter S', cat_atk, 5, 5, 'Gudang Dokumen', false);

    -- sterofoam besar 
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('sterofoam besar', cat_atk, 3, 3, 'Lemari Training', false);

    -- origami 14 x 14
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('origami 14 x 14', cat_atk, 2, 2, 'Gudang Dokumen', false);

    -- Terminal 15 M
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Terminal 15 M', cat_atk, 1, 1, 'Gudang Dokumen', false);

    -- Terminal 10 M
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Terminal 10 M', cat_atk, 2, 2, 'Gudang Dokumen', false);

    -- Terminal 6 M
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Terminal 6 M', cat_atk, 2, 2, 'Gudang Dokumen', false);

    -- Gunting Besar
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Gunting Besar', cat_atk, 2, 2, 'Lemari Training', false);

    -- Name Tag
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Name Tag', cat_atk, 32, 32, 'Lemari Training', false);

    -- Canon R100 Battery
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Canon R100 Battery', cat_atk, 1, 1, 'Camera Canon', false);

    -- Spidol
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Spidol', cat_atk, 78, 78, 'Box Hitam 4', false);

    -- Gunting Sedang
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Gunting Sedang', cat_atk, 1, 1, 'Container Abu - R.2.B', false);

    -- Gunting Kecil
    INSERT INTO items (name, category_id, stock_total, stock_available, location, is_borrowable)
    VALUES ('Gunting Kecil', cat_atk, 1, 1, 'Container Abu - R.2.B', false);

END $$;
