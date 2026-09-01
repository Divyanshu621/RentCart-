// POST /api/auth/rotate-session
// Rotates the current session token (invalidates old, issues new).
import { NextRequest, NextResponse } from 'next/server';
import { getSession, rotateSession, setAuthCookie } from '@/lib/auth';
import { safeError, success, unauthorized } from '@/lib/secure-handler';

export async function POST(request: NextRequest) {
  try {
    // Get current session from cookie or Authorization header
    const session = await getSession(request);
    if (!session) return unauthorized();

    // Extract the raw token from the request
    const currentToken =
      request.cookies.get('token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '') ||
      '';

    if (!currentToken) return unauthorized();

    // Rotate the session
    const newToken = await rotateSession(currentToken, request);

    // Build response and set new cookie
    const response = success({ message: 'Session rotated' });
    setAuthCookie(response, newToken);

    return response;
  } catch (error) {
    return safeError(error, 'ROTATE_SESSION');
  }
}
