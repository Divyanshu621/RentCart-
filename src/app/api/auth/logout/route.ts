import { NextRequest, NextResponse } from 'next/server';
import { getSession, destroySession, clearAuthCookie } from '@/lib/auth';
import { securityLogger } from '@/lib/security-logger';
import { success, safeError } from '@/lib/secure-handler';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    const userId = session?.userId || null;

    if (session) {
      // Destroy ALL sessions for this user (complete logout)
      await destroyAllUserSessions(session.userId);
      securityLogger.info('LOGOUT', 'Auth', session.userId);
    }

    const response = success({ message: 'Logged out successfully' });
    clearAuthCookie(response);

    return response;
  } catch (error: unknown) {
    return safeError(error, 'LOGOUT');
  }
}

// Re-export for direct import
import { destroyAllUserSessions } from '@/lib/auth';
