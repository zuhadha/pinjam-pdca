'use server'

import { Resend } from 'resend'
import { render } from '@react-email/components'
import OverdueReminderEmail from './templates/overdue-reminder-email'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

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

/**
 * Send overdue reminder email to user
 * @param userEmail - Recipient email address
 * @param userName - Recipient name
 * @param borrowRequest - Borrow request data
 * @param returnToken - Secure token for return action
 * @returns Result with success status and message ID or error
 */
export async function sendOverdueReminderEmail(
  userEmail: string,
  userName: string,
  borrowRequest: BorrowRequestData,
  returnToken: string
): Promise<SendReminderEmailResult> {
  try {
    // Get app URL from environment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const returnUrl = `${appUrl}/api/return?token=${returnToken}`

    // Format dates for display
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

    // Render email template
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

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Resend default email (no domain needed)
      to: [userEmail],
      subject: `⚠️ Pengingat: Pengembalian Barang Terlambat ${borrowRequest.daysOverdue} Hari`,
      html: emailHtml,
    })

    if (error) {
      console.error('Error sending email via Resend:', error)
      return {
        success: false,
        error: error.message || 'Failed to send email',
      }
    }

    return {
      success: true,
      messageId: data?.id,
    }
  } catch (error) {
    console.error('Unexpected error sending reminder email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Log reminder email attempt to database
 * @param requestId - Borrow request ID
 * @param emailTo - Recipient email
 * @param status - Email status (sent, failed)
 * @param errorMessage - Optional error message
 */
export async function logReminderEmail(
  requestId: string,
  emailTo: string,
  status: 'sent' | 'failed',
  errorMessage?: string
) {
  const supabase = await createClient()

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
 * Create return token for borrow request
 * @param requestId - Borrow request ID
 * @param token - Secure token string
 * @param expiresAt - Token expiration date
 * @returns Success status
 */
export async function createReturnToken(
  requestId: string,
  token: string,
  expiresAt: Date
): Promise<boolean> {
  const supabase = await createClient()

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
