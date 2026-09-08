'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { registerUser } from '@/lib/auth/actions';

const inputClass =
  'w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 font-sans text-body-md text-on-surface outline-none placeholder:text-outline/50 focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/30';

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState('');
  const [warning, setWarning] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setWarning('');
    const result = await registerUser(new FormData(e.currentTarget));
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.verifyUrl) setVerifyUrl(result.verifyUrl);
    if (result.warning) setWarning(result.warning);
    setSuccess(true);
  }

  if (success) {
    return (
      <main className="mx-auto flex min-h-[80dvh] max-w-md items-center px-6">
        <GlassCard className="w-full p-8 text-center">
          <h1 className="font-sans text-headline-lg font-bold text-secondary-container tracking-tight">
            Check your email
          </h1>
          <p className="mt-4 font-sans text-body-md text-outline">
            We sent a verification link to your inbox. Click it to activate your account.
          </p>
          {warning && (
            <p className="mt-4 rounded-lg border border-tertiary/30 bg-tertiary/10 px-4 py-2 font-sans text-body-md text-tertiary">
              {warning}
            </p>
          )}
          {verifyUrl && (
            <div className="mt-6 rounded-lg border border-primary-container/30 bg-primary-container/10 p-4">
              <p className="font-mono text-label-sm text-primary-container break-all">{verifyUrl}</p>
              <p className="mt-2 font-mono text-label-sm text-outline">
                (Development fallback — copy this link if email didn&apos;t arrive)
              </p>
            </div>
          )}
          <Link
            href="/login"
            className="mt-6 inline-block font-sans text-body-md text-primary-container hover:underline"
          >
            Go to sign in
          </Link>
        </GlassCard>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[80dvh] max-w-md items-center px-6">
      <GlassCard className="w-full p-8">
        <h1 className="font-sans text-headline-lg font-bold text-secondary-container tracking-tight">
          Create your account
        </h1>
        <p className="mt-2 font-sans text-body-md text-outline">
          Register as a team manager to begin your tournament registration.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <p className="rounded-lg border border-error/30 bg-error/10 px-4 py-2 font-sans text-body-md text-error">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <input name="firstName" placeholder="First name" required className={inputClass} />
            <input name="lastName" placeholder="Last name" required className={inputClass} />
          </div>
          <input name="email" type="email" placeholder="Email" required className={inputClass} />
          <input name="phone" type="tel" placeholder="Phone number" required className={inputClass} />
          <input
            name="password"
            type="password"
            placeholder="Password (min 8 characters)"
            required
            minLength={8}
            className={inputClass}
          />
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              name="terms"
              type="checkbox"
              required
              className="mt-1 h-4 w-4 rounded border-white/10 bg-white/[0.02] text-primary-container focus:ring-primary-container/30"
            />
            <span className="font-sans text-body-md text-outline">
              I agree to the{' '}
              <Link href="#" className="text-primary-container hover:underline">
                terms and conditions
              </Link>
            </span>
          </label>
          <GlassButton type="submit" className="w-full">
            Create account
          </GlassButton>
        </form>
        <p className="mt-6 text-center font-sans text-body-md text-outline">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-container hover:underline">
            Sign in
          </Link>
        </p>
      </GlassCard>
    </main>
  );
}