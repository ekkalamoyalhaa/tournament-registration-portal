import Link from 'next/link';
import { auth } from '@/lib/auth/auth';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans bg-pattern selection:bg-primary-container/30 selection:text-on-primary-container">
      <header className="flex items-center justify-between px-[40px] py-[24px] bg-transparent w-full z-50 absolute top-0">
        <div className="flex items-center gap-[24px]">
          <Link href="/" className="font-sans text-headline-md font-bold text-on-surface tracking-tight">
            Tournament
          </Link>
          <nav className="hidden md:flex gap-[24px]">
            <Link
              href="/admin/teams"
              className="text-on-surface-variant hover:text-primary-fixed-dim transition-opacity duration-200 pb-1 font-mono text-label-md"
            >
              Teams
            </Link>
            <Link
              href="/fixtures"
              className="text-on-surface-variant hover:text-primary-fixed-dim transition-opacity duration-200 pb-1 font-mono text-label-md"
            >
              Fixtures
            </Link>
          </nav>
        </div>
        <div>
          {session?.user ? (
            <Link
              href="/team/dashboard"
              className="text-on-surface-variant hover:text-primary-fixed-dim transition-opacity duration-200 font-mono text-label-md"
            >
              My Team
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-on-surface-variant hover:text-primary-fixed-dim transition-opacity duration-200 font-mono text-label-md"
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