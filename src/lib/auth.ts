/**
 * Secure Authentication Module
 * 
 * Uses jose library for proper JWT signing/verification.
 * Sessions are persisted in the database for:
 * - Server restart resilience
 * - Cross-instance session sharing
 * - Server-side invalidation capability
 * - Audit trail
 */

import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { createHash } from 'crypto';
import { securityLogger } from './security-logger';

// Secret key from environment - NEVER hardcoded
function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    // For development only, generate a transient key
    // In production, AUTH_SECRET MUST be set to a strong random value
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET environment variable is required in production and must be at least 32 characters');
    }
    console.warn('[SECURITY] AUTH_SECRET not set. Using development-only key. DO NOT use in production!');
    return new TextEncoder().encode('dev-only-secret-key-change-in-production-32ch');
  }
  return new TextEncoder().encode(secret);
}

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_DURATION_S = 7 * 24 * 60 * 60; // 7 days in seconds

// Hash a token for database storage (never store raw tokens)
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Clean up expired sessions from DB (called periodically)
async function cleanupExpiredSessions() {
  try {
    await db.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  } catch {
    // Silent fail for cleanup
  }
}

/**
 * Create a new session for a user
 * Persists session in DB and returns a signed JWT
 */
export async function createSession(
  userId: string,
  request?: NextRequest
): Promise<string> {
  const secretKey = getSecretKey();
  
  // Generate a unique session ID
  const sessionId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  // Create signed JWT with session reference
  const token = await new SignJWT({
    sub: userId,
    sid: sessionId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);

  // Hash the token for DB storage
  const tokenHash = hashToken(token);

  // Extract request metadata for audit
  const userAgent = request?.headers.get('user-agent') || null;
  const ipAddress = request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request?.headers.get('x-real-ip') || null;

  // Persist session in database
  try {
    await db.session.create({
      data: {
        userId,
        tokenHash,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });
  } catch (error) {
    securityLogger.error('SESSION_CREATE_FAILED', 'Session', userId, { error: 'Database error' });
    throw new Error('Failed to create session');
  }

  // Periodic cleanup of expired sessions
  if (Math.random() < 0.1) { // ~10% chance on each session creation
    cleanupExpiredSessions();
  }

  return token;
}

/**
 * Verify a session token
 * Checks JWT signature AND database existence
 */
export async function verifySession(token: string): Promise<{ userId: string; sessionId: string } | null> {
  const secretKey = getSecretKey();

  try {
    // 1. Verify JWT signature and expiration
    const { payload } = await jwtVerify(token, secretKey);
    const userId = payload.sub as string;
    const sessionId = payload.sid as string;

    if (!userId || !sessionId) return null;

    // 2. Check session exists in database (allows server-side invalidation)
    const tokenHash = hashToken(token);
    const session = await db.session.findUnique({
      where: { tokenHash },
    });

    if (!session) {
      securityLogger.warn('SESSION_NOT_FOUND_IN_DB', 'Session', userId, { sessionId });
      return null;
    }

    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await db.session.delete({ where: { id: session.id } });
      securityLogger.warn('SESSION_EXPIRED', 'Session', userId, { sessionId });
      return null;
    }

    return { userId, sessionId };
  } catch {
    return null;
  }
}

/**
 * Destroy a specific session
 */
export async function destroySession(token: string): Promise<void> {
  try {
    const tokenHash = hashToken(token);
    await db.session.deleteMany({ where: { tokenHash } });
  } catch {
    // Silent fail - session cleanup
  }
}

/**
 * Destroy ALL sessions for a user (e.g., on password change)
 */
export async function destroyAllUserSessions(userId: string): Promise<void> {
  try {
    const count = await db.session.deleteMany({ where: { userId } });
    securityLogger.info('ALL_SESSIONS_DESTROYED', 'Session', userId, { destroyedCount: count.count });
  } catch {
    // Silent fail
  }
}

/**
 * Extract session from request (cookie or Authorization header)
 */
export async function getSession(request: NextRequest): Promise<{ userId: string; sessionId: string } | null> {
  // Check cookie first
  const cookieToken = request.cookies.get('token')?.value;
  if (cookieToken) {
    const session = await verifySession(cookieToken);
    if (session) return session;
  }

  // Check Authorization header (for API access)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const session = await verifySession(token);
    if (session) return session;
  }

  return null;
}

/**
 * Set secure auth cookie on a response
 */
export function setAuthCookie(response: Response, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProduction, // Secure only in production
    maxAge: SESSION_DURATION_S,
    path: '/',
    ...(isProduction && { domain: process.env.COOKIE_DOMAIN }),
  };

  // NextResponse.cookies.set expects a string for the value
  if ('cookies' in response && typeof (response as any).cookies?.set === 'function') {
    (response as any).cookies.set('token', token, cookieOptions);
  }
}

/**
 * Clear auth cookie on a response
 */
export function clearAuthCookie(response: Response): void {
  if ('cookies' in response && typeof (response as any).cookies?.set === 'function') {
    (response as any).cookies.set('token', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/',
    });
  }
}

/**
 * Record a login attempt (for brute-force protection)
 */
export async function recordLoginAttempt(email: string, success: boolean, ipAddress: string | null): Promise<void> {
  try {
    await db.loginAttempt.create({
      data: { email: email.toLowerCase().trim(), ipAddress, success },
    });

    // Clean up old login attempts (keep last 24h)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db.loginAttempt.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
  } catch {
    // Silent fail
  }
}

/**
 * Check if an email/IP is rate-limited due to too many failed login attempts
 */
export async function isLoginRateLimited(email: string, ipAddress: string | null): Promise<{ limited: boolean; retryAfterMs: number }> {
  try {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000); // 15 minute window
    const normalizedEmail = email.toLowerCase().trim();

    const failedAttempts = await db.loginAttempt.count({
      where: {
        email: normalizedEmail,
        success: false,
        createdAt: { gt: cutoff },
      },
    });

    // Lock after 5 failed attempts in 15 minutes
    const MAX_FAILED_ATTEMPTS = 5;
    const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      // Find the oldest failed attempt in the window
      const oldestAttempt = await db.loginAttempt.findFirst({
        where: {
          email: normalizedEmail,
          success: false,
          createdAt: { gt: cutoff },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (oldestAttempt) {
        const retryAfter = oldestAttempt.createdAt.getTime() + LOCKOUT_DURATION_MS - Date.now();
        if (retryAfter > 0) {
          return { limited: true, retryAfterMs: retryAfter };
        }
      }
    }

    return { limited: false, retryAfterMs: 0 };
  } catch {
    return { limited: false, retryAfterMs: 0 };
  }
}

/**
 * Rotate a session: destroy old and create new.
 * Used after privilege changes (e.g., password reset, role change).
 */
export async function rotateSession(oldToken: string, request?: NextRequest): Promise<string> {
  // 1. Verify old session
  const oldSession = await verifySession(oldToken);
  if (!oldSession) throw new Error('Invalid session');

  // 2. Destroy old session
  await destroySession(oldToken);

  // 3. Create new session
  const newToken = await createSession(oldSession.userId, request);

  // 4. Log rotation
  securityLogger.info('SESSION_ROTATED', 'Session', oldSession.userId);

  return newToken;
}
