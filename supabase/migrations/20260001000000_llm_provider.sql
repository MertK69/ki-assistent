alter table public.learner_profiles
  add column if not exists llm_provider text not null default 'openai'
  check (llm_provider in ('openai', 'ollama'));
