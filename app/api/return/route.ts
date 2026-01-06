import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Return action endpoint - Process return confirmation from email link
 * GET /api/return?token=xxx
 * Public endpoint (no auth required - user already auto-logged in)
 * Token validates authorization
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/return-error?reason=missing_token', request.url))
    }

    const supabase = await createClient()

    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('return_tokens')
      .select('id, request_id, used, expires_at')
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.redirect(new URL('/return-error?reason=invalid_token', request.url))
    }

    // Check if token already used
    if (tokenData.used) {
      return NextResponse.redirect(new URL('/return-error?reason=token_used', request.url))
    }

    // Check if token expired
    const now = new Date()
    const expiresAt = new Date(tokenData.expires_at)
    if (now > expiresAt) {
      return NextResponse.redirect(new URL('/return-error?reason=token_expired', request.url))
    }

    // Get borrow request details
    const { data: borrowRequest, error: requestError } = await supabase
      .from('borrow_requests')
      .select('id, status, user_id')
      .eq('id', tokenData.request_id)
      .single()

    if (requestError || !borrowRequest) {
      return NextResponse.redirect(new URL('/return-error?reason=request_not_found', request.url))
    }

    // Check if already returned
    if (borrowRequest.status === 'returned') {
      return NextResponse.redirect(new URL('/return-success?already=true', request.url))
    }

    // Update borrow request status to indicate return declaration
    const { error: updateError } = await supabase
      .from('borrow_requests')
      .update({
        return_declared_at: new Date().toISOString(),
      })
      .eq('id', borrowRequest.id)

    if (updateError) {
      console.error('Error updating borrow request:', updateError)
      return NextResponse.redirect(new URL('/return-error?reason=update_failed', request.url))
    }

    // Mark token as used
    const { error: markUsedError } = await supabase
      .from('return_tokens')
      .update({
        used: true,
        used_at: new Date().toISOString(),
      })
      .eq('id', tokenData.id)

    if (markUsedError) {
      console.error('Error marking token as used:', markUsedError)
      // Don't fail the request, just log the error
    }

    // Create log entry
    const { error: logError } = await supabase.from('borrow_logs').insert({
      request_id: borrowRequest.id,
      new_status: 'awaiting_verification',
      old_status: borrowRequest.status,
      changed_by: borrowRequest.user_id,
      notes: 'User declared return via email reminder link',
    })

    if (logError) {
      console.error('Error creating log:', logError)
      // Don't fail the request
    }

    // Redirect to success page
    return NextResponse.redirect(new URL('/return-success', request.url))
  } catch (error) {
    console.error('Unexpected error in return action:', error)
    return NextResponse.redirect(new URL('/return-error?reason=unexpected_error', request.url))
  }
}
