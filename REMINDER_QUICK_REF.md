# Email Reminder - Quick Reference

## 🚀 Quick Deploy Steps

1. **Apply Database Migrations**
   ```sql
   -- Run in Supabase SQL Editor:
   -- 1. migrations/20250106_add_user_email.sql
   -- 2. migrations/20250106_add_reminder_system.sql
   ```

2. **Setup Resend**
   - Sign up: https://resend.com
   - Get API key
   - Verify domain (or use sandbox)

3. **Set Environment Variables in Vercel**
   ```
   RESEND_API_KEY=re_xxxxx
   CRON_SECRET=[generate with: openssl rand -hex 32]
   NEXT_PUBLIC_APP_URL=https://yourdomain.vercel.app
   ```

4. **Update User Emails**
   ```sql
   UPDATE users SET email = 'real@email.com' WHERE username = 'xxx';
   ```

5. **Deploy**
   ```bash
   git add .
   git commit -m "feat: email reminder system"
   git push
   ```

6. **Verify in Vercel**
   - Check Settings > Cron Jobs
   - Should see: `/api/cron/send-reminders` at `0 2 * * *`

## 🧪 Testing

### Manual Trigger
```bash
curl https://yourdomain.vercel.app/api/cron/send-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Create Test Overdue
```sql
UPDATE borrow_requests 
SET end_datetime = NOW() - INTERVAL '1 day'
WHERE id = 'some-request-id';
```

## 📁 Files Created

**Database:**
- `migrations/20250106_add_user_email.sql`
- `migrations/20250106_add_reminder_system.sql`

**Email:**
- `lib/email/email-service.ts`
- `lib/email/templates/overdue-reminder-email.tsx`

**API:**
- `app/api/cron/send-reminders/route.ts`
- `app/api/return/route.ts`

**Pages:**
- `app/return-success/page.tsx`
- `app/return-error/page.tsx`

**Utils:**
- `lib/utils/token-utils.ts`

**Config:**
- `vercel.json`

**Docs:**
- `REMINDER_SETUP.md` (full guide)

## ⚙️ How It Works

1. **Daily at 9:00 AM WIB**: Vercel Cron triggers `/api/cron/send-reminders`
2. **Query**: Find overdue requests (status='borrowed', end < now)
3. **Generate**: Create secure token for each request
4. **Send**: Email via Resend with CTA link
5. **Log**: Record to `reminder_logs` table
6. **User Clicks**: Link goes to `/api/return?token=xxx`
7. **Validate**: Check token valid, not used, not expired
8. **Update**: Mark `return_declared_at` on borrow request
9. **Redirect**: Success or error page

## 🔧 Configuration

**Cron Schedule:** `0 2 * * *` = 09:00 WIB (02:00 UTC)

**Token Expiry:** 7 days

**Email Quota:** Resend free tier = 100/day

**Sender:** Update in `lib/email/email-service.ts` line 42

## 📊 Monitoring

```sql
-- Today's emails
SELECT status, COUNT(*) 
FROM reminder_logs 
WHERE sent_at::date = CURRENT_DATE 
GROUP BY status;

-- Failed emails
SELECT * FROM reminder_logs 
WHERE status = 'failed' 
ORDER BY sent_at DESC 
LIMIT 10;
```

## 🎯 Next Steps After Deploy

1. ✅ Test with 1 overdue request
2. ✅ Verify email received
3. ✅ Test CTA link works
4. ✅ Check database logs
5. ✅ Wait for first real cron (tomorrow 9 AM)
6. ✅ Monitor Vercel function logs
