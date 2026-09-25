-- Customer care: a private manage link per booking, support tickets opened by
-- the concierge (or the customer directly), and first-party reviews with photos.
--
-- Mirrored in ensureOwnerTables() (src/lib/owner-schema.ts) — the Netlify
-- build never runs this file, so change both or neither.

-- One unguessable token per booking. It is the customer's key to /my/<token>:
-- see the day, move it, ask for a change, leave a review. Replaces the old
-- phone-number lookup, which showed any booking to anyone who typed its phone.
alter table bookings add column if not exists manage_token text;
create unique index if not exists bookings_manage_token_idx on bookings (manage_token);

create table if not exists support_tickets (
  id          serial primary key,
  booking_id  integer references bookings (id) on delete set null,
  -- reschedule | cancel | change | complaint | question | praise | other
  kind        text not null,
  -- low | normal | high  (high = unhappy customer or a job in the next 48 h)
  urgency     text not null default 'normal',
  summary     text not null,
  name        text,
  phone       text,
  email       text,
  -- 'concierge' (the AI box) | 'manage' (a button on /my) | 'review' (a low rating)
  channel     text not null default 'concierge',
  transcript  jsonb,
  status      text not null default 'open',   -- open | resolved
  owner_note  text,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists support_tickets_status_idx on support_tickets (status, created_at desc);

-- Reviews are verified by construction: the only way in is a booking's own
-- manage link, after the job is marked done. One review per booking.
create table if not exists reviews (
  id            serial primary key,
  booking_id    integer not null unique references bookings (id) on delete cascade,
  rating        integer not null check (rating between 1 and 5),
  body          text not null,
  display_name  text not null,
  area          text,
  service       text,
  -- pending | published | hidden. Hidden is for content reasons only
  -- (private info, profanity, off-topic) — never for the star count.
  status        text not null default 'pending',
  hidden_reason text,
  owner_reply   text,
  photo_consent boolean not null default false,
  created_at    timestamptz not null default now(),
  published_at  timestamptz
);
create index if not exists reviews_status_idx on reviews (status, published_at desc);

create table if not exists review_photos (
  id         serial primary key,
  review_id  integer not null references reviews (id) on delete cascade,
  mime       text not null,
  bytes      bytea not null,
  byte_size  integer not null,
  sha256     text not null,
  created_at timestamptz not null default now()
);
create index if not exists review_photos_review_idx on review_photos (review_id);

alter table if exists support_tickets enable row level security;
alter table if exists reviews         enable row level security;
alter table if exists review_photos   enable row level security;
