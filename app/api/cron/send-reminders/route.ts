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
 * Condition: send reminder if end_datetime < start of today AND
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

    // Calculate "Start of today" in WIB (UTC+7) to find requests that ended before today
    // This ensures reminder is sent on H+1 (the day after the borrow ends)
    // Vercel runs on UTC, so we must explicitly use Asia/Jakarta timezone
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const [month, day, year] = formatter.format(now).split('/')
    const startOfTodayWIB = new Date(`${year}-${month}-${day}T00:00:00+07:00`)

    // Query overdue borrow requests
    const { data: overdueRequests, error: queryError } = await supabase
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
      .is('return_declared_at', null) // Only if user hasn't declared return yet
      .lt('end_datetime', startOfTodayWIB.toISOString()) // H+1: end_datetime was before today

    if (queryError) {
      console.error('Error querying overdue requests:', queryError)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    console.log(`[Cron] Found ${overdueRequests?.length || 0} overdue requests to remind`)

    if (!overdueRequests || overdueRequests.length === 0) {
      return NextResponse.json({
        message: 'No overdue requests found',
        processed: 0,
        sent: 0,
        failed: 0,
      })
    }

    // Filter out requests that already received a reminder today
    const today = new Date().toISOString().split('T')[0]
    const requestsToRemind = []

    for (const req of overdueRequests) {
      const { data: todayLogs } = await supabase
        .from('reminder_logs')
        .select('id')
        .eq('request_id', req.id)
        .eq('status', 'sent')
        .gte('sent_at', `${today}T00:00:00Z`)
        .limit(1)

      if (!todayLogs || todayLogs.length === 0) {
        requestsToRemind.push(req)
      }
    }

    let sentCount = 0
    let failedCount = 0

    for (const req of requestsToRemind) {
      try {
        const endDate = new Date(req.end_datetime)
        const now = new Date()
        const daysOverdue = Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))

        const userEmail = req.borrower_email
        const userName = req.borrower_name

        if (!userEmail) {
          console.error(`No email for request ${req.id}`)
          failedCount++
          continue
        }

        // Format items for email
        const items = (req.borrow_items as any[]).map((bi) => ({
          name: bi.item.name,
          quantity: bi.quantity,
          category: bi.item.category?.name || 'Uncategorized',
        }))

        // Reuse the existing token (created at borrow time)
        let token = await getReturnTokenForRequest(req.id)

        // Edge case: token doesn't exist (old data), create one
        if (!token) {
          console.log(`[Cron] No token found for request ${req.id}, creating new one`)
          token = generateSecureToken()
          const expiresAt = new Date()
          expiresAt.setDate(expiresAt.getDate() + 30)
          await createReturnToken(req.id, token, expiresAt)
        }

        // Send reminder email
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
        } else {
          await logReminderEmail(req.id, userEmail, 'failed', result.error)
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
