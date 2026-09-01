import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { unauthorized, forbidden, notFound, validationError, safeError, success } from '@/lib/secure-handler';
import { securityLogger } from '@/lib/security-logger';

const validRentalStatuses = [
  'PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED',
  'CANCELLED', 'OVERDUE', 'DISPUTED', 'RETURNED',
] as const;

const updateRentalSchema = z.object({
  action: z.enum(['refund', 'resolve_dispute']).optional(),
  status: z.enum(validRentalStatuses).optional(),
  refundAmount: z.number().positive().optional(),
  notes: z.string().max(1000).optional(),
  adminNotes: z.string().max(1000).optional(),
}).refine(
  (data) => {
    // If action is refund, refundAmount is required
    if (data.action === 'refund' && !data.refundAmount) return false;
    return true;
  },
  { message: 'refundAmount is required when action is refund', path: ['refundAmount'] }
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let adminUserId: string | null = null;
  try {
    const clientIp = getClientIp(request);
    const rl = rateLimiters.admin.check(clientIp);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const session = await getSession(request);
    if (!session) {
      securityLogger.warn('ADMIN_RENTAL_UPDATE_UNAUTHORIZED', 'AdminRental', null, { ip: clientIp });
      return unauthorized();
    }
    adminUserId = session.userId;

    const currentUser = await db.user.findUnique({ where: { id: session.userId } });
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      securityLogger.error('ADMIN_RENTAL_UPDATE_FORBIDDEN', 'AdminRental', session.userId, { role: currentUser?.role, ip: clientIp });
      return forbidden('Admin access required');
    }

    const { id } = await params;
    const rental = await db.rental.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, title: true } },
        customer: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        payments: true,
      },
    });

    if (!rental) {
      return notFound('Rental not found');
    }

    const body = await request.json();
    const parsed = updateRentalSchema.safeParse(body);

    if (!parsed.success) {
      return validationError('Invalid request parameters');
    }

    const { action, status: newStatus, refundAmount, notes, adminNotes } = parsed.data;

    const updateData: Record<string, unknown> = {};
    let auditAction = '';

    // Admin status change
    if (newStatus) {
      updateData.status = newStatus;
      auditAction = `ADMIN_CHANGE_STATUS_TO_${newStatus}`;
    }

    // Process refund
    if (action === 'refund' && refundAmount) {
      await db.refund.create({
        data: {
          rentalId: id,
          amount: refundAmount,
          reason: notes || 'Admin initiated refund',
          status: 'PENDING',
        },
      });
      auditAction = 'ADMIN_PROCESS_REFUND';
    }

    // Resolve dispute
    if (action === 'resolve_dispute') {
      await db.dispute.updateMany({
        where: { rentalId: id, status: { in: ['OPEN', 'UNDER_REVIEW'] } },
        data: { status: 'RESOLVED', resolution: notes || 'Resolved by admin', adminNotes },
      });
      auditAction = 'ADMIN_RESOLVE_DISPUTE';
    }

    const updated = await db.rental.update({
      where: { id },
      data: updateData,
      include: {
        product: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, category: { select: { name: true } } } },
        customer: { select: { id: true, name: true, avatarUrl: true } },
        owner: { select: { id: true, name: true, avatarUrl: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: auditAction || 'ADMIN_UPDATE_RENTAL',
        entity: 'Rental',
        entityId: id,
        details: `Admin ${currentUser.name} updated rental #${id.substring(0, 8)}. ${notes ? `Notes: ${notes}` : ''}`,
      },
    });

    securityLogger.info('ADMIN_RENTAL_UPDATE_SUCCESS', 'AdminRental', session.userId, {
      rentalId: id,
      action: auditAction,
      newStatus: newStatus || undefined,
    });

    // Notify affected users
    if (newStatus) {
      await db.notification.create({
        data: {
          userId: rental.customerId,
          title: 'Rental Status Updated',
          message: `Admin updated your rental #${id.substring(0, 8)} status to ${newStatus}.`,
          type: 'RENTAL_REQUEST',
        },
      });
      await db.notification.create({
        data: {
          userId: rental.ownerId,
          title: 'Rental Status Updated',
          message: `Admin updated rental #${id.substring(0, 8)} status to ${newStatus}.`,
          type: 'RENTAL_REQUEST',
        },
      });
    }

    return success({ rental: updated });
  } catch (error: unknown) {
    return safeError(error, 'ADMIN_RENTAL_UPDATE', adminUserId);
  }
}
