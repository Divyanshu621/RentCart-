import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { securityLogger } from '@/lib/security-logger';
import { safeError, validationError, unauthorized, forbidden, notFound, success } from '@/lib/secure-handler';

const respondSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED']),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; extId: string }> }
) {
  try {
    const ip = getClientIp(request);
    const session = await getSession(request);
    const rl = rateLimiters.api.check(session?.userId || ip);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    if (!session) return unauthorized();

    const { id, extId } = await params;
    const body = await request.json();
    const parsed = respondSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }

    const { action } = parsed.data;

    const rental = await db.rental.findUnique({ where: { id } });
    if (!rental) return notFound('Rental not found');

    if (rental.ownerId !== session.userId) {
      return forbidden('Only the owner can respond to extension requests');
    }

    const extension = await db.extensionRequest.findUnique({ where: { id: extId } });
    if (!extension || extension.rentalId !== id) {
      return notFound('Extension request not found');
    }

    if (extension.status !== 'PENDING') {
      return validationError('Extension request already processed');
    }

    const updatedExtension = await db.extensionRequest.update({
      where: { id: extId },
      data: { status: action },
    });

    if (action === 'APPROVED') {
      const updatedRental = await db.rental.update({
        where: { id },
        data: { endDate: extension.newEndDate },
      });

      await db.payment.create({
        data: {
          rentalId: id,
          amount: extension.additionalFee,
          type: 'EXTENSION',
          status: 'PENDING',
        },
      });

      await db.notification.create({
        data: {
          userId: rental.customerId,
          title: 'Extension Approved',
          message: `Owner approved your ${extension.requestedDays} day extension for rental #${id.substring(0, 8)}. Please pay the additional fee of ₹${extension.additionalFee.toFixed(2)}.`,
          type: 'PAYMENT',
        },
      });

      securityLogger.info('EXTENSION_RESPONDED', 'Rental', session.userId, { rentalId: id, extId, action });
      return success({ extension: updatedExtension, rental: updatedRental });
    }

    await db.notification.create({
      data: {
        userId: rental.customerId,
        title: 'Extension Rejected',
        message: `Owner rejected your extension request for rental #${id.substring(0, 8)}.`,
        type: 'RETURN',
      },
    });

    securityLogger.info('EXTENSION_RESPONDED', 'Rental', session.userId, { rentalId: id, extId, action });
    return success({ extension: updatedExtension });
  } catch (error: unknown) {
    return safeError(error, 'EXTENSION_RESPOND');
  }
}
