-- Everything the owner needs to quote and route a job without a callback:
-- the size the customer picked, the instant estimate they were shown, where
-- the house actually is, and how urgent it is against the city vacuum window.

alter table bookings add column if not exists urgency text;
alter table bookings add column if not exists job_size text;
alter table bookings add column if not exists add_ons text;
alter table bookings add column if not exists estimate_low integer;
alter table bookings add column if not exists estimate_high integer;
alter table bookings add column if not exists lat double precision;
alter table bookings add column if not exists lon double precision;
alter table bookings add column if not exists area_tier text;
alter table bookings add column if not exists neighbor_of text;

-- Routing view: same-day work grouped by block is the whole margin story.
create index if not exists bookings_preferred_date_idx
  on bookings (preferred_date);
