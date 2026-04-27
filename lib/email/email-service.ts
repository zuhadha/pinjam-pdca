'use server'

import { render } from '@react-email/components'
import OverdueReminderEmail from './templates/overdue-reminder-email'
import BorrowConfirmationEmail from './templates/borrow-confirmation-email'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

// ─── Brevo API config ────────────────────────────────────────────────────────

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

/** Sender that appears in all outgoing emails */
const FROM_SENDER = {
  name: 'INVENSA',
  email: process.env.BREVO_SENDER_EMAIL || 'no-reply@invensa.id',
}

/**
 * Low-level helper: POST a single email via Brevo Transactional Email API.
 * Uses native fetch — no external SMTP dependency, no artificial delays.
 *
 * Brevo API docs: https://developers.brevo.com/reference/sendtransacemail
 */
async function sendEmail(to: string, subject: string, htmlContent: string): Promise<string> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    throw new Error('❌ Missing BREVO_API_KEY environment variable')
  }

  const body = JSON.stringify({
    sender: FROM_SENDER,
    to: [{ email: to }],
    subject,
    htmlContent,
  })

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body,
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[Email] Brevo API error (${response.status}):`, errorText)
    throw new Error(`Brevo API returned ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const messageId: string = data.messageId ?? data.messageId ?? '(no-id)'
  console.log(`[Email] Sent to ${to} | messageId: ${messageId}`)
  return messageId
}

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
        : `ℹ️ Pengingat: Status Barang Sedang Dipinjam`

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
