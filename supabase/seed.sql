-- Seed data for Website Peminjaman Barang
-- Username format: full name lowercase without dots (e.g., "budisantoso")
-- Password default: "nik123" for all users

-- Disable RLS temporarily for seeding
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;

-- Insert Admin User
-- Password: nik123 (bcrypt hashed)
INSERT INTO users (id, username, password_hash, name, nik, role, is_active) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'adminsystem', '$2b$10$HFaPTfjRnu6w4zkVauNLoOZV4FQY.XSLRN9bBXwNI6R84ZsasqCdG', 'Admin System', 'nik123', 'admin', true);

-- Insert Sample Users (5-10 users)
INSERT INTO users (username, password_hash, name, nik, role, is_active) VALUES
('budisantoso', '$2b$10$HFaPTfjRnu6w4zkVauNLoOZV4FQY.XSLRN9bBXwNI6R84ZsasqCdG', 'Budi Santoso', 'nik123', 'user', true),
('sitinurhayati', '$2b$10$HFaPTfjRnu6w4zkVauNLoOZV4FQY.XSLRN9bBXwNI6R84ZsasqCdG', 'Siti Nurhayati', 'nik123', 'user', true),
('ahmadrifai', '$2b$10$HFaPTfjRnu6w4zkVauNLoOZV4FQY.XSLRN9bBXwNI6R84ZsasqCdG', 'Ahmad Rifai', 'nik123', 'user', true),
('dewinurina', '$2b$10$HFaPTfjRnu6w4zkVauNLoOZV4FQY.XSLRN9bBXwNI6R84ZsasqCdG', 'Dewi Nurina', 'nik123', 'user', true),
('rikoprasetyo', '$2b$10$HFaPTfjRnu6w4zkVauNLoOZV4FQY.XSLRN9bBXwNI6R84ZsasqCdG', 'Riko Prasetyo', 'nik123', 'user', true),
('lindawati', '$2b$10$HFaPTfjRnu6w4zkVauNLoOZV4FQY.XSLRN9bBXwNI6R84ZsasqCdG', 'Linda Wati', 'nik123', 'user', true),
('firdaushidayat', '$2b$10$HFaPTfjRnu6w4zkVauNLoOZV4FQY.XSLRN9bBXwNI6R84ZsasqCdG', 'Firdaus Hidayat', 'nik123', 'user', true),
('putriamelia', '$2b$10$HFaPTfjRnu6w4zkVauNLoOZV4FQY.XSLRN9bBXwNI6R84ZsasqCdG', 'Putri Amelia', 'nik123', 'user', true);

-- Insert Categories with text icons
INSERT INTO categories (name, description, icon) VALUES
('Elektronik', 'Peralatan elektronik kantor', '💻'),
('Alat Tulis', 'Alat tulis dan perlengkapan kantor', '✏️'),
('Peralatan Meeting', 'Peralatan untuk keperluan rapat dan presentasi', '📊'),
('Furnitur', 'Furniture dan perlengkapan ruangan', '🪑'),
('Lainnya', 'Kategori lainnya', '📦');

-- Get category IDs for items
DO $$
DECLARE
  cat_elektronik UUID;
  cat_alat_tulis UUID;
  cat_meeting UUID;
  cat_furnitur UUID;
  cat_lainnya UUID;
BEGIN
  SELECT id INTO cat_elektronik FROM categories WHERE name = 'Elektronik';
  SELECT id INTO cat_alat_tulis FROM categories WHERE name = 'Alat Tulis';
  SELECT id INTO cat_meeting FROM categories WHERE name = 'Peralatan Meeting';
  SELECT id INTO cat_furnitur FROM categories WHERE name = 'Furnitur';
  SELECT id INTO cat_lainnya FROM categories WHERE name = 'Lainnya';

  -- Insert Sample Items (20-30 items, mix of sensitive and regular)
  
  -- Elektronik (mostly sensitive)
  INSERT INTO items (name, description, category_id, stock_total, stock_available, location, is_sensitive) VALUES
  ('Laptop Dell Latitude 5420', 'Laptop untuk keperluan kerja mobile', cat_elektronik, 5, 5, 'Ruang IT - Rak A1', true),
  ('Laptop HP ProBook 440', 'Laptop untuk keperluan kerja mobile', cat_elektronik, 3, 3, 'Ruang IT - Rak A2', true),
  ('Proyektor Epson EB-X41', 'Proyektor untuk presentasi', cat_elektronik, 4, 4, 'Ruang Meeting - Lemari B', true),
  ('Kamera Canon EOS M50', 'Kamera untuk dokumentasi acara', cat_elektronik, 2, 2, 'Ruang Kreatif - Locker 1', true),
  ('Microphone Wireless Shure', 'Microphone untuk acara', cat_elektronik, 3, 3, 'Ruang Meeting - Lemari B', true),
  ('Speaker Portable JBL', 'Speaker untuk acara kecil', cat_elektronik, 4, 4, 'Ruang Meeting - Lemari C', false),
  ('Mouse Wireless Logitech', 'Mouse wireless untuk laptop', cat_elektronik, 10, 10, 'Ruang IT - Laci A', false),
  ('Keyboard External', 'Keyboard eksternal USB', cat_elektronik, 8, 8, 'Ruang IT - Laci B', false),
  ('Hardisk External 1TB', 'Media penyimpanan eksternal', cat_elektronik, 5, 5, 'Ruang IT - Laci C', true),
  ('USB Flash Drive 32GB', 'Flash drive untuk transfer data', cat_elektronik, 15, 15, 'Ruang IT - Laci D', false),
  
  -- Peralatan Meeting (mostly sensitive)
  ('Whiteboard Portable', 'Papan tulis portable untuk meeting', cat_meeting, 3, 3, 'Ruang Meeting - Samping Pintu', false),
  ('Laser Pointer', 'Pointer untuk presentasi', cat_meeting, 5, 5, 'Ruang Meeting - Lemari A', false),
  ('Flip Chart + Stand', 'Papan flip chart dengan stand', cat_meeting, 2, 2, 'Ruang Meeting - Pojok Kanan', false),
  ('Extension Cable 10m', 'Kabel ekstensi untuk meeting', cat_meeting, 5, 5, 'Ruang Meeting - Lemari C', false),
  ('HDMI Cable 5m', 'Kabel HDMI untuk proyektor', cat_meeting, 8, 8, 'Ruang Meeting - Lemari B', false),
  
  -- Alat Tulis (all regular)
  ('Stapler Besar', 'Stapler ukuran besar', cat_alat_tulis, 6, 6, 'Ruang Administrasi - Rak 1', false),
  ('Gunting Kertas', 'Gunting untuk keperluan kantor', cat_alat_tulis, 8, 8, 'Ruang Administrasi - Rak 1', false),
  ('Penggaris 30cm', 'Penggaris stainless steel', cat_alat_tulis, 10, 10, 'Ruang Administrasi - Rak 2', false),
  ('Cutter Besar', 'Cutter untuk memotong kertas', cat_alat_tulis, 7, 7, 'Ruang Administrasi - Rak 2', false),
  ('Box File Plastik', 'Box file untuk penyimpanan dokumen', cat_alat_tulis, 20, 20, 'Ruang Administrasi - Rak 3', false),
  
  -- Furnitur (all regular)
  ('Kursi Lipat', 'Kursi lipat untuk acara', cat_furnitur, 15, 15, 'Gudang - Area A', false),
  ('Meja Lipat 120cm', 'Meja lipat untuk acara', cat_furnitur, 8, 8, 'Gudang - Area B', false),
  ('Standing Banner', 'Standing banner untuk promosi', cat_furnitur, 5, 5, 'Ruang Kreatif - Pojok', false),
  
  -- Lainnya
  ('Tas Laptop', 'Tas untuk membawa laptop', cat_lainnya, 5, 5, 'Ruang IT - Rak C', false),
  ('Payung Besar', 'Payung untuk outdoor', cat_lainnya, 6, 6, 'Ruang Administrasi - Pojok', false),
  ('Megaphone', 'Pengeras suara portable', cat_lainnya, 2, 2, 'Ruang Meeting - Lemari C', false),
  ('Toolbox', 'Peralatan toolkit sederhana', cat_lainnya, 3, 3, 'Gudang - Area C', false),
  ('Tangga Lipat', 'Tangga lipat alluminium', cat_lainnya, 2, 2, 'Gudang - Area D', false);
  
END $$;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Note: The bcrypt hash above is a placeholder. In production, you should:
-- 1. Generate proper bcrypt hash for "nik123" password
-- 2. Or use Supabase Auth properly with email/password
-- 
-- To generate proper hash, use:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('nik123', 10);
