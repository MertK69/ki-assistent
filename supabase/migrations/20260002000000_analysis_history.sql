create table if not exists public.analysis_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  language text not null,
  code_snippet text not null,
  analysis_result jsonb not null,
  provider text not null default 'openai'
    check (provider in ('openai', 'ollama')),
  created_at timestamptz not null default now()
);

create index if not exists analysis_history_user_id_idx
  on public.analysis_history(user_id);

create index if not exists analysis_history_created_at_idx
  on public.analysis_history(user_id, created_at desc);

alter table public.analysis_history enable row level security;

create policy "Users can read own history"
  on public.analysis_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own history"
  on public.analysis_history for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own history"
  on public.analysis_history for delete
  using (auth.uid() = user_id);
