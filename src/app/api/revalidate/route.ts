import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

function authorized(req: NextRequest): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  const given = req.headers.get('x-revalidate-secret') ?? '';
  if (!secret || given.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

/**
 * On-demand ISR (spec 67). POST with header `x-revalidate-secret`.
 * Body: { "path": "/movie/123" } or { "tag": "tmdb" } (defaults to all TMDB data).
 */
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { path?: unknown; tag?: unknown };
  if (typeof body.path === 'string' && body.path.startsWith('/')) {
    revalidatePath(body.path);
    return NextResponse.json({ revalidated: body.path });
  }
  const tag = typeof body.tag === 'string' && /^[\w:/-]{1,120}$/.test(body.tag) ? body.tag : 'tmdb';
  revalidateTag(tag, 'max');
  return NextResponse.json({ revalidated: tag });
}
