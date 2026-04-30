-- Inquiries: 문의 폼 (랜딩 /contact)
-- anon이 직접 insert 가능 (RLS), select는 service_role만

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  organization text,
  content text not null,
  created_at timestamptz not null default now()
);

create index inquiries_created_at_idx on public.inquiries (created_at desc);

alter table public.inquiries enable row level security;

create policy "anon can insert inquiries"
  on public.inquiries
  for insert
  to anon, authenticated
  with check (true);
