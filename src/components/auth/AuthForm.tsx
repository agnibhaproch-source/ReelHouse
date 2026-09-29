'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { safeNext } from '@/lib/supabase/config';
import { useSession } from '@/hooks/useSession';
import {
  authErrorMessage,
  LoginSchema,
  MagicSchema,
  SignupSchema,
  type LoginInput,
} from '@/lib/auth-schemas';
import { play } from '@/lib/sound';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SubmitButton, type SubmitState } from '@/components/ui/SubmitButton';
import { TransitionLink } from '@/components/layout/TransitionLink';
import { PasswordField } from './PasswordField';

type Mode = 'login' | 'signup' | 'forgot';

const COPY: Record<Mode, { title: string; cta: string; sub: string }> = {
  login: { title: 'Welcome back', cta: 'Log in', sub: 'Your seat is where you left it.' },
  signup: {
    title: 'Take a seat',
    cta: 'Create account',
    sub: 'Profiles, lists and ratings that follow you.',
  },
  forgot: {
    title: 'Reset your password',
    cta: 'Send reset link',
    sub: 'We’ll email you a link to choose a new one.',
  },
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.35 11.1H12v3.2h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.95S8.78 6.5 12 6.5c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.72 3.95 14.6 3 12 3 7.03 3 3 7.03 3 12s4.03 9 9 9c5.2 0 8.64-3.65 8.64-8.8 0-.6-.07-1.05-.29-1.1Z"
      />
    </svg>
  );
}

/** Login / signup / forgot-password form (spec 50) with specific errors and submit morph. */
export function AuthForm({ mode }: { mode: Mode }) {
  const { sb, accountsEnabled } = useSession();
  const router = useRouter();
  const sp = useSearchParams();
  const next = safeNext(sp.get('next'), '/profiles');
  const [state, setState] = useState<SubmitState>('idle');
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);
  const schema = mode === 'signup' ? SignupSchema : mode === 'forgot' ? MagicSchema : LoginSchema;
  const { register, handleSubmit, control, getValues, formState } = useForm<LoginInput>({
    resolver: zodResolver(schema as typeof LoginSchema),
    defaultValues: { email: '', password: '' },
  });
  const password = useWatch({ control, name: 'password' }) ?? '';
  const copy = COPY[mode];
  const callback = (path: string) =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(path)}`;

  const fail = (text: string) => {
    setState('error');
    setMessage({ kind: 'error', text });
    void play('error');
    setTimeout(() => setState('idle'), 600);
  };

  const submit = handleSubmit(
    async ({ email, password: pw }) => {
      if (!sb) return;
      setState('loading');
      setMessage(null);
      if (mode === 'login') {
        const { error } = await sb.auth.signInWithPassword({ email, password: pw });
        if (error) return fail(authErrorMessage(error));
        setState('success');
        setTimeout(() => {
          router.push(next);
          router.refresh();
        }, 500);
      } else if (mode === 'signup') {
        const { data, error } = await sb.auth.signUp({
          email,
          password: pw,
          options: { emailRedirectTo: callback('/profiles') },
        });
        if (error) return fail(authErrorMessage(error));
        if (data.user && data.user.identities?.length === 0)
          return fail('That email already has an account. Log in instead.');
        setState('success');
        if (data.session) {
          setTimeout(() => router.push('/profiles'), 500);
        } else setMessage({ kind: 'info', text: `Check ${email} for a confirmation link.` });
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(email, {
          redirectTo: callback('/account?section=account'),
        });
        if (error) return fail(authErrorMessage(error));
        setState('success');
        setMessage({
          kind: 'info',
          text: `If ${email} has an account, a reset link is on its way.`,
        });
      }
    },
    () => fail('Check the highlighted fields.'),
  );

  const magicLink = async () => {
    const email = getValues('email');
    const ok = MagicSchema.safeParse({ email });
    if (!sb || !ok.success) return fail('Enter your email first, then we’ll send a magic link.');
    setState('loading');
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callback(next) },
    });
    if (error) return fail(authErrorMessage(error));
    setState('idle');
    setMessage({ kind: 'info', text: `Magic link sent to ${email}. Open it on this device.` });
  };

  const google = async () => {
    if (!sb) return;
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callback(next) },
    });
    if (error) fail(authErrorMessage(error));
  };

  if (!accountsEnabled) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-h1">{copy.title}</h1>
        <p className="text-dim">
          Accounts aren’t configured on this deployment, so you’re in guest mode — your profiles,
          list and ratings are saved in this browser.
        </p>
        <p className="text-small text-dim">
          To enable accounts, set{' '}
          <code className="bg-void/60 rounded px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code className="bg-void/60 rounded px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
        </p>
        <Button href="/profiles">Continue as guest</Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-h1">{copy.title}</h1>
        <p className="text-dim mt-2">{copy.sub}</p>
      </div>
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        {...register('email')}
        error={formState.errors.email?.message}
        data-autofocus
      />
      {mode !== 'forgot' && (
        <PasswordField
          label="Password"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          {...register('password')}
          value={password}
          error={formState.errors.password?.message}
          meter={mode === 'signup'}
        />
      )}
      {message && (
        <p
          role={message.kind === 'error' ? 'alert' : 'status'}
          className={message.kind === 'error' ? 'text-small text-danger' : 'text-small text-cyan'}
        >
          {message.text}
        </p>
      )}
      <SubmitButton state={state}>{copy.cta}</SubmitButton>

      {mode !== 'forgot' && (
        <>
          <div className="text-small text-dim flex items-center gap-3" aria-hidden="true">
            <span className="bg-line h-px flex-1" /> or <span className="bg-line h-px flex-1" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="secondary"
              icon={<GoogleIcon />}
              onClick={() => void google()}
              magnetic={false}
            >
              Continue with Google
            </Button>
            <Button
              variant="secondary"
              icon={<Mail />}
              onClick={() => void magicLink()}
              magnetic={false}
            >
              Email me a link
            </Button>
          </div>
        </>
      )}

      <div className="text-small flex flex-wrap justify-between gap-3">
        {mode === 'login' && (
          <>
            <TransitionLink
              href={`/signup${next !== '/profiles' ? `?next=${encodeURIComponent(next)}` : ''}`}
              className="text-cyan hover:underline"
            >
              New here? Create an account
            </TransitionLink>
            <TransitionLink href="/forgot-password" className="text-dim hover:text-reel">
              Forgot password?
            </TransitionLink>
          </>
        )}
        {mode !== 'login' && (
          <TransitionLink href="/login" className="text-cyan hover:underline">
            Have an account? Log in
          </TransitionLink>
        )}
      </div>
    </form>
  );
}
