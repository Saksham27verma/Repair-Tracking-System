import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const publicPaths = ['/', '/sign-in', '/repairs'];
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  const token = request.cookies.get('authToken');

  // Redirect to login if accessing protected route without token
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Redirect to dashboard if accessing login page with valid token
  if (request.nextUrl.pathname === '/sign-in' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Clone the response
  const response = NextResponse.next();

  // Add cache control headers to prevent caching
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 