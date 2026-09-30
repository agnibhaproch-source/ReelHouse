import type { SupabaseClient } from '@supabase/supabase-js';

/** Watch parties (Supabase only). RLS scopes every read to parties the user belongs to. */
export interface Party {
  id: string;
  code: string;
  name: string;
  host_id: string;
  expires_at: string;
}
export interface PartyMember {
  user_id: string;
  display_name: string;
}
export interface PartyPick {
  movie_id: number;
  title: string;
  poster_path: string | null;
  added_by: string;
  votes: string[];
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export const PARTY_CODE = /^[A-HJ-NP-Z2-9]{6}$/;

export async function createParty(sb: SupabaseClient, name: string, displayName: string) {
  return check(
    await sb.rpc('create_party', {
      p_name: name.trim().slice(0, 40),
      p_display_name: displayName.trim().slice(0, 24),
    }),
  ) as string;
}

export async function joinParty(sb: SupabaseClient, code: string, displayName: string) {
  return check(
    await sb.rpc('join_party', {
      p_code: code.trim().toUpperCase(),
      p_display_name: displayName.trim().slice(0, 24),
    }),
  ) as string;
}

export async function myParties(sb: SupabaseClient): Promise<Party[]> {
  return check(
    await sb.from('parties').select('*').order('created_at', { ascending: false }),
  ) as Party[];
}

/** Party + roster + shortlist (with voter ids), or null when the viewer isn't a member. */
export async function loadParty(sb: SupabaseClient, code: string) {
  const party = check(
    await sb.from('parties').select('*').eq('code', code).maybeSingle(),
  ) as Party | null;
  if (!party) return null;
  const [members, picks, votes] = await Promise.all([
    sb
      .from('party_members')
      .select('user_id, display_name')
      .eq('party_id', party.id)
      .order('joined_at'),
    sb
      .from('party_picks')
      .select('movie_id, title, poster_path, added_by')
      .eq('party_id', party.id),
    sb.from('party_votes').select('movie_id, user_id').eq('party_id', party.id),
  ]);
  const voteRows = check(votes) as { movie_id: number; user_id: string }[];
  const shortlist = (check(picks) as Omit<PartyPick, 'votes'>[])
    .map((p) => ({
      ...p,
      votes: voteRows.filter((v) => v.movie_id === p.movie_id).map((v) => v.user_id),
    }))
    .sort((a, b) => b.votes.length - a.votes.length || a.title.localeCompare(b.title));
  return { party, members: check(members) as PartyMember[], shortlist };
}

export async function addPick(
  sb: SupabaseClient,
  partyId: string,
  userId: string,
  movie: { movie_id: number; title: string; poster_path: string | null },
) {
  const res = await sb
    .from('party_picks')
    .upsert(
      { party_id: partyId, added_by: userId, ...movie },
      { onConflict: 'party_id,movie_id', ignoreDuplicates: true },
    );
  if (res.error) throw new Error(res.error.message);
}

export async function removePick(sb: SupabaseClient, partyId: string, movieId: number) {
  const res = await sb.from('party_picks').delete().eq('party_id', partyId).eq('movie_id', movieId);
  if (res.error) throw new Error(res.error.message);
}

export async function setVote(
  sb: SupabaseClient,
  partyId: string,
  userId: string,
  movieId: number,
  on: boolean,
) {
  const res = on
    ? await sb.from('party_votes').insert({ party_id: partyId, movie_id: movieId, user_id: userId })
    : await sb
        .from('party_votes')
        .delete()
        .eq('party_id', partyId)
        .eq('movie_id', movieId)
        .eq('user_id', userId);
  if (res.error && res.error.code !== '23505') throw new Error(res.error.message);
}

export async function leaveParty(sb: SupabaseClient, partyId: string, userId: string) {
  const res = await sb.from('party_members').delete().eq('party_id', partyId).eq('user_id', userId);
  if (res.error) throw new Error(res.error.message);
}
