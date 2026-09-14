import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;

  const isAuthPage =
    nextUrl.pathname === '/login' ||
    nextUrl.pathname === '/register';

  const isAdminPage =
    nextUrl.pathname.startsWith('/admin');

  const isTeamPage =
    nextUrl.pathname.startsWith('/team');

  // --------------------------------------------------
  // Authenticated users visiting login/register
  // --------------------------------------------------
  if (isAuthPage && session?.user) {
    const role = session.user.role;

    if (
      role === 'TOURNAMENT_ADMIN' ||
      role === 'SUPER_ADMIN'
    ) {
      return NextResponse.redirect(
        new URL('/admin/dashboard', nextUrl)
      );
    }

    const callbackUrl =
      nextUrl.searchParams.get('callbackUrl') ||
      '/team/register';

    return NextResponse.redirect(
      new URL(callbackUrl, nextUrl)
    );
  }

  // --------------------------------------------------
  // Admin routes
  // --------------------------------------------------
  if (isAdminPage) {
    if (!session?.user) {
      const loginUrl = new URL('/login', nextUrl);

      loginUrl.searchParams.set(
        'callbackUrl',
        nextUrl.pathname
      );

      return NextResponse.redirect(loginUrl);
    }

    const role = session.user.role;

    if (
      role !== 'TOURNAMENT_ADMIN' &&
      role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.redirect(
        new URL('/', nextUrl)
      );
    }

    return NextResponse.next();
  }

  // --------------------------------------------------
  // Team routes
  // --------------------------------------------------
  if (isTeamPage) {
    if (!session?.user) {
      const loginUrl = new URL('/login', nextUrl);

      loginUrl.searchParams.set(
        'callbackUrl',
        nextUrl.pathname
      );

      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/admin/:path*',
    '/team/:path*',
    '/login',
    '/register',
  ],
};