'use server'

import { render } from '@react-email/components'
import OverdueReminderEmail from './templates/overdue-reminder-email'
import BorrowConfirmationEmail from './templates/borrow-confirmation-email'
import AdminBorrowNotificationEmail from './templates/admin-borrow-notification-email'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

import { sendEmail } from './brevo'

// ─── Public interfaces ────────────────────────────────────────────────────────

export interface BorrowItemData {
  name: string
  quantity: number
  category: string
}

export interface BorrowRequestData {
  id: string
  items: BorrowItemData[]
  startDatetime: string
  endDatetime: string
  usageLocation: string
  daysOverdue: number
}

export interface SendReminderEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface AdminBorrowNotificationParams {
  adminEmails: string[]       // List of admin emails to notify
  borrowerName: string
  borrowerEmail: string
  borrowerDivision: string
  items: BorrowItemData[]
  startDatetime: string | null
  endDatetime: string | null
  usageLocation: string
  purpose: string
  isPermanent: boolean
  requestId: string
}

/** Helper: pause execution for `ms` milliseconds */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── Email senders ────────────────────────────────────────────────────────────

/**
 * Send borrow confirmation email to borrower when request is created.
 * Includes a return button that becomes active when they are ready to return.
 */
export async function sendBorrowConfirmationEmail(params: {
  borrowerEmail: string
  borrowerName: string
  borrowerDivision: string
  items: BorrowItemData[]
  startDatetime: string | null
  endDatetime: string | null
  usageLocation: string
  purpose: string
  isPermanent: boolean
  returnToken: string
}): Promise<SendReminderEmailResult> {
  try {
    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    const returnUrl = `${appUrl}/api/return?token=${params.returnToken}`

    const formatDate = (dt: string | null) => {
      if (!dt) return '-'
      return new Date(dt).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    console.log(`[Email] Sending confirmation email to: ${params.borrowerEmail}`)

    const emailHtml = await render(
      BorrowConfirmationEmail({
        borrowerName: params.borrowerName,
        borrowerDivision: params.borrowerDivision,
        items: params.items,
        startDate: formatDate(params.startDatetime),
        endDate: formatDate(params.endDatetime),
        usageLocation: params.usageLocation,
        purpose: params.purpose,
        isPermanent: params.isPermanent,
        returnUrl,
      })
    )

    console.log('[Email] React-Email rendering: SUCCESS')

    const subject = params.isPermanent
      ? `✅ Permintaan Barang Berhasil — ${params.borrowerName}`
      : `✅ Peminjaman Barang Berhasil — ${params.borrowerName}`

    const messageId = await sendEmail(params.borrowerEmail, subject, emailHtml)

    return { success: true, messageId }
  } catch (error) {
    console.error('❌ Unexpected error in sendBorrowConfirmationEmail:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send overdue reminder email to borrower.
 * Reuses the existing return token created at borrow time.
 */
export async function sendOverdueReminderEmail(
  userEmail: string,
  userName: string,
  borrowRequest: BorrowRequestData,
  returnToken: string
): Promise<SendReminderEmailResult> {
  try {
    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    const returnUrl = `${appUrl}/api/return?token=${returnToken}`

    const startDate = new Date(borrowRequest.startDatetime).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const endDate = new Date(borrowRequest.endDatetime).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const emailHtml = await render(
      OverdueReminderEmail({
        userName,
        items: borrowRequest.items,
        startDate,
        endDate,
        usageLocation: borrowRequest.usageLocation,
        daysOverdue: borrowRequest.daysOverdue,
        returnUrl,
      })
    )

    const subject =
      borrowRequest.daysOverdue > 0
        ? `⚠️ Peringatan: Pengembalian Barang Terlambat ${borrowRequest.daysOverdue} Hari`
        : `ℹ️ Pengingat: Batas Waktu Pengembalian Barang Hari Ini`

    const messageId = await sendEmail(userEmail, subject, emailHtml)

    return { success: true, messageId }
  } catch (error) {
    console.error('Unexpected error sending reminder email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send borrow notification email to all admin emails.
 * Adds a configurable delay before each send to avoid spam flags.
 * Should be called AFTER sendBorrowConfirmationEmail.
 *
 * @param delayMs - milliseconds to wait before sending (default 5000 = 5s)
 */
export async function sendAdminBorrowNotificationEmail(
  params: AdminBorrowNotificationParams,
  delayMs = 5000
): Promise<SendReminderEmailResult[]> {
  if (!params.adminEmails || params.adminEmails.length === 0) {
    console.log('[Email] No admin notification emails configured, skipping.')
    return []
  }

  const formatDate = (dt: string | null) => {
    if (!dt) return '-'
    return new Date(dt).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const subject = params.isPermanent
    ? `[INVENSA] Permintaan Barang Baru — ${params.borrowerName} (${params.borrowerDivision})`
    : `[INVENSA] Peminjaman Barang Baru — ${params.borrowerName} (${params.borrowerDivision})`

  const results: SendReminderEmailResult[] = []

  for (let i = 0; i < params.adminEmails.length; i++) {
    const adminEmail = params.adminEmails[i]

    try {
      // Add delay before each admin email to reduce spam risk
      if (i === 0) {
        console.log(`[Email] Waiting ${delayMs}ms before sending admin notification...`)
        await delay(delayMs)
      } else {
        // Small gap between multiple admin recipients
        await delay(1500)
      }

      const emailHtml = await render(
        AdminBorrowNotificationEmail({
          borrowerName: params.borrowerName,
          borrowerEmail: params.borrowerEmail,
          borrowerDivision: params.borrowerDivision,
          items: params.items,
          startDate: formatDate(params.startDatetime),
          endDate: formatDate(params.endDatetime),
          usageLocation: params.usageLocation,
          purpose: params.purpose,
          isPermanent: params.isPermanent,
          requestId: params.requestId,
        })
      )

      console.log(`[Email] Sending admin notification to: ${adminEmail}`)
      const messageId = await sendEmail(adminEmail, subject, emailHtml)
      results.push({ success: true, messageId })
    } catch (error) {
      console.error(`[Email] Failed to send admin notification to ${adminEmail}:`, error)
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return results
}

// ─── Database helpers (unchanged) ─────────────────────────────────────────────

/**
 * Log reminder email attempt to database
 */
export async function logReminderEmail(
  requestId: string,
  emailTo: string,
  status: 'sent' | 'failed',
  errorMessage?: string
) {
  const supabase = createServiceRoleClient()

  const { error } = await supabase.from('reminder_logs').insert({
    request_id: requestId,
    email_to: emailTo,
    status,
    error_message: errorMessage,
    sent_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Error logging reminder email:', error)
  }
}

/**
 * Create a reusable return token for a borrow request.
 * Token is created at borrow time and valid until end_datetime + 30 days.
 * Token is reusable — clicking multiple times is idempotent.
 */
export async function createReturnToken(
  requestId: string,
  token: string,
  expiresAt: Date
): Promise<boolean> {
  const supabase = createServiceRoleClient()

  const { error } = await supabase.from('return_tokens').insert({
    request_id: requestId,
    token,
    expires_at: expiresAt.toISOString(),
  })

  if (error) {
    console.error('Error creating return token:', error)
    return false
  }

  return true
}

/**
 * Get the existing return token for a borrow request.
 * Returns null if no token exists.
 */
export async function getReturnTokenForRequest(requestId: string): Promise<string | null> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('return_tokens')
    .select('token')
    .eq('request_id', requestId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return data.token
}
