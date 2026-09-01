import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { securityLogger } from '@/lib/security-logger';
import { safeError, validationError, unauthorized, forbidden, notFound, success } from '@/lib/secure-handler';

const extendSchema = z.object({
  requestedDays: z.number().int().min(1, 'Must request at least 1 day').max(90, 'Cannot extend more than 90 days at once'),
  reason: z.string().max(500, 'Reason must be at most 500 characters').optional(),
});

export async function POST(
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
    const body = await request.json();
    const parsed = extendSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }

    const { requestedDays, reason } = parsed.data;

    const rental = await db.rental.findUnique({ where: { id } });
    if (!rental) return notFound('Rental not found');

    if (rental.customerId !== session.userId) {
      return forbidden('Only the customer can request extension');
    }

    if (!['ACTIVE', 'RETURN_PENDING'].includes(rental.status)) {
      return validationError(`Cannot extend rental with status: ${rental.status}`);
    }

    const currentEnd = new Date(rental.endDate);
    const newEndDate = new Date(currentEnd);
    newEndDate.setDate(newEndDate.getDate() + requestedDays);

    const overlappingRentals = await db.rental.findMany({
      where: {
        productId: rental.productId,
        id: { not: id },
        status: { in: ['OWNER_ACCEPTED', 'ACTIVE', 'RETURN_PENDING'] },
        OR: [
          { startDate: { lte: newEndDate }, endDate: { gte: currentEnd } },
        ],
      },
    });

    if (overlappingRentals.length > 0) {
      return validationError('Product is not available for the extended dates');
    }

    const additionalFee = rental.dailyRate * requestedDays;

    const extension = await db.extensionRequest.create({
      data: {
        rentalId: id,
        requestedDays,
        newEndDate,
        additionalFee,
        reason,
        status: 'PENDING',
      },
    });

    await db.notification.create({
      data: {
        userId: rental.ownerId,
        title: 'Extension Requested',
        message: `Customer requested ${requestedDays} day(s) extension for rental #${id.substring(0, 8)}. Additional fee: ₹${additionalFee.toFixed(2)}`,
        type: 'RETURN',
      },
    });

    securityLogger.info('EXTENSION_REQUESTED', 'Rental', session.userId, { rentalId: id, requestedDays });
    return success({ extension }, 201);
  } catch (error: unknown) {
    return safeError(error, 'RENTAL_EXTEND');
  }
}
