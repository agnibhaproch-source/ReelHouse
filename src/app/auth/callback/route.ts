import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { getSupabaseServer } from '@/lib/supabase/server';
import { safeNext } from '@/lib/supabase/config';

/** OAuth / magic-link / email-confirmation callback → returns to `next` (spec 50). */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const next = safeNext(url.searchParams.get('next'), '/profiles');
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const sb = await getSupabaseServer();
  if (!sb) return NextResponse.redirect(new URL('/', url.origin));

  const { error } = code
    ? await sb.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await sb.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error('Missing code') };

  if (error) {
    const login = new URL('/login', url.origin);
    login.searchParams.set('next', next);
    login.searchParams.set('error', 'link');
    return NextResponse.redirect(login);
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
