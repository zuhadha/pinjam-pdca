import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  sendOverdueReminderEmail,
  logReminderEmail,
  createReturnToken,
  getReturnTokenForRequest,
} from '@/lib/email/email-service'
import { generateSecureToken } from '@/lib/utils/token-utils'

/**
 * Cron job endpoint to send reminder emails for overdue borrow requests.
 * Triggered daily at 9:00 AM WIB (02:00 UTC) via Vercel Cron.
 * Protected by CRON_SECRET authorization header.
 *
 * Logic:
 * - Peminjaman 1 hari  → kirim H+1 dari end_datetime, pukul 09.00 WIB
 * - Peminjaman >1 hari → kirim H+1 dari end_datetime, pukul 09.00 WIB
 * - Kondisi: status = 'borrowed' AND return_declared_at IS NULL AND end_datetime <= NOW()
 * - Reminder hanya dikirim 1x (cek reminder_logs apakah sudah pernah ada yang 'sent')
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('CRON_SECRET not configured')
      return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron job attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create Supabase client with service role for admin access
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const now = new Date()
    console.log(`[Cron] Running at: ${now.toISOString()} (UTC)`)

    // Reminder condition:
    // - end_datetime MUST be in the past (peminjaman sudah melewati tanggal akhir)
    // - Cron berjalan pukul 09.00 WIB (02.00 UTC), jadi saat ini kita query
    //   semua request yang end_datetime-nya <= sekarang (sudah lewat).
    //   Logika H+1: cron dipanggil sehari setelah end date, maka end_datetime < now sudah cukup.
    const { data: candidateRequests, error: queryError } = await supabase
      .from('borrow_requests')
      .select(`
        id,
        start_datetime,
        end_datetime,
        usage_location,
        borrower_name,
        borrower_email,
        borrow_items (
          quantity,
          item:items (
            name,
            category:categories (name)
          )
        )
      `)
      .eq('status', 'borrowed')
      .eq('is_permanent', false)           // Skip permanent requests
      .is('return_declared_at', null)      // Belum deklarasi pengembalian
      .lt('end_datetime', now.toISOString()) // end_datetime sudah lewat

    if (queryError) {
      console.error('[Cron] Error querying borrow requests:', queryError)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    console.log(`[Cron] Found ${candidateRequests?.length || 0} candidate requests (end_datetime has passed)`)

    if (!candidateRequests || candidateRequests.length === 0) {
      return NextResponse.json({
        message: 'No overdue requests found',
        processed: 0,
        sent: 0,
        failed: 0,
      })
    }

    // Filter: hanya kirim reminder jika BELUM PERNAH ada reminder yang berhasil terkirim.
    // Reminder hanya 1x — tidak dilihat per hari, tapi per request seumur hidup.
    const requestsToRemind = []

    for (const req of candidateRequests) {
      const { data: existingReminders, error: logError } = await supabase
        .from('reminder_logs')
        .select('id')
        .eq('request_id', req.id)
        .eq('status', 'sent')
        .limit(1)

      if (logError) {
        console.warn(`[Cron] Could not check reminder_logs for request ${req.id}:`, logError.message)
        // Skip this request to be safe
        continue
      }

      if (!existingReminders || existingReminders.length === 0) {
        // Belum pernah ada reminder yang berhasil → include
        requestsToRemind.push(req)
      } else {
        console.log(`[Cron] Skipping request ${req.id} — reminder already sent`)
      }
    }

    console.log(`[Cron] ${requestsToRemind.length} requests will receive reminder email`)

    let sentCount = 0
    let failedCount = 0

    for (const req of requestsToRemind) {
      try {
        const endDate = new Date(req.end_datetime)
        const daysOverdue = Math.max(0, Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)))

        const userEmail = req.borrower_email
        const userName = req.borrower_name

        if (!userEmail) {
          console.error(`[Cron] No email for request ${req.id}`)
          failedCount++
          continue
        }

        console.log(`[Cron] Processing request ${req.id} — ${userName} <${userEmail}>, end: ${endDate.toISOString()}, overdue: ${daysOverdue}d`)

        // Format items for email
        const items = (req.borrow_items as any[]).map((bi) => ({
          name: bi.item.name,
          quantity: bi.quantity,
          category: bi.item.category?.name || 'Uncategorized',
        }))

        // Ambil token yang sudah dibuat saat peminjaman dibuat
        let token = await getReturnTokenForRequest(req.id)

        // Edge case: token tidak ada (data lama), buat baru
        if (!token) {
          console.log(`[Cron] No token found for request ${req.id}, creating new one`)
          token = generateSecureToken()
          const expiresAt = new Date()
          expiresAt.setDate(expiresAt.getDate() + 30)
          await createReturnToken(req.id, token, expiresAt)
        }

        // Kirim reminder email
        const result = await sendOverdueReminderEmail(
          userEmail,
          userName,
          {
            id: req.id,
            items,
            startDatetime: req.start_datetime,
            endDatetime: req.end_datetime,
            usageLocation: req.usage_location,
            daysOverdue,
          },
          token
        )

        if (result.success) {
          await logReminderEmail(req.id, userEmail, 'sent')
          console.log(`[Cron] ✅ Reminder sent to ${userEmail} for request ${req.id}`)
          sentCount++
        } else {
          await logReminderEmail(req.id, userEmail, 'failed', result.error)
          console.error(`[Cron] ❌ Failed to send reminder to ${userEmail}:`, result.error)
          failedCount++
        }
      } catch (error) {
        console.error(`[Cron] Error processing request ${req.id}:`, error)
        failedCount++
      }
    }

    return NextResponse.json({
      message: 'Reminder emails processed',
      processed: requestsToRemind.length,
      sent: sentCount,
      failed: failedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Unexpected error in cron job:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
