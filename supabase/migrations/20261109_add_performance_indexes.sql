-- Performance indexes (no data or behaviour change)
--
-- borrow_requests is always listed newest first (admin pages, dashboard),
-- and filtered by status + is_permanent (stats, delete check, cron).
CREATE INDEX IF NOT EXISTS idx_borrow_requests_created_at
  ON borrow_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_borrow_requests_status_permanent
  ON borrow_requests (status, is_permanent);

-- Cron checks "already reminded today" per request
CREATE INDEX IF NOT EXISTS idx_reminder_logs_request_status_sent
  ON reminder_logs (request_id, status, sent_at);
