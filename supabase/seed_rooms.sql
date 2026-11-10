-- Seed: the 7 rooms from the old COE Rooms app.
-- Run this ONLY if you are not running scripts/import-rooms-from-mysql.mjs
-- (the import script brings the rooms, photos and bookings over with their old IDs).

INSERT INTO rooms (name, area, max_people, sort_order) VALUES
  ('R.Aula Chocolatos', 'Office Lt.2', 30, 1),
  ('R.Training Garuda', 'Office Lt.2 (setelah Aula Chocolatos)', 60, 2),
  ('R.Gerry', 'Office Lt.1 (sebelah Recep)', 10, 3),
  ('R.Clevo', 'Office Lt.2', 8, 4),
  ('DMS Room', 'Office Lt.2', 8, 5),
  ('R.Crunchy', 'Office Lt.2', 1, 6),
  ('R.Pilus', 'Office Lt.2', 1, 7);
