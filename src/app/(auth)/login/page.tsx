import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <main className="mx-auto flex min-h-[80dvh] max-w-md items-center px-6">
      <div className="w-full rounded-xl border border-white/10 bg-white/[0.02] p-8">
        <div className="h-8 w-24 animate-pulse rounded bg-white/10" />
        <div className="mt-3 h-5 w-56 animate-pulse rounded bg-white/10" />
        <div className="mt-8 space-y-5">
          <div className="h-12 animate-pulse rounded-lg bg-white/10" />
          <div className="h-12 animate-pulse rounded-lg bg-white/10" />
          <div className="h-12 animate-pulse rounded-lg bg-white/10" />
        </div>
      </div>
    </main>
  );
}