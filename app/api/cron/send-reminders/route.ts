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
 * Condition: send reminder if end_datetime < start of today (WIB) AND
 *            return_declared_at IS NULL AND status = 'borrowed'
 * Uses the EXISTING return token (created at borrow time), not a new one.
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

    // --- Cek Hari Libur (Weekend) ---
    // Jangan proses reminder di hari Sabtu (6) atau Minggu (0)
    const nowWIB = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
    const dayOfWeek = nowWIB.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log('[Cron] Skipped reminder processing because today is weekend.')
      return NextResponse.json({
        message: 'Skipped on weekends',
        processed: 0,
        sent: 0,
        failed: 0,
      })
    }

    // Create Supabase client with service role for admin access
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Hitung "start of today" dalam WIB (UTC+7) menggunakan Intl.DateTimeFormat
    // agar perbandingan end_datetime konsisten dengan timezone Asia/Jakarta
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const [month, day, year] = formatter.format(now).split('/')

    const startOfTodayWIB = new Date(`${year}-${month}-${day}T00:00:00+07:00`)
    const endOfTodayWIB = new Date(`${year}-${month}-${day}T23:59:59.999+07:00`)

    // FIX #1: todayWIB digunakan untuk filter reminder_logs (bukan UTC split)
    const todayWIB = `${year}-${month}-${day}`

    console.log(`[Cron] Running at: ${now.toISOString()}`)
    console.log(`[Cron] Today WIB: ${todayWIB}`)
    console.log(`[Cron] Start of today WIB (UTC): ${startOfTodayWIB.toISOString()}`)

    // Query 1: Overdue borrow requests
    // end_datetime < startOfTodayWIB → berarti berakhir sebelum hari ini (H+1)
    // Query 2: Due today borrow requests (Hanya untuk peminjaman lebih dari 1 hari)
    // end_datetime >= startOfTodayWIB AND end_datetime <= endOfTodayWIB
    // Both queries are independent, so they run in parallel.
    const [
      { data: overdueRequests, error: queryError },
      { data: dueTodayRequests, error: dueTodayQueryError },
    ] = await Promise.all([
      supabase
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
        .eq('is_permanent', false) // Skip permanent requests
        .is('return_declared_at', null) // Hanya jika user belum deklarasi pengembalian
        .lt('end_datetime', startOfTodayWIB.toISOString()), // H+1: end_datetime sebelum hari ini
      supabase
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
        .eq('is_permanent', false) // Skip permanent requests
        .eq('is_same_day', false) // Hanya untuk peminjaman lebih dari 1 hari
        .is('return_declared_at', null) // Hanya jika user belum deklarasi pengembalian
        .gte('end_datetime', startOfTodayWIB.toISOString())
        .lte('end_datetime', endOfTodayWIB.toISOString()),
    ])

    if (queryError) {
      console.error('[Cron] Error querying overdue requests:', queryError)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    if (dueTodayQueryError) {
      console.error('[Cron] Error querying due today requests:', dueTodayQueryError)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    const allRequestsToProcess = [...(overdueRequests || []), ...(dueTodayRequests || [])]

    console.log(`[Cron] Found ${overdueRequests?.length || 0} overdue requests and ${dueTodayRequests?.length || 0} due today requests to evaluate`)

    if (allRequestsToProcess.length === 0) {
      return NextResponse.json({
        message: 'No requests found to process',
        processed: 0,
        sent: 0,
        failed: 0,
      })
    }

    // Filter: hanya kirim ke request yang belum dapat reminder hari ini (WIB)
    // FIX #1: gunakan todayWIB + offset +07:00, bukan UTC midnight
    // One query for all candidates instead of one query per request
    const { data: todayLogs } = await supabase
      .from('reminder_logs')
      .select('request_id')
      .in('request_id', allRequestsToProcess.map((req) => req.id))
      .eq('status', 'sent')
      .gte('sent_at', `${todayWIB}T00:00:00+07:00`) // FIX: pakai WIB midnight

    const remindedToday = new Set((todayLogs || []).map((log) => log.request_id))
    const requestsToRemind = allRequestsToProcess.filter((req) => !remindedToday.has(req.id))

    console.log(`[Cron] ${requestsToRemind.length} requests need reminder today`)

    let sentCount = 0
    let failedCount = 0

    for (const req of requestsToRemind) {
      try {
        const endDate = new Date(req.end_datetime)

        // FIX #2: hitung daysOverdue berdasarkan hari kalender WIB, bukan selisih jam
        // Ambil tanggal end_datetime dalam WIB
        const endFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Jakarta',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
        const [endMonth, endDay, endYear] = endFormatter.format(endDate).split('/')
        const startOfEndDateWIB = new Date(`${endYear}-${endMonth}-${endDay}T00:00:00+07:00`)

        // Selisih hari kalender (bukan jam)
        const daysOverdue = Math.round(
          (startOfTodayWIB.getTime() - startOfEndDateWIB.getTime()) / (1000 * 60 * 60 * 24)
        )

        const userEmail = req.borrower_email
        const userName = req.borrower_name

        if (!userEmail) {
          console.error(`[Cron] No email for request ${req.id}`)
          failedCount++
          continue
        }

        // Format items untuk email
        const items = (req.borrow_items as any[]).map((bi) => ({
          name: bi.item.name,
          quantity: bi.quantity,
          category: bi.item.category?.name || 'Uncategorized',
        }))

        // Reuse token yang sudah ada (dibuat saat borrow)
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
          sentCount++
          console.log(`[Cron] Reminder sent for request ${req.id} (${daysOverdue} day(s) overdue)`)
        } else {
          await logReminderEmail(req.id, userEmail, 'failed', result.error)
          failedCount++
          console.error(`[Cron] Failed to send reminder for request ${req.id}:`, result.error)
        }
      } catch (error) {
        console.error(`[Cron] Error processing request ${req.id}:`, error)
        failedCount++
      }
    }

    console.log(`[Cron] Done. Sent: ${sentCount}, Failed: ${failedCount}`)

    return NextResponse.json({
      message: 'Reminder emails processed',
      processed: requestsToRemind.length,
      sent: sentCount,
      failed: failedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}