import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy-session';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|api/tmdb|favicon.ico|icon|sounds/|og/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|wav|mp3|webm)$).*)'],
};
