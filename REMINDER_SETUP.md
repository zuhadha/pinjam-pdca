# Email Reminder System - Setup & Deployment Guide

## 📋 Overview

Sistem reminder otomatis yang mengirim email ke pengguna yang belum mengembalikan barang ketika waktu pengembalian telah terlewati. Email dikirim setiap hari pukul **9:00 AM WIB** dan menyertakan call-to-action untuk memperbarui status pengembalian.

## 🔧 Setup Instructions

### 1. Database Migration

Jalankan migration untuk membuat tabel `reminder_logs` dan `return_tokens`:

```bash
# Apply migration di Supabase
# Upload file: supabase/migrations/20250106_add_reminder_system.sql
# ke Supabase Dashboard > SQL Editor dan execute
```

Atau jika menggunakan Supabase CLI:

```bash
supabase db push
```

### 2. Install Dependencies

Dependencies sudah terinstall:
- ✅ `resend` - Email service provider
- ✅ `@react-email/components` - Email template components
- ✅ `react-email` - Email rendering

### 3. Environment Variables

Tambahkan environment variables berikut ke `.env.local` dan Vercel:

```env
# Email Service
RESEND_API_KEY=re_xxxxxxxxxx

# Cron Job Protection
CRON_SECRET=generate-random-secure-string-here

# Application URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

#### Mendapatkan Resend API Key:

1. Daftar di [resend.com](https://resend.com)
2. Verify domain Anda (atau gunakan sandbox untuk testing)
3. Generate API Key di Settings > API Keys
4. Copy API key dan paste ke environment variable

#### Generate CRON_SECRET:

```bash
# Generate random secret (gunakan salah satu):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# atau
openssl rand -hex 32
```

### 4. Configure Vercel Environment Variables

Di Vercel Dashboard > Settings > Environment Variables, tambahkan:

| Name | Value | Environment |
|------|-------|-------------|
| `RESEND_API_KEY` | `re_xxxxx` | Production, Preview, Development |
| `CRON_SECRET` | Your generated secret | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` | Production |
| `NEXT_PUBLIC_APP_URL` | Preview URL | Preview |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Development |

### 5. Deploy to Vercel

```bash
# Commit semua changes
git add .
git commit -m "feat: implement email reminder system"
git push

# Vercel akan auto-deploy
```

### 6. Verify Cron Job

Setelah deploy:

1. Buka Vercel Dashboard
2. Pilih project Anda
3. Go to Settings > Cron Jobs
4. Pastikan cron job muncul:
   - Path: `/api/cron/send-reminders`
   - Schedule: `0 2 * * *` (9:00 AM WIB)

## 🧪 Testing

### Test 1: Manual Cron Trigger (Local Development)

```bash
# Set environment variables first di .env.local

# Trigger cron manually (ganti YOUR_CRON_SECRET dengan value dari .env.local)
curl -X GET http://localhost:3000/api/cron/send-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "message": "Reminder emails processed",
  "processed": 2,
  "sent": 2,
  "failed": 0,
  "timestamp": "2025-01-06T14:00:00.000Z"
}
```

### Test 2: Create Test Overdue Request

1. Buat borrow request dengan `end_datetime` di masa lalu:

```sql
-- Update existing request untuk testing (ganti REQUEST_ID)
UPDATE borrow_requests 
SET end_datetime = NOW() - INTERVAL '2 days',
    status = 'borrowed'
WHERE id = 'REQUEST_ID';
```

2. Trigger cron job (lihat Test 1)
3. Check email inbox untuk reminder
4. Klik "Konfirmasi Pengembalian Sekarang"
5. Verify redirect ke `/return-success`

### Test 3: Token Validation

Test berbagai skenario token:

```bash
# Valid token
curl http://localhost:3000/api/return?token=VALID_TOKEN

# Invalid token
curl http://localhost:3000/api/return?token=invalid

# Used token (klik link yang sama 2x)
curl http://localhost:3000/api/return?token=ALREADY_USED_TOKEN

# Expired token (manually set expires_at to past)
curl http://localhost:3000/api/return?token=EXPIRED_TOKEN
```

### Test 4: Check Database Logs

```sql
-- Check reminder logs
SELECT * FROM reminder_logs 
ORDER BY sent_at DESC 
LIMIT 10;

-- Check return tokens
SELECT 
  rt.token,
  rt.used,
  rt.expires_at,
  br.id as request_id,
  u.name as user_name
FROM return_tokens rt
JOIN borrow_requests br ON rt.request_id = br.id
JOIN users u ON br.user_id = u.id
ORDER BY rt.created_at DESC
LIMIT 10;

-- Check token usage
SELECT 
  COUNT(*) as total_tokens,
  SUM(CASE WHEN used THEN 1 ELSE 0 END) as used_count,
  SUM(CASE WHEN NOT used AND expires_at > NOW() THEN 1 ELSE 0 END) as valid_count
FROM return_tokens;
```

## 📧 Email Customization

### Update Email Sender

Edit `lib/email/email-service.ts`:

```typescript
from: 'PDCA Peminjaman Barang <noreply@yourdomain.com>', // Update dengan domain Anda
```

> **Note**: Untuk production, Anda harus verify domain di Resend. Untuk testing, gunakan sandbox.

### Update Email Template

Edit `lib/email/templates/overdue-reminder-email.tsx` untuk:
- Mengubah wording
- Menambahkan logo
- Mengubah color scheme
- Menambahkan additional information

## 🔍 Monitoring

### Check Cron Execution

Di Vercel Dashboard > Deployments > Functions:
- Lihat logs untuk `/api/cron/send-reminders`
- Check execution time dan errors

### Email Delivery Status

Query reminder_logs untuk monitoring:

```sql
-- Email success rate hari ini
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM reminder_logs
WHERE sent_at::date = CURRENT_DATE
GROUP BY status;

-- Failed emails dengan error messages
SELECT 
  request_id,
  email_to,
  error_message,
  sent_at
FROM reminder_logs
WHERE status = 'failed'
  AND sent_at > NOW() - INTERVAL '7 days'
ORDER BY sent_at DESC;
```

## 🚨 Troubleshooting

### Email tidak terkirim

1. **Check Resend API Key**:
   - Pastikan `RESEND_API_KEY` sudah set di Vercel
   - Verify di Resend dashboard bahwa API key masih valid

2. **Check Domain Verification**:
   - Untuk production, domain harus verified di Resend
   - Untuk testing, gunakan email tujuan yang sama dengan email Resend account

3. **Check Logs**:
   ```sql
   SELECT * FROM reminder_logs WHERE status = 'failed';
   ```

### Cron job tidak berjalan

1. **Check Vercel Cron Configuration**:
   - Pastikan `vercel.json` sudah di-commit dan deployed
   - Vercel free tier: cron berjalan max 100 kali/hari

2. **Check CRON_SECRET**:
   - Pastikan `CRON_SECRET` set di Vercel environment variables

### Token tidak valid

1. **Check Token Expiry**:
   ```sql
   SELECT * FROM return_tokens WHERE expires_at < NOW();
   ```

2. **Check App URL**:
   - Pastikan `NEXT_PUBLIC_APP_URL` benar di environment variables

## 📝 Notes

- **Email Quota**: Resend free tier = 100 emails/hari. Jika lebih, upgrade ke paid plan.
- **Cron Timezone**: Vercel cron menggunakan UTC. Schedule `0 2 * * *` = 09:00 WIB.
- **Token Security**: Token one-time use dan expire dalam 7 hari.
- **User Session**: User sudah auto-login 1 tahun, token hanya untuk authorization.

## 🎯 Next Steps (Optional)

1. **Email Template Preview**: Setup React Email preview untuk development
2. **Retry Logic**: Implement retry untuk failed emails
3. **Email Analytics**: Track email open rate dengan Resend webhooks
4. **Multiple Reminders**: Send reminder setiap hari sampai barang dikembalikan
5. **Admin Dashboard**: Dashboard untuk monitor email delivery dan token usage
