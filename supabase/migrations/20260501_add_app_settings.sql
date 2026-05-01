-- Migration Name: 20260501_add_app_settings
-- Description: Add app_settings table to store dynamic application configuration
--              such as admin notification emails, etc.

-- 1. Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  label TEXT,                   -- Human-readable label for the admin UI
  description TEXT,             -- Explanation shown in the settings page
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_app_settings_updated_at
BEFORE UPDATE ON app_settings
FOR EACH ROW EXECUTE FUNCTION update_app_settings_updated_at();

-- 3. Default settings
INSERT INTO app_settings (key, value, label, description) VALUES
  (
    'admin_notification_emails',
    '',
    'Email Notifikasi Admin',
    'Daftar email yang menerima notifikasi setiap ada peminjaman baru. Pisahkan beberapa email dengan koma. Contoh: admin@perusahaan.com, pic@perusahaan.com'
  )
ON CONFLICT (key) DO NOTHING;

-- 4. RLS — admin read/write, service role bypasses automatically
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all settings
CREATE POLICY "Admins can view app_settings" ON app_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to update settings
CREATE POLICY "Admins can update app_settings" ON app_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to insert settings
CREATE POLICY "Admins can insert app_settings" ON app_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
