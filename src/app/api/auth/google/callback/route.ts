import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession, setAuthCookie } from '@/lib/auth';
import { findOrCreateGoogleUser } from '../route';
import { securityLogger } from '@/lib/security-logger';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const APP_URL = process.env.NEXTAUTH_URL || process.env.APP_URL || '';

const isGoogleConfigured = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.length > 10 && GOOGLE_CLIENT_SECRET);

interface GoogleTokenResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  locale?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      securityLogger.warn('GOOGLE_AUTH_ERROR', 'Auth', null, { error });
      return redirectToAppWithError(request, 'Google auth failed');
    }

    if (!code) {
      return redirectToAppWithError(request, 'No authorization code received');
    }

    if (!isGoogleConfigured) {
      securityLogger.critical('GOOGLE_OAUTH_NOT_CONFIGURED_CALLBACK', 'Auth', null);
      return redirectToAppWithError(request, 'Google OAuth is not configured');
    }

    // 1. Exchange code for tokens (server-to-server, no client access to secret)
    const redirectUri = `${APP_URL || new URL(request.url).origin}/api/auth/google/callback`;
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      securityLogger.error('GOOGLE_TOKEN_EXCHANGE_FAILED', 'Auth', null);
      return redirectToAppWithError(request, 'Authentication failed');
    }

    const tokens = await tokenRes.json() as GoogleTokenResponse;

    // 2. Get user info from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      securityLogger.error('GOOGLE_USERINFO_FAILED', 'Auth', null);
      return redirectToAppWithError(request, 'Authentication failed');
    }

    const googleUser = await userRes.json() as GoogleUserInfo;

    if (!googleUser.verified_email) {
      securityLogger.warn('GOOGLE_EMAIL_NOT_VERIFIED', 'Auth', null, { email: googleUser.email });
      return redirectToAppWithError(request, 'Your Google email is not verified');
    }

    // 3. Find or create user in our database
    const user = await findOrCreateGoogleUser({
      email: googleUser.email,
      name: googleUser.name,
      googleId: googleUser.id,
      avatarUrl: googleUser.picture || null,
    });

    // 4. Create our session
    const token = await createSession(user.id, request);

    securityLogger.info('GOOGLE_LOGIN_SUCCESS', 'Auth', user.id);

    // 5. Redirect to app with secure httpOnly session cookie
    const redirectUrl = `${APP_URL || new URL(request.url).origin}/`;

    const response = NextResponse.redirect(redirectUrl);
    setAuthCookie(response, token);

    // Store minimal user info in a short-lived, httpOnly cookie for the frontend
    const { passwordHash: _, ...userWithoutPassword } = user;
    response.cookies.set('google_auth_success', JSON.stringify(userWithoutPassword), {
      httpOnly: true, // CHANGED: was false, now httpOnly
      sameSite: 'lax',
      maxAge: 10,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (err) {
    securityLogger.error('GOOGLE_CALLBACK_ERROR', 'Auth', null);
    return redirectToAppWithError(request, 'Authentication failed');
  }
}

function redirectToAppWithError(request: NextRequest, message: string) {
  const origin = APP_URL || new URL(request.url).origin;
  const url = new URL(origin);
  url.searchParams.set('auth_error', message);
  return NextResponse.redirect(url.toString());
}