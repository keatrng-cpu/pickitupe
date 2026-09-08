-- Deposit, extra landlord addresses, and invoice tracking.
alter table bookings add column if not exists deposit_cents integer not null default 5000;
alter table bookings add column if not exists deposit_paid boolean not null default false;
alter table bookings add column if not exists deposit_session_id text;
alter table bookings add column if not exists extra_addresses text;
alter table bookings add column if not exists pack text;
alter table bookings add column if not exists stops integer not null default 1;
alter table bookings add column if not exists balance_paid boolean not null default false;
alter table bookings add column if not exists invoice_session_id text;
