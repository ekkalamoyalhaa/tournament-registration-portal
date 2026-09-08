import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;

  if (nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  // Authenticated users shouldn't linger on login/register pages
  if (nextUrl.pathname === '/login' || nextUrl.pathname === '/register') {
    if (token) {
      const role = token.role as string | undefined;
      if (role === 'TOURNAMENT_ADMIN' || role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', nextUrl));
      }
      const cb = nextUrl.searchParams.get('callbackUrl') ?? '/team/register';
      return NextResponse.redirect(new URL(cb, nextUrl));
    }
    return NextResponse.next();
  }

  if (nextUrl.pathname.startsWith('/admin')) {
    if (!token) {
      const login = new URL('/login', nextUrl);
      login.searchParams.set('callbackUrl', nextUrl.pathname);
      return NextResponse.redirect(login);
    }
    const role = token.role as string | undefined;
    if (role !== 'TOURNAMENT_ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', nextUrl));
    }
    return NextResponse.next();
  }

  if (nextUrl.pathname.startsWith('/team')) {
    if (!token) {
      const login = new URL('/login', nextUrl);
      login.searchParams.set('callbackUrl', nextUrl.pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/team/:path*', '/login', '/register'],
};