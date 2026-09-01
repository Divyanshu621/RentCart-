import { NextResponse } from 'next/server';

/**
 * Google OAuth configuration endpoint.
 * Returns only whether Google OAuth is configured, NOT the client ID.
 * The client ID is needed client-side for Google Sign-In, but
 * Google Client IDs are designed to be public (they're not secrets).
 * However, we only expose it when it's actually configured.
 */
export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const isConfigured = !!(clientId && clientId.length > 10);
  return NextResponse.json({
    configured: isConfigured,
    // Google Client IDs are non-secret by design - they identify the app, not authenticate it
    // The CLIENT_SECRET is the actual secret and is NEVER exposed
    clientId: isConfigured ? clientId : null,
  });
}
