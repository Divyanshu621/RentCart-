import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { safeError, validationError, unauthorized, success } from '@/lib/secure-handler';

const patchNotificationSchema = z.object({
  ids: z.array(z.string().min(1)).max(100, 'Cannot mark more than 100 notifications at once').optional(),
  markAll: z.boolean().optional(),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const session = await getSession(request);
    if (!session) return unauthorized();
    const rl = rateLimiters.api.check(session?.userId || clientIp);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const notifications = await db.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return success({ notifications });
  } catch (error: unknown) {
    return safeError(error, 'NOTIFICATIONS_GET');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const session = await getSession(request);
    const rl = rateLimiters.api.check(session?.userId || ip);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    if (!session) return unauthorized();

    const body = await request.json();
    const parsed = patchNotificationSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }

    if (parsed.data.markAll) {
      await db.notification.updateMany({
        where: { userId: session.userId, isRead: false },
        data: { isRead: true },
      });
      return success({ success: true });
    }

    if (parsed.data.ids && Array.isArray(parsed.data.ids)) {
      await db.notification.updateMany({
        where: { id: { in: parsed.data.ids }, userId: session.userId },
        data: { isRead: true },
      });
      return success({ success: true });
    }

    return validationError('Provide ids or markAll');
  } catch (error: unknown) {
    return safeError(error, 'NOTIFICATIONS_PATCH');
  }
}
