create table if not exists bookings (
  id serial primary key,
  name text not null,
  phone text not null,
  email text,
  address text not null,
  service text not null,
  notes text,
  preferred_date text,
  early_bird boolean not null default false,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists bookings_created_at_idx on bookings (created_at desc);
