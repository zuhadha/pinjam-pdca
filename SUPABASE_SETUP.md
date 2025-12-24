# 🚀 Supabase Setup Guide

## Prerequisites
- Supabase account (create one at https://supabase.com)

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name:** pinjam-barang-pdca
   - **Database Password:** (create a strong password and save it)
   - **Region:** Southeast Asia (Singapore) - closest to Indonesia
4. Click "Create new project"
5. Wait for project to be provisioned (~2 minutes)

## Step 2: Get API Keys

1. In your Supabase dashboard, go to **Project Settings** (gear icon)
2. Click **API** in the left sidebar
3. Copy the following values:
   - **Project URL** → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (click "Reveal" first) → This is your `SUPABASE_SERVICE_ROLE_KEY`

## Step 3: Create .env.local File

1. In the project root, create a file named `.env.local`
2. Add the following content (replace with your actual values):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
RESEND_API_KEY=your-resend-api-key-here
```

## Step 4: Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open the file `supabase/migrations/20241224_initial_schema.sql` from this project
4. Copy ALL the content
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for success message ✅

## Step 5: Run Database Seeder

1. In the same SQL Editor, click **New Query**
2. Open the file `supabase/seed.sql` from this project
3. Copy ALL the content
4. Paste into the SQL Editor  
5. **IMPORTANT:** Before running, you need to generate proper bcrypt hashes for password "nik123"
   - Run this command in your terminal to generate the hash:
   
   ```powershell
   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('nik123', 10).then(hash => console.log(hash));"
   ```
   
   - Copy the output hash (it looks like `$2a$10$...`)
   - Replace ALL instances of the placeholder hash in `seed.sql` with the real hash
6. Click **Run**
7. Wait for success message ✅

## Step 6: Configure Supabase Auth

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Enable **Email** provider
3. Configure settings:
   - **Enable Email Confirmations:** OFF (for internal use)
   - **Enable Email Signup:** OFF (users created via admin only)
4. Click **Save**

## Step 7: Connect Auth with Database

Since we're using custom username authentication but Supabase requires email, we need to create auth users that match our database users.

1. Go to **SQL Editor** → **New Query**
2. Run this query to create Supabase Auth users:

```sql
-- Create auth users for all database users
-- Email format: username@internal.local
-- This syncs our custom users table with Supabase Auth

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
SELECT email, raw_user_meta_data->>'name' as name, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email LIKE '%@internal.local'
ORDER BY email;
```

3. You should see output showing all users with emails like:
   - `adminsystem@internal.local`
   - `budisantoso@internal.local`
   - etc.

## Step 8: Verify Setup

1. Go to **Table Editor** in Supabase dashboard
2. Check that all tables exist:
   - ✅ users
   - ✅ categories  
   - ✅ items
   - ✅ borrow_requests
   - ✅ borrow_items
   - ✅ borrow_logs

3. Click on `users` table and verify seeded data:
   - Should see 1 admin user + 8 regular users
   
4. Click on `categories` table:
   - Should see 5 categories with icons
   
5. Click on `items` table:
   - Should see ~28 items

## Step 9: Test Database Connection

1. In your project terminal, run:
   ```powershell
   npm run dev
   ```

2. The app should start without errors
3. Check the terminal - no Supabase connection errors should appear

## ✅ Setup Complete!

Your Supabase database is now ready. The application can now:
- Authenticate users
- Manage items and categories
- Process borrow requests
- Track logs

## Default Login Credentials

**Admin:**
- Username: `adminsystem`
- Password: `nik123`

**Sample Users:**
- Username: `budisantoso`, `sitinurhayati`, `ahmadrifai`, etc.
- Password: `nik123` (all users)

---

## Troubleshooting

### Connection Error
- Double-check your `.env.local` file has correct values
- Restart the dev server (`npm run dev`)

### Migration Failed
- Make sure you copied the ENTIRE SQL file content
- Check for any red error messages in SQL Editor
- Ensure UUID extension is enabled

### Seeder Failed
- Make sure migration ran successfully first
- Verify bcrypt hash is properly generated
- Check for unique constraint errors (username/NIK must be unique)

### Auth Not Working
- Verify Email provider is enabled in Supabase dashboard
- Check RLS policies are enabled on tables
