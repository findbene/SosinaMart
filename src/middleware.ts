import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin routes protection
    if (pathname.startsWith('/admin')) {
      if (token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/login?error=AccessDenied', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Public routes that don't require authentication
        const publicRoutes = [
          '/',
          '/login',
          '/register',
          '/forgot-password',
          '/verify-email',
        ];

        // API routes that are public
        const publicApiRoutes = [
          '/api/auth',
          '/api/products',
          '/api/ai/chat', // Allow unauthenticated chat for visitors
        ];

        // Check if it's a public route
        if (publicRoutes.includes(pathname)) {
          return true;
        }

        // Check if it's a public API route
        if (publicApiRoutes.some(route => pathname.startsWith(route))) {
          return true;
        }

        // Static files and Next.js internals
        if (
          pathname.startsWith('/_next') ||
          pathname.startsWith('/images') ||
          pathname.startsWith('/videos') ||
          pathname.includes('.') // files with extensions
        ) {
          return true;
        }

        // All other routes require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
