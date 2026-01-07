import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendOverdueReminderEmail, logReminderEmail, createReturnToken } from '@/lib/email/email-service'
import { generateSecureToken, getTokenExpiration } from '@/lib/utils/token-utils'

/**
 * Cron job endpoint to send reminder emails for overdue borrow requests
 * Called by Vercel Cron daily at 9:00 AM WIB (02:00 UTC)
 * Protected by CRON_SECRET authorization header
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
    // Use service role key to bypass RLS policies for cron job
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Query overdue borrow requests
    // Only send one reminder per day per request
    const { data: overdueRequests, error: queryError } = await supabase
      .from('borrow_requests')
      .select(`
        id,
        start_datetime,
        end_datetime,
        usage_location,
        user_id,
        users!borrow_requests_user_id_fkey!inner (
          id,
          name,
          email
        ),
        borrow_items (
          quantity,
          item:items (
            name,
            category:categories (
              name
            )
          )
        )
      `)
      .eq('status', 'borrowed')
      .eq('is_permanent', false) // Skip permanent requests - no reminder needed
      .lt('end_datetime', new Date().toISOString())

    if (queryError) {
      console.error('Error querying overdue requests:', queryError)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    console.log(`[DEBUG] Found ${overdueRequests?.length || 0} overdue requests from database`)
    console.log('[DEBUG] Query filter: status=borrowed, end_datetime <', new Date().toISOString())

    if (!overdueRequests || overdueRequests.length === 0) {
      console.log('[DEBUG] No overdue requests found after query')
      return NextResponse.json({
        message: 'No overdue requests found',
        processed: 0,
        sent: 0,
        failed: 0
      })
    }

    // Filter out requests that already received a reminder today
    const today = new Date().toISOString().split('T')[0]
    const requestsToRemind = []

    for (const request of overdueRequests) {
      const { data: todayLogs } = await supabase
        .from('reminder_logs')
        .select('id')
        .eq('request_id', request.id)
        .eq('status', 'sent')
        .gte('sent_at', `${today}T00:00:00Z`)
        .limit(1)

      if (!todayLogs || todayLogs.length === 0) {
        requestsToRemind.push(request)
      }
    }

    let sentCount = 0
    let failedCount = 0

    // Process each overdue request
    for (const request of requestsToRemind) {
      try {
        // Calculate days overdue
        const endDate = new Date(request.end_datetime)
        const now = new Date()
        const daysOverdue = Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))

        // Get user email from database
        const user = Array.isArray(request.users) ? request.users[0] : request.users
        const userEmail = user.email
        const userName = user.name

        // Format items for email
        const items = request.borrow_items.map((bi: any) => ({
          name: bi.item.name,
          quantity: bi.quantity,
          category: bi.item.category?.name || 'Uncategorized',
        }))

        // Generate secure return token
        const token = generateSecureToken()
        const expiresAt = getTokenExpiration()

        // Create return token in database
        const tokenCreated = await createReturnToken(request.id, token, expiresAt)

        if (!tokenCreated) {
          console.error(`Failed to create return token for request ${request.id}`)
          await logReminderEmail(request.id, userEmail, 'failed', 'Failed to create return token')
          failedCount++
          continue
        }

        // Send reminder email
        const result = await sendOverdueReminderEmail(
          userEmail,
          userName,
          {
            id: request.id,
            items,
            startDatetime: request.start_datetime,
            endDatetime: request.end_datetime,
            usageLocation: request.usage_location,
            daysOverdue,
          },
          token
        )

        // Log the email attempt
        if (result.success) {
          await logReminderEmail(request.id, userEmail, 'sent')
          sentCount++
        } else {
          await logReminderEmail(request.id, userEmail, 'failed', result.error)
          failedCount++
        }
      } catch (error) {
        console.error(`Error processing request ${request.id}:`, error)
        failedCount++
      }
    }

    // Return summary
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
