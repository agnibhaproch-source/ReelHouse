-- Watch parties: a shared shortlist friends vote on in real time.
-- Membership gates everything; creating and joining go through security-definer RPCs
-- (a non-member can't read a party row, so joining by code can't be a plain insert).

create table public.parties (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  name text not null check (char_length(name) between 1 and 40),
  host_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days'
);

create table public.party_members (
  party_id uuid not null references public.parties (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 24),
  joined_at timestamptz not null default now(),
  primary key (party_id, user_id)
);

create table public.party_picks (
  party_id uuid not null references public.parties (id) on delete cascade,
  movie_id integer not null,
  title text not null default '' check (char_length(title) <= 200),
  poster_path text check (poster_path is null or poster_path ~ '^/[A-Za-z0-9_.-]+$'),
  added_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (party_id, movie_id)
);

create table public.party_votes (
  party_id uuid not null,
  movie_id integer not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (party_id, movie_id, user_id),
  foreign key (party_id, movie_id) references public.party_picks (party_id, movie_id) on delete cascade
);
create index party_votes_party_idx on public.party_votes (party_id);

create or replace function public.is_party_member(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.party_members where party_id = pid and user_id = auth.uid());
$$;

create or replace function public.is_party_host(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.parties where id = pid and host_id = auth.uid());
$$;

-- Limits: 20 members, 50 picks per party.
create or replace function public.enforce_party_limits() returns trigger
language plpgsql as $$
begin
  if tg_table_name = 'party_members'
     and (select count(*) from public.party_members where party_id = new.party_id) >= 20 then
    raise exception 'This watch party is full.' using errcode = 'check_violation';
  end if;
  if tg_table_name = 'party_picks'
     and (select count(*) from public.party_picks where party_id = new.party_id) >= 50 then
    raise exception 'This shortlist is full.' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger party_members_limit before insert on public.party_members
  for each row execute function public.enforce_party_limits();
create trigger party_picks_limit before insert on public.party_picks
  for each row execute function public.enforce_party_limits();

-- RPC: create a party (caller becomes host + first member). Returns the join code.
create or replace function public.create_party(p_name text, p_display_name text) returns text
language plpgsql security definer set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text;
  pid uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to start a watch party.' using errcode = '42501'; end if;
  loop
    new_code := '';
    for i in 1..6 loop
      new_code := new_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.parties where code = new_code);
  end loop;
  insert into public.parties (code, name, host_id) values (new_code, trim(p_name), auth.uid()) returning id into pid;
  insert into public.party_members (party_id, user_id, display_name) values (pid, auth.uid(), trim(p_display_name));
  return new_code;
end $$;

-- RPC: join by code (idempotent). Returns the party id.
create or replace function public.join_party(p_code text, p_display_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to join a watch party.' using errcode = '42501'; end if;
  select id into pid from public.parties where code = upper(trim(p_code)) and expires_at > now();
  if pid is null then raise exception 'No active watch party with that code.' using errcode = 'P0002'; end if;
  insert into public.party_members (party_id, user_id, display_name)
    values (pid, auth.uid(), trim(p_display_name))
    on conflict (party_id, user_id) do update set display_name = excluded.display_name;
  return pid;
end $$;

revoke all on function public.create_party(text, text) from public, anon;
revoke all on function public.join_party(text, text) from public, anon;
grant execute on function public.create_party(text, text) to authenticated;
grant execute on function public.join_party(text, text) to authenticated;

alter table public.parties enable row level security;
alter table public.party_members enable row level security;
alter table public.party_picks enable row level security;
alter table public.party_votes enable row level security;

-- parties: members read; host renames/ends. Creation only via create_party().
create policy "parties: member select" on public.parties for select using (public.is_party_member(id));
create policy "parties: host update" on public.parties for update using (host_id = auth.uid()) with check (host_id = auth.uid());
create policy "parties: host delete" on public.parties for delete using (host_id = auth.uid());

-- members: members read the roster; you can leave. Joining only via join_party().
create policy "party_members: member select" on public.party_members for select using (public.is_party_member(party_id));
create policy "party_members: leave" on public.party_members for delete using (user_id = auth.uid() or public.is_party_host(party_id));

-- picks: members read and add (as themselves); the adder or the host can remove.
create policy "party_picks: member select" on public.party_picks for select using (public.is_party_member(party_id));
create policy "party_picks: member insert" on public.party_picks for insert
  with check (public.is_party_member(party_id) and added_by = auth.uid());
create policy "party_picks: owner or host delete" on public.party_picks for delete
  using (added_by = auth.uid() or public.is_party_host(party_id));

-- votes: one per member per pick; only your own.
create policy "party_votes: member select" on public.party_votes for select using (public.is_party_member(party_id));
create policy "party_votes: own insert" on public.party_votes for insert
  with check (public.is_party_member(party_id) and user_id = auth.uid());
create policy "party_votes: own delete" on public.party_votes for delete using (user_id = auth.uid());

-- Realtime: rooms subscribe to changes on their party's rows (RLS still applies).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.party_members, public.party_picks, public.party_votes;
  end if;
end $$;
