import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { securityLogger } from '@/lib/security-logger';
import { safeError, validationError, unauthorized, forbidden, notFound, success } from '@/lib/secure-handler';

const VALID_DISPUTE_STATUSES = ['OPEN', 'UNDER_REVIEW', 'CUSTOMER_RESPONSE', 'OWNER_RESPONSE', 'RESOLVED', 'REJECTED'] as const;

const patchDisputeSchema = z.object({
  status: z.enum(VALID_DISPUTE_STATUSES).optional(),
  resolution: z.string().max(2000).optional(),
  adminNotes: z.string().max(2000).optional(),
}).strict();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clientIp = getClientIp(request);
    const session = await getSession(request);
    if (!session) return unauthorized();
    const rl = rateLimiters.api.check(session?.userId || clientIp);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const { id } = await params;

    const dispute = await db.dispute.findUnique({
      where: { id },
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
    });

    if (!dispute) return notFound('Dispute not found');

    const user = await db.user.findUnique({ where: { id: session.userId } });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    if (dispute.raisedById !== session.userId && dispute.againstId !== session.userId && !isAdmin) {
      return forbidden('You do not have access to this dispute');
    }

    return success({ dispute });
  } catch (error: unknown) {
    return safeError(error, 'DISPUTE_GET');
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(request);
    const session = await getSession(request);
    const rl = rateLimiters.api.check(session?.userId || ip);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    if (!session) return unauthorized();

    const user = await db.user.findUnique({ where: { id: session.userId } });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    if (!isAdmin) {
      return forbidden('Admin access required');
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = patchDisputeSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }

    const dispute = await db.dispute.findUnique({ where: { id } });
    if (!dispute) return notFound('Dispute not found');

    const updateData: Record<string, unknown> = {};
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.resolution !== undefined) updateData.resolution = parsed.data.resolution;
    if (parsed.data.adminNotes !== undefined) updateData.adminNotes = parsed.data.adminNotes;

    const updated = await db.dispute.update({
      where: { id },
      data: updateData,
      include: {
        rental: {
          include: {
            product: { select: { id: true, title: true } },
          },
        },
      },
    });

    securityLogger.info('DISPUTE_UPDATED', 'Dispute', session.userId, { disputeId: id });
    return success({ dispute: updated });
  } catch (error: unknown) {
    return safeError(error, 'DISPUTE_PATCH');
  }
}
