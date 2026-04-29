-- Waitlist: 사전 등록 (랜딩 페이지)
-- anon이 직접 insert 가능 (RLS), select는 service_role만

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

create index waitlist_created_at_idx on public.waitlist (created_at desc);

alter table public.waitlist enable row level security;

create policy "anon can insert waitlist"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);
