import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { unauthorized, notFound, safeError, success } from '@/lib/secure-handler';
import { securityLogger } from '@/lib/security-logger';

export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rl = rateLimiters.api.check(clientIp);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const session = await getSession(request);
    if (!session) {
      securityLogger.warn('AUTH_ME_UNAUTHORIZED', 'Session', null, { ip: clientIp });
      return unauthorized();
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: {
        state: true,
        city: true,
      },
    });

    if (!user) {
      securityLogger.warn('AUTH_ME_USER_NOT_FOUND', 'User', session.userId);
      return notFound('User not found');
    }

    const { passwordHash: _, ...userWithoutPassword } = user;

    return success({ user: userWithoutPassword });
  } catch (error: unknown) {
    return safeError(error, 'AUTH_ME');
  }
}
