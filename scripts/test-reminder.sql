-- SQL to create a test overdue borrow request
-- Replace USER_ID and ITEM_ID with actual values from your database

-- 1. Find a user and an item
-- SELECT id, email FROM users LIMIT 1;
-- SELECT id, name FROM items LIMIT 1;

-- 2. Create the overdue request
INSERT INTO borrow_requests (
    user_id,
    start_datetime,
    end_datetime,
    usage_location,
    purpose,
    status,
    is_permanent
) VALUES (
    'replace-with-user-id', -- user_id
    NOW() - INTERVAL '3 days', -- start_datetime
    NOW() - INTERVAL '1 day',  -- end_datetime (overdue)
    'Test Location',
    'Testing reminder system',
    'borrowed',
    false
) RETURNING id;

-- 3. Add an item to the request (replace REQUEST_ID and ITEM_ID)
-- INSERT INTO borrow_items (request_id, item_id, quantity) 
-- VALUES ('replace-with-request-id', 'replace-with-item-id', 1);
