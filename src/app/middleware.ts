import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Track API requests for debugging
const API_REQUEST_TRACKING = {
  count: 0,
  lastTimestamp: 0,
  requests: [] as { url: string, timestamp: number, referer: string }[],
};

export function middleware(request: NextRequest) {
  const publicPaths = ['/', '/sign-in', '/repairs'];
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  // Track and log API requests to help debug the continuous refresh issue
  if (request.nextUrl.pathname.includes('/api/dashboard-stats')) {
    const now = Date.now();
    API_REQUEST_TRACKING.count++;
    
    // Track request details (keep only last 20)
    API_REQUEST_TRACKING.requests.push({
      url: request.nextUrl.toString(),
      timestamp: now,
      referer: request.headers.get('referer') || 'unknown'
    });
    
    if (API_REQUEST_TRACKING.requests.length > 20) {
      API_REQUEST_TRACKING.requests.shift();
    }
    
    // Calculate frequency
    const timeSinceLast = now - API_REQUEST_TRACKING.lastTimestamp;
    API_REQUEST_TRACKING.lastTimestamp = now;
    
    // Log request patterns
    if (timeSinceLast < 1000) { // Less than 1 second between requests
      console.warn(`⚠️ MIDDLEWARE: Frequent dashboard-stats API call detected!`);
      console.warn(`⚠️ Request #${API_REQUEST_TRACKING.count}, ${timeSinceLast}ms since last request`);
      console.warn(`⚠️ URL: ${request.nextUrl.toString()}`);
      console.warn(`⚠️ Referer: ${request.headers.get('referer') || 'unknown'}`);
      
      // Return a response to block the frequent calls
      if (timeSinceLast < 300) { // If requests are very frequent (less than 300ms apart)
        return new NextResponse(
          JSON.stringify({ 
            error: 'Too many requests', 
            message: 'Rate limited by middleware' 
          }),
          { 
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'X-Rate-Limited-By': 'middleware',
              'X-Request-Count': API_REQUEST_TRACKING.count.toString(),
              'X-Time-Since-Last': timeSinceLast.toString(),
            }
          }
        );
      }
    }
  }

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
  
  // Add tracking headers
  if (request.nextUrl.pathname.includes('/api/')) {
    response.headers.set('X-Request-ID', crypto.randomUUID());
    response.headers.set('X-Request-Count', API_REQUEST_TRACKING.count.toString());
  }

  return response;
} 