create extension if not exists pgcrypto;

create table if not exists public.equipment_booking_requests (
  id uuid primary key default gen_random_uuid(),
  requester_name text not null check (char_length(trim(requester_name)) between 2 and 120),
  department_college text not null check (char_length(trim(department_college)) between 2 and 160),
  contact_number text not null check (char_length(trim(contact_number)) between 7 and 40),
  event_organizer text not null check (char_length(trim(event_organizer)) between 2 and 160),
  event_name text not null check (char_length(trim(event_name)) between 2 and 180),
  event_date date not null,
  start_time time not null,
  end_time time not null,
  venue_location text not null check (char_length(trim(venue_location)) between 2 and 200),
  requested_items text[] not null check (
    cardinality(requested_items) > 0
    and array_length(requested_items, 1) <= 15
  ),
  reviewed_by text,
  recommending_approval_by text,
  approved_by text,
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'recommended', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  constraint equipment_booking_time_order check (end_time > start_time)
);

create index if not exists equipment_booking_requests_event_date_idx
  on public.equipment_booking_requests (event_date, status);
create index if not exists equipment_booking_requests_created_at_idx
  on public.equipment_booking_requests (created_at desc);

alter table public.equipment_booking_requests enable row level security;
grant insert on public.equipment_booking_requests to anon, authenticated;

drop policy if exists "Anyone can submit an equipment request"
  on public.equipment_booking_requests;
create policy "Anyone can submit an equipment request"
  on public.equipment_booking_requests for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and reviewed_by is null
    and recommending_approval_by is null
    and approved_by is null
    and event_date >= current_date
    and end_time > start_time
    and cardinality(requested_items) > 0
    and array_length(requested_items, 1) <= 15
  );

-- Requests are not publicly readable. Staff can review them in the Supabase dashboard
-- or through a separate authenticated staff application with narrowly scoped update access.
