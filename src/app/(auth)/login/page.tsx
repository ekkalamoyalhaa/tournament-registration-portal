'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/team/register';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const result = await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirect: false,
    });

    setPending(false);

    if (result?.error) {
      setError('Invalid email or password.');
      return;
    }

    // Hard reload — middleware will read the fresh session cookie and route correctly
    window.location.href = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
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
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <p className="rounded-lg border border-error/30 bg-error/10 px-4 py-2 font-sans text-body-md text-error">
              {error}
            </p>
          )}
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 font-sans text-body-md text-on-surface outline-none placeholder:text-outline/50 focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/30"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 font-sans text-body-md text-on-surface outline-none placeholder:text-outline/50 focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/30"
          />
          <GlassButton type="submit" disabled={pending} className="w-full">
            {pending ? 'Signing in...' : 'Sign in'}
          </GlassButton>
        </form>
        <p className="mt-6 text-center font-sans text-body-md text-outline">
          Need an account?{' '}
          <Link href="/register" className="text-primary-container hover:underline">
            Register
          </Link>
        </p>
      </GlassCard>
    </main>
  );
}