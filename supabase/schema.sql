-- Spoločná databáza svadobného plánovača.
-- Spustite raz v Supabase: SQL Editor → New query → vložiť → Run.
-- Celý plánovač je jeden riadok (id = 'main'); version sa zvyšuje pri každom zápise.

create table if not exists public.planner (
  id text primary key,
  data jsonb not null,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.planner enable row level security;

-- Prístup len pre prihláseného používateľa (registrácia nových je vypnutá, takže iba váš spoločný účet).
drop policy if exists "planner_select" on public.planner;
drop policy if exists "planner_insert" on public.planner;
drop policy if exists "planner_update" on public.planner;
create policy "planner_select" on public.planner for select to authenticated using (true);
create policy "planner_insert" on public.planner for insert to authenticated with check (true);
create policy "planner_update" on public.planner for update to authenticated using (true) with check (true);

-- Okamžité doručenie zmien partnerovi (Realtime).
alter publication supabase_realtime add table public.planner;
