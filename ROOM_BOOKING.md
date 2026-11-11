# Room booking module

Room booking from the old Laravel app (`garudafood-space`, "COE Rooms") now lives inside INVENSA.

## What it does

- **Book a room for one day** with the form at the top of `/rooms`. No login and no admin approval. Clicking an empty slot in the calendar below fills the form's room, date and time. Old `/rooms/book` links redirect there.
- **Repeat a booking** daily (optionally skipping weekends), weekly on chosen weekdays, or monthly on the same date. A month without that date uses its last day. A series ends on a date or after a number of times (max 100 dates, max 1 year).
- **Waiting list.** If the room is already booked at that time, the new booking is saved as `waitlisted`, not rejected. For a repeating booking, each date is checked on its own: free dates are confirmed and only clashing dates wait.
- **Live availability.** While filling the form, the borrower sees every date marked free or waiting, and what it clashes with.
- **Booking ulang.** Click a booking in the calendar, then "Booking ulang": the form is filled with that booking's room, time, borrower, contact, agenda, participants, notes and repeat type. Only the date is left to choose. Admins get the same button in their booking modal (it opens `/rooms?rebook=<id>`).
- **Calendar search** (public and admin): filters the calendar by agenda, borrower, department or room as you type. Calendar navigation and filters keep the page's scroll position.
- **Calendar** under the form on `/rooms`: day (one column per room, hours down), week and month views, filtered by room. Waitlisted bookings show with a dashed outline. In week and month views, consecutive days of one booking (same room, time and status, e.g. an audit on 12–14 Nov) are drawn as one item: in week view one block across its days at its real time, in month view one bar. The popup of a repeating booking lists all its dates (e.g. Kam 12, Jum 13, Sen 16 Nov 2026), even where a gap such as a weekend splits the blocks. Phone and email are never shown publicly.
- **Borrower's page** at `/rooms/booking/<token>` (the link is also emailed): see every date, its status and queue position, and cancel some or all upcoming dates.
- **Dashboard ruangan** on the admin home (`/admin`, "Dashboard Admin"), below the item dashboard. The period filter at the top (year, months, weeks, monthly/weekly trend) drives both. Counts confirmed bookings by the day the room is used: cards (total bookings, total booked room-days, today, this week, this month), trend line, top 3 rooms, top 3 departments, room share pie (top 4 + Lainnya), and an hour-by-room heatmap (08:00–17:00).
- **Admin pages** (in the sidebar):
  - **Kelola Booking Ruangan** (`/admin/room-bookings`): the waiting list (who waits, who they wait behind, WhatsApp links; "Konfirmasi" when the slot is free) and the schedule. Click a booking to see contacts and to:
    - **Ubah**: move it to another room, date or time. For a repeating booking, choose this date only (room, date, time) or this and later dates (room and time). A live check shows clashes; a clashing confirmed date can be saved to the waiting list. Optional email to the borrower.
    - **Batalkan**: cancel one date, or this date and all later ones, and confirm someone from the waiting list in the same step.
    - **Booking ulang**: open the public form filled with this booking.
  - **Kelola Ruangan** (`/admin/rooms`): room list with search and status/location filters, create (`/admin/rooms/create`) and edit (`/admin/rooms/edit/<id>`) pages with photos, in the same layout as Kelola Barang. Delete is soft and refused while a room has upcoming bookings.
  - Old `/admin?section=rooms` links redirect to Kelola Booking Ruangan.
- **Emails** (Brevo, same as item borrowing): borrower confirmation, admin notification, "you're off the waiting list", "cancelled by admin", and an admin alert when a borrower frees a slot that has people waiting. Admin recipients come from the existing `admin_notification_emails` setting.

## Setup

1. Run `supabase/migrations/20261110_add_room_booking.sql` in the Supabase SQL editor.
   It enables `btree_gist`, creates the four tables and the `room-images` storage bucket.
2. Load data with **one** of these:
   - Import from the old MySQL database (recommended, see below), or
   - Run `supabase/seed_rooms.sql` for the 7 rooms only.
3. Deploy. No new environment variables.

## Importing from the old MySQL database

```bash
# Easiest: the .sql file exported from phpMyAdmin (XAMPP)
node scripts/import-rooms-from-mysql.mjs --sql ~/Downloads/coe.sql \
  --images-dir ../garudafood-space/public/rooms --dry-run

# Option A: straight from MySQL
npm i -D mysql2
node scripts/import-rooms-from-mysql.mjs --mysql "mysql://user:pass@host:3306/coe" \
  --images-dir ../garudafood-space/public/rooms --dry-run

# Option B: from a phpMyAdmin JSON export of rooms, room_images, borrow_rooms
node scripts/import-rooms-from-mysql.mjs --json ~/Downloads/coe.json \
  --images-dir ../garudafood-space/public/rooms --dry-run
```

Remove `--dry-run` to write. Add `--from 2026-01-01` to skip older bookings. The script:

- keeps every old MySQL id in a `legacy_id` column, so it is safe to re-run (already imported rows are skipped);
- takes over a seeded room with the same name instead of creating a duplicate;
- maps `admin_approval_status` 1 to confirmed, 2 to cancelled, anything else to waitlisted, and room `status` 3 to maintenance;
- turns each parent booking and its recurring instances into one reservation with many dates;
- stores an old booking that overlaps an earlier confirmed one as waitlisted, and lists it in the report;
- uploads photos from `--images-dir` to the `room-images` bucket.

Old bookings have no email, so their borrowers get no emails or manage link. Admin can still manage them.

## Data model

| Table | One row per | Old MySQL source |
| --- | --- | --- |
| `rooms` | room | `rooms` |
| `room_images` | photo | `room_images` |
| `room_reservations` | form submission: borrower, agenda, repeat rule, manage token | `borrow_rooms` parent rows |
| `room_bookings` | date of a reservation: room, time, status | `borrow_rooms` + recurring instances |

- Times are Jakarta wall-clock `DATE` + `TIME`, as in MySQL.
- `room_bookings_no_overlap` (an exclusion constraint) makes two confirmed bookings of one room at overlapping times impossible, even with simultaneous submissions.
- `create_room_reservation()` inserts a reservation and its dates in one transaction. Each date falls back to `waitlisted` when the constraint fires.
- Cancelling sets `status = 'cancelled'`; rows are kept as history.
- RLS is on with no policies. Only server code using the service role reads and writes.

## Settings in code

`lib/rooms/constants.ts`: bookable hours (08:00–17:00), 30-minute steps, repeat limits, department suggestions.
