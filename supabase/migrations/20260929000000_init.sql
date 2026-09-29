-- Reelhouse schema: profiles, watchlist, history, ratings, reviews (+ likes, reports).
-- Every table is owned through profiles.user_id = auth.uid() and protected by RLS.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 24),
  avatar text not null default 'reel',
  is_kids boolean not null default false,
  language text not null default 'en-US',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index profiles_user_id_idx on public.profiles (user_id);

create or replace function public.enforce_profile_limit() returns trigger
language plpgsql as $$
begin
  if (select count(*) from public.profiles where user_id = new.user_id) >= 5 then
    raise exception 'You can have up to 5 profiles.' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger profiles_limit before insert on public.profiles
  for each row execute function public.enforce_profile_limit();

create or replace function public.owns_profile(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = pid and user_id = auth.uid());
$$;

alter table public.profiles enable row level security;
create policy "profiles: owner select" on public.profiles for select using (user_id = auth.uid());
create policy "profiles: owner insert" on public.profiles for insert with check (user_id = auth.uid());
create policy "profiles: owner update" on public.profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "profiles: owner delete" on public.profiles for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------- watchlist
create table public.watchlist (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  movie_id integer not null,
  title text not null default '',
  poster_path text,
  backdrop_path text,
  vote_average real,
  release_date text,
  genre_ids integer[] not null default '{}',
  original_language text,
  added_at timestamptz not null default now(),
  position integer not null default 0,
  primary key (profile_id, movie_id)
);

alter table public.watchlist enable row level security;
create policy "watchlist: owner all" on public.watchlist for all
  using (public.owns_profile(profile_id)) with check (public.owns_profile(profile_id));

-- ---------------------------------------------------------------- history
create table public.history (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  movie_id integer not null,
  kind text not null check (kind in ('view', 'trailer')),
  at timestamptz not null default now(),
  title text not null default '',
  poster_path text,
  backdrop_path text,
  genre_ids integer[] not null default '{}',
  original_language text,
  progress real not null default 0 check (progress between 0 and 1),
  primary key (profile_id, movie_id)
);
create index history_profile_at_idx on public.history (profile_id, at desc);

alter table public.history enable row level security;
create policy "history: owner all" on public.history for all
  using (public.owns_profile(profile_id)) with check (public.owns_profile(profile_id));

-- ---------------------------------------------------------------- ratings
create table public.ratings (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  movie_id integer not null,
  score smallint not null check (score between 1 and 10),
  created_at timestamptz not null default now(),
  primary key (profile_id, movie_id)
);
create index ratings_movie_idx on public.ratings (movie_id);

alter table public.ratings enable row level security;
create policy "ratings: owner all" on public.ratings for all
  using (public.owns_profile(profile_id)) with check (public.owns_profile(profile_id));

create or replace function public.movie_rating_average(p_movie_id integer)
returns table (average numeric, count bigint)
language sql stable security definer set search_path = public as $$
  select coalesce(avg(score), 0)::numeric(4,2), count(*) from public.ratings where movie_id = p_movie_id;
$$;

-- ---------------------------------------------------------------- reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  movie_id integer not null,
  body text not null check (char_length(body) between 1 and 2000),
  spoiler boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, movie_id)
);
create index reviews_movie_idx on public.reviews (movie_id, created_at desc);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger reviews_touch before update on public.reviews for each row execute function public.touch_updated_at();

alter table public.reviews enable row level security;
create policy "reviews: public read" on public.reviews for select using (not hidden or public.owns_profile(profile_id));
create policy "reviews: owner insert" on public.reviews for insert with check (public.owns_profile(profile_id));
create policy "reviews: owner update" on public.reviews for update using (public.owns_profile(profile_id)) with check (public.owns_profile(profile_id));
create policy "reviews: owner delete" on public.reviews for delete using (public.owns_profile(profile_id));

create table public.review_likes (
  review_id uuid not null references public.reviews (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  primary key (review_id, profile_id)
);
alter table public.review_likes enable row level security;
create policy "likes: public read" on public.review_likes for select using (true);
create policy "likes: owner write" on public.review_likes for insert with check (public.owns_profile(profile_id));
create policy "likes: owner delete" on public.review_likes for delete using (public.owns_profile(profile_id));

create table public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 500),
  created_at timestamptz not null default now(),
  unique (review_id, profile_id)
);
alter table public.review_reports enable row level security;
create policy "reports: owner insert" on public.review_reports for insert with check (public.owns_profile(profile_id));

-- Auto-hide a review after 3 distinct reports.
create or replace function public.hide_reported_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.review_reports where review_id = new.review_id) >= 3 then
    update public.reviews set hidden = true where id = new.review_id;
  end if;
  return new;
end $$;
create trigger review_reports_hide after insert on public.review_reports
  for each row execute function public.hide_reported_review();

-- Public review feed with author display fields (profiles are otherwise private).
create or replace function public.get_reviews(p_movie_id integer, p_viewer uuid default null)
returns table (
  id uuid, profile_id uuid, profile_name text, avatar text, movie_id integer, body text,
  spoiler boolean, created_at timestamptz, updated_at timestamptz, likes bigint, liked boolean
)
language sql stable security definer set search_path = public as $$
  select r.id, r.profile_id, p.name, p.avatar, r.movie_id, r.body, r.spoiler, r.created_at, r.updated_at,
    (select count(*) from public.review_likes l where l.review_id = r.id),
    exists (select 1 from public.review_likes l where l.review_id = r.id and l.profile_id = p_viewer)
  from public.reviews r join public.profiles p on p.id = r.profile_id
  where r.movie_id = p_movie_id and (not r.hidden or p.user_id = auth.uid())
  order by r.created_at desc
  limit 100;
$$;

-- ---------------------------------------------------------------- account deletion
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  delete from auth.users where id = auth.uid(); -- cascades through profiles → all rows
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
grant execute on function public.get_reviews(integer, uuid) to anon, authenticated;
grant execute on function public.movie_rating_average(integer) to anon, authenticated;
