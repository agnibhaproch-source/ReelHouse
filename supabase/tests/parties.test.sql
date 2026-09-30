-- Watch party RLS tests. Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'host@example.com'),
  ('00000000-0000-0000-0000-0000000000b1', 'friend@example.com'),
  ('00000000-0000-0000-0000-0000000000c1', 'stranger@example.com');

set local role authenticated;

-- Host creates a party and adds a pick
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
create temporary table t_code on commit drop as select public.create_party('Friday night', 'Host') as code;
grant select on t_code to authenticated;
select matches((select code from t_code), '^[A-HJ-NP-Z2-9]{6}$', 'create_party returns a 6-char code');
insert into public.party_picks (party_id, movie_id, title) select id, 550, 'Fight Club' from public.parties;
select is((select count(*) from public.party_members)::int, 1, 'Host is the first member');

-- A stranger sees nothing and cannot add
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';
select is((select count(*) from public.parties)::int, 0, 'Non-members cannot see the party');
select is((select count(*) from public.party_picks)::int, 0, 'Non-members cannot see picks');
select throws_ok(
  $$ insert into public.party_members (party_id, user_id, display_name)
     values ((select id from public.parties limit 1), auth.uid(), 'Sneaky') $$,
  null, null, 'Joining is only possible through join_party()'
);

-- Friend joins by code, votes, and cannot vote as someone else
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
select lives_ok($$ select public.join_party((select lower(code) from t_code), 'Friend') $$, 'join_party accepts the code (case-insensitive)');
select is((select count(*) from public.party_picks)::int, 1, 'Members see the shortlist');
select lives_ok(
  $$ insert into public.party_votes (party_id, movie_id) select party_id, movie_id from public.party_picks $$,
  'Members can vote'
);
select throws_ok(
  $$ insert into public.party_votes (party_id, movie_id, user_id)
     select party_id, movie_id, '00000000-0000-0000-0000-0000000000a1' from public.party_picks $$,
  '42501', null, 'Members cannot vote on behalf of others'
);
select is(
  (select count(*) from public.party_picks where added_by = auth.uid())::int, 0,
  'The friend did not add the pick'
);
delete from public.party_picks;
select is((select count(*) from public.party_picks)::int, 1, 'Only the adder or host can remove a pick');

select * from finish();
rollback;
