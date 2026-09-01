import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { securityLogger } from '@/lib/security-logger';
import { safeError, validationError, unauthorized, forbidden, notFound, success } from '@/lib/secure-handler';

const VALID_STATUSES = [
  'PENDING_PAYMENT', 'OWNER_PENDING', 'OWNER_ACCEPTED', 'OWNER_REJECTED',
  'READY_FOR_PICKUP', 'ACTIVE', 'RETURN_PENDING', 'INSPECTION',
  'RETURNED', 'COMPLETED', 'CANCELLED', 'OVERDUE', 'SUSPENDED',
];

const patchRentalSchema = z.object({
  status: z.enum(VALID_STATUSES as [string, ...string[]]).optional(),
  cancellationReason: z.string().max(1000).optional(),
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

    const rental = await db.rental.findUnique({
      where: { id },
      include: {
        product: { include: { images: { orderBy: { sortOrder: 'asc' } }, category: true, owner: { select: { id: true, name: true } } } },
        customer: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true, address: true, pinCode: true, city: true, state: true } },
        owner: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true, address: true, pinCode: true, city: true, state: true } },
        payments: { orderBy: { createdAt: 'desc' } },
        refunds: { orderBy: { createdAt: 'desc' } },
        extensionRequests: { orderBy: { createdAt: 'desc' } },
        reviews: true,
        disputes: true,
      },
    });

    if (!rental) return notFound('Rental not found');

    const user = await db.user.findUnique({ where: { id: session.userId } });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    if (rental.customerId !== session.userId && rental.ownerId !== session.userId && !isAdmin) {
      return forbidden('You do not have access to this rental');
    }

    return success({ rental });
  } catch (error: unknown) {
    return safeError(error, 'RENTAL_GET');
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

    const { id } = await params;
    const rental = await db.rental.findUnique({ where: { id } });

    if (!rental) return notFound('Rental not found');

    const user = await db.user.findUnique({ where: { id: session.userId } });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    const isOwner = rental.ownerId === session.userId;
    const isCustomer = rental.customerId === session.userId;

    const body = await request.json();
    const parsed = patchRentalSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }

    const { status, cancellationReason } = parsed.data;

    if (status) {
      const ownerStatuses = ['OWNER_ACCEPTED', 'OWNER_REJECTED', 'READY_FOR_PICKUP'];
      if (ownerStatuses.includes(status) && !isOwner && !isAdmin) {
        return forbidden('Only the owner can perform this action');
      }

      const adminStatuses = ['ACTIVE', 'COMPLETED', 'CANCELLED', 'SUSPENDED'];
      if (adminStatuses.includes(status) && !isAdmin) {
        return forbidden('Only admin can perform this action');
      }

      // Only customer can request cancellation via PATCH
      if (status === 'CANCELLED' && !isCustomer && !isAdmin) {
        return forbidden('Only the customer can cancel this rental');
      }

      const updateData: Record<string, unknown> = { status };

      if (status === 'OWNER_ACCEPTED') {
        await db.product.update({
          where: { id: rental.productId },
          data: { totalRentals: { increment: 1 } },
        });
      }

      if (cancellationReason) {
        updateData.cancellationReason = cancellationReason;
      }

      const updated = await db.rental.update({
        where: { id },
        data: updateData,
      });

      securityLogger.info('RENTAL_STATUS_CHANGED', 'Rental', session.userId, { rentalId: id, status });
      return success({ rental: updated });
    }

    if (cancellationReason) {
      const updated = await db.rental.update({
        where: { id },
        data: { cancellationReason },
      });
      return success({ rental: updated });
    }

    return validationError('No valid fields to update');
  } catch (error: unknown) {
    return safeError(error, 'RENTAL_PATCH');
  }
}
