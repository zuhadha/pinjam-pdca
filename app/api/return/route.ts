import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Return action endpoint - Process return confirmation from email link
 * GET /api/return?token=xxx
 * Public endpoint — no auth required. Token validates authorization.
 * Token is REUSABLE — clicking multiple times is safe and idempotent.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/return-error?reason=missing_token', request.url))
    }

    // Use service role client to bypass RLS (public endpoint)
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('return_tokens')
      .select('id, request_id, expires_at')
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.redirect(new URL('/return-error?reason=invalid_token', request.url))
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(tokenData.expires_at)
    if (now > expiresAt) {
      return NextResponse.redirect(new URL('/return-error?reason=token_expired', request.url))
    }

    // Get borrow request details
    const { data: borrowRequest, error: requestError } = await supabase
      .from('borrow_requests')
      .select('id, status, borrower_name')
      .eq('id', tokenData.request_id)
      .single()

    if (requestError || !borrowRequest) {
      return NextResponse.redirect(new URL('/return-error?reason=request_not_found', request.url))
    }

    // If already returned, show success anyway (idempotent)
    if (borrowRequest.status === 'returned') {
      return NextResponse.redirect(new URL('/return-success?already=true', request.url))
    }

    // Update return_declared_at (idempotent — safe to call multiple times)
    const { error: updateError } = await supabase
      .from('borrow_requests')
      .update({
        return_declared_at: new Date().toISOString(),
      })
      .eq('id', borrowRequest.id)
      .is('return_declared_at', null) // Only update if not already declared

    if (updateError) {
      console.error('Error updating borrow request:', updateError)
      return NextResponse.redirect(new URL('/return-error?reason=update_failed', request.url))
    }

    // Create log entry (changed_by = null since this is a public action)
    await supabase.from('borrow_logs').insert({
      request_id: borrowRequest.id,
      new_status: 'awaiting_verification',
      old_status: 'borrowed',
      changed_by: null,
      notes: `${borrowRequest.borrower_name} mengkonfirmasi pengembalian via email`,
    })

    // Redirect to success page
    return NextResponse.redirect(new URL('/return-success', request.url))
  } catch (error) {
    console.error('Unexpected error in return action:', error)
    return NextResponse.redirect(new URL('/return-error?reason=unexpected_error', request.url))
  }
}
