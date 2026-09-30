/**
 * Shareable lists live entirely in the URL (no account, no server storage):
 * `/list?i=<ids in base36, dot-separated>&n=<name>`. Capped so links stay short.
 */
export const SHARED_LIST_MAX = 48;

export function encodeListIds(ids: number[]): string {
  return ids
    .slice(0, SHARED_LIST_MAX)
    .map((id) => id.toString(36))
    .join('.');
}

export function decodeListIds(raw: string | null | undefined): number[] {
  if (!raw) return [];
  const seen = new Set<number>();
  for (const part of raw.split('.').slice(0, SHARED_LIST_MAX)) {
    if (!/^[0-9a-z]{1,8}$/.test(part)) continue;
    const id = Number.parseInt(part, 36);
    if (Number.isSafeInteger(id) && id > 0) seen.add(id);
  }
  return [...seen];
}

export function cleanListName(raw: string | null | undefined): string {
  const name = (raw ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 60);
  return name || 'A Reelhouse list';
}

export function sharedListPath(ids: number[], name: string): string {
  const q = new URLSearchParams({ i: encodeListIds(ids), n: cleanListName(name) });
  return `/list?${q.toString()}`;
}
