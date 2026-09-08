import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const { token } = searchParams;

  if (!token) {
    return (
      <main className="mx-auto flex min-h-[80dvh] max-w-md items-center px-6">
        <GlassCard className="w-full p-8 text-center">
          <h1 className="font-sans text-headline-lg font-bold text-error tracking-tight">
            Invalid link
          </h1>
          <p className="mt-4 font-sans text-body-md text-outline">
            The verification link is missing or malformed.
          </p>
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

  const verification = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verification || verification.expires < new Date()) {
    return (
      <main className="mx-auto flex min-h-[80dvh] max-w-md items-center px-6">
        <GlassCard className="w-full p-8 text-center">
          <h1 className="font-sans text-headline-lg font-bold text-error tracking-tight">
            Link expired
          </h1>
          <p className="mt-4 font-sans text-body-md text-outline">
            This verification link has expired or already been used.
          </p>
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

  await prisma.user.updateMany({
    where: { email: verification.email },
    data: { emailVerifiedAt: new Date() },
  });

  await prisma.verificationToken.delete({
    where: { token },
  });

  return (
    <main className="mx-auto flex min-h-[80dvh] max-w-md items-center px-6">
      <GlassCard className="w-full p-8 text-center">
        <h1 className="font-sans text-headline-lg font-bold text-secondary-container tracking-tight">
          Email verified
        </h1>
        <p className="mt-4 font-sans text-body-md text-outline">
          Your account is now active. You can sign in and start your team registration.
        </p>
        <Link href="/login">
          <GlassButton className="mt-6 w-full">Sign in</GlassButton>
        </Link>
      </GlassCard>
    </main>
  );
}