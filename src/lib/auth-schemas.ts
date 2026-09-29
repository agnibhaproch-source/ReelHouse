import { z } from 'zod';

/** Shared client/server auth schemas (spec 50). */
export const EmailSchema = z.string().trim().min(1, 'Enter your email address.').email('That doesn’t look like an email address.');

export const PasswordSchema = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .max(72, 'Keep it under 72 characters.')
  .regex(/[A-Za-z]/, 'Include at least one letter.')
  .regex(/\d/, 'Include at least one number.');

export const LoginSchema = z.object({ email: EmailSchema, password: z.string().min(1, 'Enter your password.') });
export const SignupSchema = z.object({ email: EmailSchema, password: PasswordSchema });
export const MagicSchema = z.object({ email: EmailSchema });

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;

/** 0–4 strength score for the meter. */
export function passwordStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, Math.max(1, s)) as 1 | 2 | 3 | 4;
}

/** Plain, specific copy for Supabase auth errors (spec 50 / 64). */
export function authErrorMessage(err: { message?: string; status?: number; code?: string } | null | undefined): string {
  if (!err) return 'Something went wrong. Try again.';
  const m = (err.message ?? '').toLowerCase();
  if (err.status === 429 || m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Wait a minute, then try again.';
  if (m.includes('already registered') || m.includes('already exists') || err.code === 'user_already_exists') return 'That email already has an account. Log in instead.';
  if (m.includes('invalid login') || m.includes('invalid credentials')) return 'That email and password don’t match. Check both and try again.';
  if (m.includes('email not confirmed')) return 'Confirm your email first — check your inbox for the link.';
  if (m.includes('password')) return err.message ?? 'That password won’t work. Try another.';
  if (m.includes('network') || m.includes('fetch')) return 'Can’t reach the server. Check your connection and try again.';
  return err.message ?? 'Something went wrong. Try again.';
}
