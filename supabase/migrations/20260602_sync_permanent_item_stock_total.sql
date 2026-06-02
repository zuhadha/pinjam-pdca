-- Keep requestable/permanent item base stock aligned with the stock that remains.
-- Older permanent requests only reduced stock_available, so admin edit screens
-- still showed the original stock_total. Requestable items are consumed rather
-- than returned, so their current base quantity should match stock_available.

UPDATE items
SET stock_total = stock_available
WHERE is_borrowable = false
  AND stock_total <> stock_available;
