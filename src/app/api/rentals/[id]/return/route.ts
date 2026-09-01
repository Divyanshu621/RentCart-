import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { securityLogger } from '@/lib/security-logger';
import { safeError, validationError, unauthorized, forbidden, notFound, success } from '@/lib/secure-handler';

const VALID_INSPECTION_RESULTS = ['GOOD', 'MINOR_DAMAGE', 'MAJOR_DAMAGE', 'LOST'] as const;

const returnBodySchema = z.object({
  inspectionResult: z.enum(VALID_INSPECTION_RESULTS).optional(),
  inspectionNotes: z.string().max(2000, 'Inspection notes must be at most 2000 characters').optional(),
}).strict();

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
    const rental = await db.rental.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!rental) return notFound('Rental not found');

    const isCustomer = rental.customerId === session.userId;
    const isOwner = rental.ownerId === session.userId;

    if (!isCustomer && !isOwner) {
      return forbidden('You are not part of this rental');
    }

    const body = await request.json().catch(() => ({}));
    const parsed = returnBodySchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }

    if (isCustomer) {
      if (!['ACTIVE'].includes(rental.status)) {
        return validationError(`Cannot return rental with status: ${rental.status}`);
      }

      const updatedRental = await db.rental.update({
        where: { id },
        data: { status: 'RETURN_PENDING' },
      });

      await db.notification.create({
        data: {
          userId: rental.ownerId,
          title: 'Return Requested',
          message: `Customer has requested to return the product for rental #${id.substring(0, 8)}.`,
          type: 'RETURN',
        },
      });

      securityLogger.info('RENTAL_RETURNED', 'Rental', session.userId, { rentalId: id, role: 'customer' });
      return success({ rental: updatedRental });
    }

    // Owner processes return
    if (!['RETURN_PENDING'].includes(rental.status)) {
      return validationError(`Cannot process return with status: ${rental.status}`);
    }

    const inspectionResult = parsed.data.inspectionResult || 'GOOD';
    const inspectionNotes = parsed.data.inspectionNotes || '';

    const updatedRental = await db.rental.update({
      where: { id },
      data: {
        status: 'RETURNED',
        actualReturnDate: new Date(),
        inspectionResult,
        inspectionNotes,
      },
    });

    const inspectedRental = await db.rental.update({
      where: { id },
      data: { status: 'INSPECTION' },
    });

    if (inspectionResult === 'GOOD') {
      const depositPayments = rental.payments.filter(
        (p) => p.type === 'DEPOSIT' && p.status === 'COMPLETED'
      );
      const depositAmount = depositPayments.reduce((sum, p) => sum + p.amount, 0);

      if (depositAmount > 0) {
        await db.refund.create({
          data: {
            rentalId: id,
            amount: depositAmount,
            reason: 'Security deposit refund - good condition',
            status: 'PENDING',
          },
        });
      }
    }

    await db.notification.create({
      data: {
        userId: rental.customerId,
        title: 'Return Processed',
        message: `Owner has processed your return for rental #${id.substring(0, 8)}. Inspection result: ${inspectionResult}.`,
        type: 'RETURN',
      },
    });

    securityLogger.info('RENTAL_RETURNED', 'Rental', session.userId, { rentalId: id, role: 'owner', inspectionResult });
    return success({ rental: inspectedRental });
  } catch (error: unknown) {
    return safeError(error, 'RENTAL_RETURN');
  }
}
