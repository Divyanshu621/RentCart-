import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { securityLogger } from '@/lib/security-logger';
import { safeError, validationError, unauthorized, forbidden, notFound, success } from '@/lib/secure-handler';

const disputeSchema = z.object({
  rentalId: z.string().min(1, 'Rental ID is required'),
  reason: z.string().min(1, 'Reason is required').max(200, 'Reason must be at most 200 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description must be at most 5000 characters'),
});

export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const session = await getSession(request);
    if (!session) return unauthorized();
    const rl = rateLimiters.api.check(session?.userId || clientIp);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const user = await db.user.findUnique({ where: { id: session.userId } });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    const where: Record<string, unknown> = isAdmin ? {} : { raisedById: session.userId };

    const disputes = await db.dispute.findMany({
      where,
      include: {
        rental: {
          include: {
            product: { select: { id: true, title: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } } },
            customer: { select: { id: true, name: true, avatarUrl: true } },
            owner: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        raisedBy: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success({ disputes });
  } catch (error: unknown) {
    return safeError(error, 'DISPUTES_LIST');
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const session = await getSession(request);
    const rl = rateLimiters.api.check(session?.userId || ip);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    if (!session) return unauthorized();

    const body = await request.json();
    const parsed = disputeSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }

    const { rentalId, reason, description } = parsed.data;

    const rental = await db.rental.findUnique({ where: { id: rentalId } });
    if (!rental) return notFound('Rental not found');

    if (rental.customerId !== session.userId && rental.ownerId !== session.userId) {
      return forbidden('You are not part of this rental');
    }

    const againstId = rental.customerId === session.userId ? rental.ownerId : rental.customerId;

    const dispute = await db.dispute.create({
      data: {
        rentalId,
        raisedById: session.userId,
        againstId,
        reason,
        description,
        status: 'OPEN',
      },
    });

    const admins = await db.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      select: { id: true },
    });

    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: 'New Dispute Raised',
          message: `A new dispute has been raised for rental #${rentalId.substring(0, 8)}. Reason: ${reason}`,
          type: 'DISPUTE',
        },
      });
    }

    securityLogger.info('DISPUTE_CREATED', 'Dispute', session.userId);
    return success({ dispute }, 201);
  } catch (error: unknown) {
    return safeError(error, 'DISPUTE_CREATE');
  }
}
