import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { securityLogger } from '@/lib/security-logger';
import { safeError, validationError, unauthorized, forbidden, notFound, success } from '@/lib/secure-handler';

const FULL_REFUND_STATUSES = ['PENDING_PAYMENT', 'OWNER_PENDING'];
const PARTIAL_REFUND_STATUSES = ['PAYMENT_COMPLETED', 'OWNER_ACCEPTED', 'READY_FOR_PICKUP'];

const cancelBodySchema = z.object({
  reason: z.string().max(1000, 'Reason must be at most 1000 characters').optional(),
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
      include: { payments: true, product: true },
    });

    if (!rental) return notFound('Rental not found');

    // Only the customer can cancel
    if (rental.customerId !== session.userId) {
      return forbidden('Only the customer can cancel this rental');
    }

    const allCancellable = [...FULL_REFUND_STATUSES, ...PARTIAL_REFUND_STATUSES];
    if (!allCancellable.includes(rental.status)) {
      return validationError('Cannot cancel rental in its current status');
    }

    const body = await request.json().catch(() => ({}));
    const parsed = cancelBodySchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }
    const reason = parsed.data.reason || 'Customer cancelled';

    const isFullRefund = FULL_REFUND_STATUSES.includes(rental.status);
    const completedPayments = rental.payments.filter((p) => p.status === 'COMPLETED');
    const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);

    let refundAmount = 0;
    if (totalPaid > 0) {
      if (isFullRefund) {
        refundAmount = totalPaid;
      } else {
        const rentalPayments = completedPayments.filter((p) => p.type === 'RENTAL');
        const depositPayments = completedPayments.filter((p) => p.type === 'DEPOSIT');
        const rentalPaid = rentalPayments.reduce((sum, p) => sum + p.amount, 0);
        const depositPaid = depositPayments.reduce((sum, p) => sum + p.amount, 0);
        refundAmount = Math.round(rentalPaid * 0.9) + depositPaid;
      }
    }

    const updatedRental = await db.rental.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
      },
    });

    if (refundAmount > 0) {
      await db.refund.create({
        data: {
          rentalId: id,
          amount: refundAmount,
          reason: isFullRefund ? 'Full refund - rental cancelled before processing' : 'Partial refund - 10% cancellation fee applied',
          status: 'PENDING',
        },
      });

      for (const payment of completedPayments) {
        await db.payment.update({
          where: { id: payment.id },
          data: { status: 'REFUNDED' },
        });
      }

      await db.product.update({
        where: { id: rental.productId },
        data: { status: 'APPROVED' },
      });
    }

    await db.notification.create({
      data: {
        userId: rental.ownerId,
        title: 'Rental Cancelled',
        message: `Rental #${id.substring(0, 8)} for "${rental.product?.title || 'Item'}" has been cancelled by the customer.${!isFullRefund ? ` A refund of ₹${refundAmount.toLocaleString('en-IN')} will be processed.` : ''}`,
        type: 'RETURN',
      },
    });

    if (refundAmount > 0) {
      await db.notification.create({
        data: {
          userId: rental.customerId,
          title: 'Cancellation Confirmed',
          message: `Your rental #${id.substring(0, 8)} has been cancelled. ${isFullRefund ? 'Full' : 'Partial'} refund of ₹${refundAmount.toLocaleString('en-IN')} will be processed within 5-7 business days.`,
          type: 'RETURN',
        },
      });
    }

    securityLogger.info('RENTAL_CANCELLED', 'Rental', session.userId, { rentalId: id, isFullRefund, refundAmount });
    return success({
      rental: updatedRental,
      refundAmount,
      isFullRefund,
      message: isFullRefund
        ? 'Rental cancelled. Full refund will be processed.'
        : `Rental cancelled. Refund of ₹${refundAmount.toLocaleString('en-IN')} will be processed (10% cancellation fee deducted).`,
    });
  } catch (error: unknown) {
    return safeError(error, 'RENTAL_CANCEL');
  }
}
