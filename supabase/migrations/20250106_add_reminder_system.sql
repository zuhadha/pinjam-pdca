-- Migration: Add Email Reminder System
-- Created: 2025-01-06
-- Purpose: Add tables for tracking reminder emails and secure return tokens

-- Table: reminder_logs
-- Purpose: Track all reminder emails sent to users
CREATE TABLE reminder_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES borrow_requests(id) ON DELETE CASCADE NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  email_to TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: return_tokens
-- Purpose: Secure one-time tokens for quick return action from email
-- Note: Token is for authorization/security, not authentication (users already auto-login for 1 year)
CREATE TABLE return_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES borrow_requests(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  used BOOLEAN DEFAULT false NOT NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_reminder_logs_request_id ON reminder_logs(request_id);
CREATE INDEX idx_reminder_logs_sent_at ON reminder_logs(sent_at);
CREATE INDEX idx_reminder_logs_status ON reminder_logs(status);

CREATE INDEX idx_return_tokens_token ON return_tokens(token);
CREATE INDEX idx_return_tokens_request_id ON return_tokens(request_id);
CREATE INDEX idx_return_tokens_used ON return_tokens(used);
CREATE INDEX idx_return_tokens_expires_at ON return_tokens(expires_at);

-- Row Level Security (RLS) Policies
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_tokens ENABLE ROW LEVEL SECURITY;

-- Reminder logs policies
-- Users can view logs for their own requests
CREATE POLICY "Allow users to view own reminder logs" ON reminder_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM borrow_requests
      WHERE id = request_id AND user_id = auth.uid()
    )
  );

-- Admins can view all logs
CREATE POLICY "Allow admins to view all reminder logs" ON reminder_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role can insert logs (for cron job)
CREATE POLICY "Allow service role to insert reminder logs" ON reminder_logs
  FOR INSERT WITH CHECK (true);

-- Return tokens policies
-- Tokens are accessed via API without RLS (validated in application code)
-- But we still enable RLS for extra security

-- Service role can manage tokens
CREATE POLICY "Allow service role to manage return tokens" ON return_tokens
  FOR ALL USING (true);

-- Add helpful comments
COMMENT ON TABLE reminder_logs IS 'Tracks all reminder emails sent for overdue borrow requests';
COMMENT ON TABLE return_tokens IS 'Secure one-time tokens for quick return confirmation from email links';

COMMENT ON COLUMN reminder_logs.status IS 'Email delivery status: sent, failed, or bounced';
COMMENT ON COLUMN return_tokens.token IS 'Secure random token included in email CTA link';
COMMENT ON COLUMN return_tokens.used IS 'Whether token has been used (one-time use only)';
COMMENT ON COLUMN return_tokens.expires_at IS 'Token expiration datetime (7 days from creation)';
