-- Sync Database Users with Supabase Auth
-- Run this after creating users in the public.users table
-- This creates corresponding auth.users entries for authentication

-- Create auth users for all database users
-- Email format: username@internal.local
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'authenticated',
  'authenticated',
  username || '@internal.local',
  password_hash,
  NOW(),
  NOW(),
  NOW(),
  jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
  jsonb_build_object('name', name, 'username', username, 'role', role::text),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
FROM users;

-- Verify auth users created
SELECT 
  email, 
  raw_user_meta_data->>'name' as name, 
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
WHERE email LIKE '%@internal.local'
ORDER BY email;

-- Note: Now you can login with:
-- Email: adminsystem@internal.local
-- Password: nik123
-- 
-- The application will handle the username format,
-- so users can just enter "adminsystem" without @internal.local
