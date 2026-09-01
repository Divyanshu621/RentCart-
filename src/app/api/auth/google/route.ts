import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { createSession, setAuthCookie } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { safeError, success, validationError } from '@/lib/secure-handler';
import { securityLogger } from '@/lib/security-logger';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const APP_URL = process.env.NEXTAUTH_URL || process.env.APP_URL || '';

const isGoogleConfigured = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.length > 10 && GOOGLE_CLIENT_SECRET);

// ─── GET: Redirect-based Google OAuth flow (for production) ───
export async function GET(request: NextRequest) {
  if (!isGoogleConfigured) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured' },
      { status: 503 }
    );
  }

  const redirectUri = `${APP_URL || new URL(request.url).origin}/api/auth/google/callback`;
  const scope = encodeURIComponent('openid email profile');
  const state = Buffer.from(JSON.stringify({
    ts: Date.now(),
    nonce: crypto.randomUUID(),
  })).toString('base64url');

  const googleAuthUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&access_type=offline` +
    `&prompt=select_account` +
    `&state=${state}`;

  return NextResponse.redirect(googleAuthUrl);
}

// ─── POST: Verify Google ID token (for client-side GIS flow) ─
const googleTokenSchema = z.object({
  credential: z.string().min(50, 'Invalid Google credential'),
});

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  try {
    // Rate limiting
    const ipResult = rateLimiters.auth.check(clientIp);
    if (ipResult.limited) {
      return rateLimitResponse(ipResult.retryAfterMs);
    }

    if (!isGoogleConfigured) {
      return NextResponse.json(
        { success: false, error: 'Google OAuth is not configured. Please use email/password login.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const parsed = googleTokenSchema.safeParse(body);

    if (!parsed.success) {
      return validationError('Invalid Google credential');
    }

    // ─── Verify ID token with Google ──────────────────
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(parsed.data.credential)}`
    );

    if (!verifyRes.ok) {
      securityLogger.warn('GOOGLE_TOKEN_VERIFY_FAILED', 'Auth', null, { ip: clientIp });
      return validationError('Google authentication failed. Please try again.');
    }

    const googleUser = await verifyRes.json() as {
      sub: string;
      email: string;
      email_verified: boolean;
      name: string;
      given_name: string;
      family_name: string;
      picture?: string;
      locale?: string;
      aud: string;
      iss: string;
    };

    // ─── Validate audience (must match our client ID) ──
    if (googleUser.aud !== GOOGLE_CLIENT_ID) {
      securityLogger.warn('GOOGLE_TOKEN_AUDIENCE_MISMATCH', 'Auth', null, {
        expected: GOOGLE_CLIENT_ID,
        got: googleUser.aud,
        ip: clientIp,
      });
      return validationError('Invalid authentication');
    }

    // ─── Validate issuer ───────────────────────────────
    if (googleUser.iss !== 'accounts.google.com' && googleUser.iss !== 'https://accounts.google.com') {
      securityLogger.warn('GOOGLE_TOKEN_INVALID_ISSUER', 'Auth', null, {
        iss: googleUser.iss,
        ip: clientIp,
      });
      return validationError('Invalid authentication');
    }

    if (!googleUser.email_verified) {
      securityLogger.warn('GOOGLE_EMAIL_NOT_VERIFIED', 'Auth', null, { email: googleUser.email });
      return validationError('Your Google email is not verified');
    }

    // ─── Find or create user ───────────────────────────
    const user = await findOrCreateGoogleUser({
      email: googleUser.email,
      name: googleUser.name,
      googleId: googleUser.sub,
      avatarUrl: googleUser.picture || null,
    });

    // ─── Create session ────────────────────────────────
    const token = await createSession(user.id, request);

    securityLogger.info('GOOGLE_LOGIN_SUCCESS', 'Auth', user.id, { ip: clientIp });

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date().toISOString() },
    }).catch(() => {});

    const { passwordHash: _, ...userWithoutPassword } = user;

    const response = success({ user: userWithoutPassword });
    setAuthCookie(response, token);

    return response;
  } catch (error: unknown) {
    return safeError(error, 'GOOGLE_AUTH');
  }
}

// ─── Shared: Find or create a Google user ────────────────────
interface GoogleUserData {
  email: string;
  name: string;
  googleId: string | null;
  avatarUrl: string | null;
}

export async function findOrCreateGoogleUser(data: GoogleUserData) {
  const normalizedEmail = data.email.toLowerCase().trim();
  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });

  if (existing) {
    if (!existing.isActive) {
      throw new Error('Account is suspended');
    }
    // Update avatar if provided and user doesn't have one
    if (data.avatarUrl && !existing.avatarUrl) {
      await db.user.update({
        where: { id: existing.id },
        data: { avatarUrl: data.avatarUrl },
      });
      return { ...existing, avatarUrl: data.avatarUrl };
    }
    return existing;
  }

  // Create new user - role is ALWAYS set server-side
  const randomPassword = crypto.randomUUID() + crypto.randomUUID();
  const passwordHash = await hash(randomPassword, 12);

  return db.user.create({
    data: {
      name: data.name,
      email: normalizedEmail,
      passwordHash,
      role: 'CUSTOMER', // Server-enforced, never from client
      isVerified: true,
      isActive: true,
      trustScore: 50,
      avatarUrl: data.avatarUrl,
    },
  });
}
