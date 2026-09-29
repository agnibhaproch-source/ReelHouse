/** Safe localStorage/sessionStorage access — storage can throw (private mode, blocked). */
type Kind = 'local' | 'session';

function store(kind: Kind): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readJSON<T>(key: string, fallback: T, kind: Kind = 'local'): T {
  try {
    const raw = store(kind)?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown, kind: Kind = 'local'): void {
  try {
    store(kind)?.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or blocked — non-fatal */
  }
}

export function removeKey(key: string, kind: Kind = 'local'): void {
  try {
    store(kind)?.removeItem(key);
  } catch {
    /* ignore */
  }
}
