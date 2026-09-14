'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';

export default function LoginForm() {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get('callbackUrl');

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (pending) return;

    setError('');
    setPending(true);

    try {
      const formData = new FormData(e.currentTarget);

      const email = String(formData.get('email') ?? '').trim();
      const password = String(formData.get('password') ?? '');

      if (!email || !password) {
        setError('Please enter your email and password.');
        setPending(false);
        return;
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log('SIGN IN RESULT:', result);

      if (!result) {
        setError('Unable to sign in. Please try again.');
        setPending(false);
        return;
      }

      if (result.error) {
        console.error('SIGN IN ERROR:', result.error);
        setError('Invalid email or password.');
        setPending(false);
        return;
      }

      /*
       * The credentials login succeeded.
       *
       * Get the newly-created session so we can determine
       * whether this is an admin or team user.
       */
      const session = await getSession();

      console.log('LOGIN SESSION:', session);

      if (!session?.user) {
        setError(
          'Login succeeded, but the session could not be created.'
        );
        setPending(false);
        return;
      }

      const role = session.user.role;

      console.log('LOGGED IN ROLE:', role);

      /*
       * If the user originally requested a protected page,
       * respect that destination.
       *
       * Otherwise send admins to the dashboard and team users
       * to team registration.
       */
      let destination: string;

      if (callbackUrl) {
        destination = callbackUrl;
      } else if (
        role === 'TOURNAMENT_ADMIN' ||
        role === 'SUPER_ADMIN'
      ) {
        destination = '/admin/dashboard';
      } else {
        destination = '/team/register';
      }

      console.log('LOGIN DESTINATION:', destination);

      window.location.href = destination;
    } catch (error) {
      console.error('LOGIN ERROR:', error);
      setError('Something went wrong. Please try again.');
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[80dvh] max-w-md items-center px-6">
      <GlassCard className="w-full p-8">
        <h1 className="font-sans text-headline-lg font-bold text-secondary-container tracking-tight">
          Sign in
        </h1>

        <p className="mt-2 font-sans text-body-md text-outline">
          Manage your team&apos;s registration.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-error/30 bg-error/10 px-4 py-2 font-sans text-body-md text-error"
            >
              {error}
            </p>
          )}

          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={pending}
            className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 font-sans text-body-md text-on-surface outline-none placeholder:text-outline/50 focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/30 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            autoComplete="current-password"
            disabled={pending}
            className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 font-sans text-body-md text-on-surface outline-none placeholder:text-outline/50 focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/30 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <GlassButton
            type="submit"
            disabled={pending}
            className="w-full"
          >
            {pending ? 'Signing in...' : 'Sign in'}
          </GlassButton>
        </form>

        <p className="mt-6 text-center font-sans text-body-md text-outline">
          New Submission?{' '}
          <Link
            href="/register"
            className="text-primary-container hover:underline"
          >
            Register
          </Link>
        </p>
      </GlassCard>
    </main>
  );
}

