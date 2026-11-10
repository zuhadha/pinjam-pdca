/**
 * Brevo transactional email sender.
 * Plain server module (not 'use server'), so it is never exposed as a callable action.
 */

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
export async function sendEmail(to: string, subject: string, htmlContent: string): Promise<string> {
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
