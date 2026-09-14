import Link from 'next/link';
import { auth } from '@/lib/auth/auth';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans bg-pattern">
      <header className="flex items-center justify-between px-margin-mobile md:px-margin-desktop py-stack-lg bg-transparent w-full z-50 absolute top-0">
        <div className="flex items-center gap-gutter">
          <nav className="hidden md:flex gap-gutter">
            <Link
              href="/admin/teams"
              className="text-on-surface-variant hover:text-gold transition-colors duration-200 pb-1 font-display text-label-md uppercase"
            >
              Teams
            </Link>
            <Link
              href="/fixtures"
              className="text-on-surface-variant hover:text-gold transition-colors duration-200 pb-1 font-display text-label-md uppercase"
            >
              Fixtures
            </Link>
          </nav>
        </div>
        <div>
          {session?.user ? (
            <Link
              href="/team/dashboard"
              className="text-on-surface-variant hover:text-gold transition-colors duration-200 font-display text-label-md uppercase"
            >
              My Team
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-on-surface-variant hover:text-gold transition-colors duration-200 font-display text-label-md uppercase"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}