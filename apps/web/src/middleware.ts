import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/register', '/share', '/client/login', '/downloads'];

interface TokenPayload {
  role?: string;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  const isClientRoute = pathname.startsWith('/client');
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (!token) {
    if (isPublic) return NextResponse.next();
    const loginUrl = new URL(isClientRoute ? '/client/login' : '/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  let payload: TokenPayload;
  try {
    payload = decodeToken(token);
  } catch {
    const loginUrl = new URL(isClientRoute ? '/client/login' : '/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set('token', '', { path: '/', maxAge: 0 });
    return response;
  }

  if (payload.role === 'hr_client') {
    if (pathname === '/client/login') {
      return NextResponse.redirect(new URL('/client/recommendations', request.url));
    }
    if (!isClientRoute) {
      return NextResponse.redirect(new URL('/client/recommendations', request.url));
    }
    return NextResponse.next();
  }

  if (isClientRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

function decodeToken(token: string): TokenPayload {
  const [, payload] = token.split('.');
  if (!payload) throw new Error('Invalid token');
  const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decoded);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
