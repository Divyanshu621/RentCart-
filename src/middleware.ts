/**
 * Next.js Middleware - Security Layer
 * 
 * Applies security headers, CSRF protection, and request logging
 * to all incoming requests at the edge level.
 */

import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = ['/api/rentals', '/api/reviews', '/api/conversations', '/api/notifications', '/api/kyc', '/api/disputes'];
const ADMIN_ROUTES = ['/api/admin'];
const AUTH_ROUTES = ['/api/auth/login', '/api/auth/register', '/api/auth/google'];

// Routes that should NOT have CSRF protection (GET, HEAD, OPTIONS are already safe)
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // ─── 1. Security Headers ───────────────────────────────
  applySecurityHeaders(response);

  // ─── 2. Request Size Check (prevent large payloads) ────
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) { // 10MB max
    return NextResponse.json(
      { success: false, error: 'Request too large' },
      { status: 413 }
    );
  }

  // ─── 3. CSRF Protection for state-changing requests ────
  const method = request.method;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!SAFE_METHODS.includes(method) && pathname.startsWith('/api/')) {
    // Check Origin header for API requests
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    // In production, require Origin or Referer for state-changing API requests
    if (isProduction && !origin && !referer) {
      console.error('[SECURITY] CSRF: Missing Origin/Referer header', { path: pathname, method });
      return NextResponse.json(
        { success: false, error: 'Invalid request origin' },
        { status: 403 }
      );
    }

    // Validate Origin matches expected origins (production only)
    // In development / preview, skip strict origin checking to allow dynamic preview URLs
    if (isProduction && origin) {
      const allowedOrigins = getAllowedOrigins();
      const originUrl = new URL(origin);
      const isAllowed = allowedOrigins.some(allowed => {
        try {
          const allowedUrl = new URL(allowed);
          return originUrl.origin === allowedUrl.origin;
        } catch {
          return origin === allowed;
        }
      });

      if (!isAllowed) {
        console.error('[SECURITY] CSRF: Origin not allowed', { origin, path: pathname });
        return NextResponse.json(
          { success: false, error: 'Invalid request origin' },
          { status: 403 }
        );
      }
    }
  }

  // ─── 4. Path Traversal Protection ─────────────────────
  if (pathname.includes('..') || pathname.includes('//')) {
    return NextResponse.json(
      { success: false, error: 'Invalid path' },
      { status: 400 }
    );
  }

  return response;
}

/**
 * Apply security headers to response
 */
function applySecurityHeaders(response: NextResponse) {
  const isDev = process.env.NODE_ENV !== 'production';

  // Strict Transport Security - enforce HTTPS for 1 year (skip in dev)
  if (!isDev) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking (relaxed in dev for preview panels)
  if (isDev) {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  } else {
    response.headers.set('X-Frame-Options', 'DENY');
  }

  // Referrer Policy - send origin only
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy - restrict browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(self), geolocation=(), payment=()'
  );

  // Content Security Policy
  const csp = buildCSP();
  if (csp) {
    response.headers.set('Content-Security-Policy', csp);
  }

  // X-XSS Protection (legacy, but helps older browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Cache control for API routes
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');

  // Remove server identification
  response.headers.delete('x-powered-by');
}

/**
 * Build Content Security Policy
 */
function buildCSP(): string {
  const isDev = process.env.NODE_ENV === 'development';

  const directives = [
    "default-src 'self'",
    "script-src 'self'" + (isDev ? " 'unsafe-eval' 'unsafe-inline' https://accounts.google.com" : ''),
    "style-src 'self' 'unsafe-inline'", // Tailwind needs inline styles
    "img-src 'self' data: blob: https: http:", // Allow external images for products
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self'" + (isDev ? ' ws: wss: https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com' : ' wss:'),
    "frame-ancestors 'self'" + (isDev ? ' https://*.space-z.ai' : ''),
    "form-action 'self' https://accounts.google.com",
    "base-uri 'self'",
    "object-src 'none'",
    "media-src 'self' blob:",
  ];

  return directives.join('; ');
}

/**
 * Get allowed origins for CORS/CSRF validation
 */
function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map(o => o.trim()).filter(Boolean);
  }

  // Default: allow same origin
  const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000';
  return [appUrl];
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    // Run on all API routes
    '/api/:path*',
    // Run on the app itself
    '/((?!_next/static|_next/image|favicon.ico|uploads|public).*)',
  ],
};
