import { NextRequest, NextResponse } from 'next/server'
import { sendOverdueReminderEmail } from '@/lib/email/email-service'

/**
 * Temporary endpoint to send a demo email reminder
 * POST /api/test/demo-email
 * Body: { email: string, name: string, itemName: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, itemName } = body

    if (!email || !name || !itemName) {
      return NextResponse.json({ error: 'Missing required fields: email, name, itemName' }, { status: 400 })
    }

    // Mock borrow request data for demo
    const mockRequest = {
      id: 'demo-' + Date.now(),
      items: [
        {
          name: itemName,
          quantity: 1,
          category: 'Demo Category'
        }
      ],
      startDatetime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      endDatetime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      usageLocation: 'Meeting Room A',
      daysOverdue: 1
    }

    const result = await sendOverdueReminderEmail(
      email,
      name,
      mockRequest,
      'demo-token-' + Date.now()
    )

    if (result.success) {
      return NextResponse.json({ message: 'Demo email sent successfully!', result })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
