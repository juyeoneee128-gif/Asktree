-- Asktree Initial Schema
-- 7 tables: users, projects, sessions, issues, guidelines, spec_documents, spec_features

-- ─── 1. users ───
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text unique not null,
  avatar_url text,
  login_method text not null default 'Google',
  credits integer not null default 10,
  total_credits integer not null default 100,
  used_this_month integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── 2. projects ───
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  agent_status text not null default 'disconnected'
    check (agent_status in ('connected', 'disconnected')),
  agent_last_seen timestamptz,
  agent_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── 3. sessions ───
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  number integer not null default 1,
  title text not null default '',
  summary text,
  raw_log text,
  files_changed integer not null default 0,
  changed_files jsonb not null default '[]'::jsonb,
  prompts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── 4. issues ───
create table public.issues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  title text not null,
  level text not null check (level in ('critical', 'warning', 'info')),
  status text not null default 'unconfirmed'
    check (status in ('unconfirmed', 'confirmed', 'resolved')),
  fact text not null default '',
  detail text not null default '',
  fix_command text not null default '',
  file text not null default '',
  basis text not null default '',
  is_redetected boolean not null default false,
  detected_at timestamptz not null default now(),
  confirmed_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ─── 5. guidelines ───
create table public.guidelines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_issue_id uuid references public.issues(id) on delete set null,
  title text not null,
  rule text not null,
  status text not null default 'unapplied'
    check (status in ('unapplied', 'applied')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── 6. spec_documents ───
create table public.spec_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  type text not null check (type in ('FRD', 'PRD')),
  file_url text,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ─── 7. spec_features ───
create table public.spec_features (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  document_id uuid references public.spec_documents(id) on delete cascade,
  name text not null,
  source text not null check (source in ('FRD', 'PRD')),
  status text not null default 'unimplemented'
    check (status in ('implemented', 'partial', 'unimplemented', 'attention')),
  implemented_items jsonb not null default '[]'::jsonb,
  total_items integer not null default 0,
  related_files jsonb not null default '[]'::jsonb,
  prd_summary text,
  created_at timestamptz not null default now()
);

-- ─── Indexes ───
create index idx_projects_user_id on public.projects(user_id);
create index idx_sessions_project_id on public.sessions(project_id);
create index idx_issues_project_status on public.issues(project_id, status);
create index idx_issues_project_level on public.issues(project_id, level);
create index idx_guidelines_project_id on public.guidelines(project_id);
create index idx_spec_documents_project_id on public.spec_documents(project_id);
create index idx_spec_features_project_id on public.spec_features(project_id);

-- ─── RLS ───
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.sessions enable row level security;
alter table public.issues enable row level security;
alter table public.guidelines enable row level security;
alter table public.spec_documents enable row level security;
alter table public.spec_features enable row level security;

-- Users: 본인 데이터만 접근
create policy "Users can view own data" on public.users
  for select using (auth.uid() = id);
create policy "Users can update own data" on public.users
  for update using (auth.uid() = id);

-- Projects: 본인 프로젝트만
create policy "Users can CRUD own projects" on public.projects
  for all using (auth.uid() = user_id);

-- Sessions: 프로젝트 소유자만
create policy "Users can access own project sessions" on public.sessions
  for all using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

-- Issues: 프로젝트 소유자만
create policy "Users can access own project issues" on public.issues
  for all using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

-- Guidelines: 프로젝트 소유자만
create policy "Users can access own project guidelines" on public.guidelines
  for all using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

-- Spec Documents: 프로젝트 소유자만
create policy "Users can access own project spec_documents" on public.spec_documents
  for all using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

-- Spec Features: 프로젝트 소유자만
create policy "Users can access own project spec_features" on public.spec_features
  for all using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

-- ─── updated_at 자동 갱신 트리거 ───
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.users
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.projects
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.sessions
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.guidelines
  for each row execute function public.handle_updated_at();

-- ─── 회원가입 시 users 테이블 자동 생성 ───
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'email', new.email),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
