-- RLS tests (specs 51, 55, 57). Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

-- Two users
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'b@example.com');

set local role authenticated;

-- User A creates a profile + data
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
insert into public.profiles (id, user_id, name) values ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'A');
insert into public.watchlist (profile_id, movie_id, title) values ('10000000-0000-0000-0000-00000000000a', 1, 'One');
insert into public.reviews (id, profile_id, movie_id, body) values ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 1, 'A good film.');

-- User B
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
insert into public.profiles (id, user_id, name) values ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b', 'B');

select is((select count(*) from public.profiles)::int, 1, 'B sees only their own profile');
select is((select count(*) from public.profiles where user_id = '00000000-0000-0000-0000-00000000000a')::int, 0, 'B cannot read A profiles');
select is((select count(*) from public.watchlist)::int, 0, 'B cannot read A watchlist');
select throws_ok(
  $$ insert into public.watchlist (profile_id, movie_id) values ('10000000-0000-0000-0000-00000000000a', 2) $$,
  '42501', null, 'B cannot write into A watchlist'
);
select is((select count(*) from public.reviews)::int, 1, 'Reviews are publicly readable');
update public.reviews set body = 'hijacked' where id = '20000000-0000-0000-0000-00000000000a';
select is((select body from public.reviews where id = '20000000-0000-0000-0000-00000000000a'), 'A good film.', 'B cannot edit A review');
delete from public.reviews where id = '20000000-0000-0000-0000-00000000000a';
select is((select count(*) from public.reviews)::int, 1, 'B cannot delete A review');
select throws_ok(
  $$ insert into public.reviews (profile_id, movie_id, body) values ('10000000-0000-0000-0000-00000000000b', 1, repeat('x', 2001)) $$,
  '23514', null, 'Review length is validated server-side'
);

-- Profile limit
insert into public.profiles (user_id, name) select '00000000-0000-0000-0000-00000000000b', 'P' || g from generate_series(1, 4) g;
select throws_ok(
  $$ insert into public.profiles (user_id, name) values ('00000000-0000-0000-0000-00000000000b', 'Six') $$,
  '23514', 'You can have up to 5 profiles.', 'Max 5 profiles per user'
);

-- Account deletion cascades
select lives_ok($$ select public.delete_my_account() $$, 'B can delete their account');

select * from finish();
rollback;
