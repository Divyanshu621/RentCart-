import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { unauthorized, forbidden, notFound, safeError, success, validationError } from '@/lib/secure-handler';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { securityLogger } from '@/lib/security-logger';

/**
 * CRITICAL: This simulated payment endpoint is DISABLED in production.
 * In production, all payments MUST go through Razorpay with proper verification.
 * This endpoint is kept only for development/testing purposes.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const clientIp = getClientIp(request);

  try {
    // Block simulated payments in production
    if (process.env.NODE_ENV === 'production') {
      securityLogger.critical('SIMULATED_PAYMENT_BLOCKED', 'Payment', null, { ip: clientIp });
      return forbidden('Direct payment is not available. Please use the checkout flow.');
    }

    const session = await getSession(request);
    if (!session) {
      return unauthorized();
    }

    // Rate limit payment attempts
    const rateResult = rateLimiters.payment.check(`${session.userId}`);
    if (rateResult.limited) {
      return rateLimitResponse(rateResult.retryAfterMs);
    }

    const { id } = await params;

    // Validate ID format
    if (!id || id.length < 10 || id.length > 50) {
      return validationError('Invalid rental ID');
    }

    const rental = await db.rental.findUnique({
      where: { id },
      include: { payments: true, product: { select: { title: true } } },
    });

    if (!rental) {
      return notFound('Rental not found');
    }

    // Ownership check (IDOR prevention)
    if (rental.customerId !== session.userId) {
      securityLogger.warn('PAYMENT_UNAUTHORIZED_ACCESS', 'Payment', session.userId, { rentalId: id });
      return forbidden('Only the customer can pay for this rental');
    }

    if (rental.status !== 'PENDING_PAYMENT') {
      return validationError(`Cannot pay for rental in current status`);
    }

    // Simulate payment completion (dev only)
    const payment = await db.payment.updateMany({
      where: { rentalId: id, type: 'RENTAL', status: 'PENDING' },
      data: {
        status: 'COMPLETED',
        transactionId: `DEV-TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        paymentMethod: 'SIMULATED',
      },
    });

    if (payment.count === 0) {
      return validationError('No pending payment found for this rental');
    }

    // Security deposit
    if (rental.securityDeposit > 0) {
      await db.payment.create({
        data: {
          rentalId: id,
          amount: rental.securityDeposit,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          transactionId: `DEV-DEP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          paymentMethod: 'SIMULATED',
        },
      });
    }

    const updatedRental = await db.rental.update({
      where: { id },
      data: { status: 'OWNER_PENDING' },
    });

    // Notify owner
    await db.notification.create({
      data: {
        userId: rental.ownerId,
        title: 'New Rental Request',
        message: `Payment received for "${rental.product?.title || 'Item'}". Please review and accept.`,
        type: 'RENTAL_REQUEST',
      },
    });

    securityLogger.info('SIMULATED_PAYMENT', 'Payment', session.userId, { rentalId: id });

    return success({ rental: updatedRental, message: 'Payment successful' });
  } catch (error: unknown) {
    return safeError(error, 'RENTAL_PAY');
  }
}
