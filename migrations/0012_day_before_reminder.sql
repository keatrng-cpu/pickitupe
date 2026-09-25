-- Day-before reminder: stamped when the 5 pm reminder goes out so a retried
-- or doubled cron run never sends a customer two. Moving the job clears it
-- (care.ts moveMyDay) so the new day gets its own reminder.
-- Mirrored in ensureOwnerTables().
alter table bookings add column if not exists reminded_at timestamptz;
