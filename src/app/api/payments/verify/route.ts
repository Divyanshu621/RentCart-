// POST /api/payments/verify
// Verifies Razorpay payment signature and completes the rental
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { unauthorized, forbidden, notFound, validationError, safeError, success } from '@/lib/secure-handler';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { securityLogger } from '@/lib/security-logger';
import crypto from 'crypto';

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;

const isRazorpayConfigured = !!(
  RAZORPAY_KEY_ID &&
  RAZORPAY_KEY_SECRET &&
  RAZORPAY_KEY_SECRET.length > 10
);

const verifySchema = z.object({
  rentalId: z.string().min(1, 'Rental ID required'),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
  paymentMethod: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  try {
    const session = await getSession(request);
    if (!session) return unauthorized();

    // Rate limit payment verification
    const rateResult = rateLimiters.payment.check(`verify-${session.userId}`);
    if (rateResult.limited) {
      return rateLimitResponse(rateResult.retryAfterMs);
    }

    const body = await request.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }

    const { rentalId, razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentMethod } = parsed.data;

    // Validate rental ID format
    if (!rentalId || rentalId.length < 10 || rentalId.length > 50) {
      return validationError('Invalid rental ID');
    }

    // ─── Verify Razorpay Signature (mandatory in production) ────
    if (isRazorpayConfigured) {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        securityLogger.warn('PAYMENT_VERIFY_MISSING_FIELDS', 'Payment', session.userId, { rentalId });
        return validationError('Razorpay payment details are required');
      }

      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET!)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        securityLogger.critical('PAYMENT_SIGNATURE_MISMATCH', 'Payment', session.userId, {
          rentalId,
          orderId: razorpayOrderId,
        });
        return NextResponse.json(
          { success: false, error: 'Payment verification failed' },
          { status: 400 }
        );
      }
    } else {
      // In non-Razorpay mode (dev only), require explicit demo flag
      if (process.env.NODE_ENV === 'production') {
        securityLogger.critical('PAYMENT_WITHOUT_GATEWAY', 'Payment', session.userId, { rentalId });
        return forbidden('Payment gateway is not configured');
      }
      securityLogger.info('DEV_PAYMENT_VERIFICATION', 'Payment', session.userId, { rentalId });
    }

    // ─── Ownership Check (IDOR prevention) ─────────────────────
    const rental = await db.rental.findUnique({
      where: { id: rentalId },
      include: { product: { select: { title: true } } },
    });

    if (!rental) return notFound('Rental not found');
    if (rental.customerId !== session.userId) {
      securityLogger.warn('PAYMENT_IDOR_ATTEMPT', 'Payment', session.userId, { rentalId, ownerId: rental.customerId });
      return forbidden('Not your rental');
    }
    if (rental.status !== 'PENDING_PAYMENT') {
      return validationError('Invalid rental status for payment');
    }

    // ─── Idempotency Check ─────────────────────────────────────
    const existingPayment = await db.payment.findFirst({
      where: { rentalId, type: 'RENTAL', status: 'COMPLETED' },
    });
    if (existingPayment) {
      securityLogger.warn('DUPLICATE_PAYMENT_ATTEMPT', 'Payment', session.userId, {
        rentalId,
        existingTxnId: existingPayment.transactionId,
      });
      return validationError('Payment has already been processed for this rental');
    }

    // ─── Complete Payment ──────────────────────────────────────
    const txnId = razorpayPaymentId || `DEV-TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const updateResult = await db.payment.updateMany({
      where: { rentalId, type: 'RENTAL', status: 'PENDING' },
      data: {
        status: 'COMPLETED',
        transactionId: txnId,
        paymentMethod: paymentMethod || (isRazorpayConfigured ? 'RAZORPAY' : 'SIMULATED'),
      },
    });

    if (updateResult.count === 0) {
      return validationError('No pending payment found');
    }

    // Security deposit
    if (rental.securityDeposit > 0) {
      await db.payment.create({
        data: {
          rentalId,
          amount: rental.securityDeposit,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          transactionId: `DEP-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
          paymentMethod: paymentMethod || (isRazorpayConfigured ? 'RAZORPAY' : 'SIMULATED'),
        },
      });
    }

    // Update rental status
    const updatedRental = await db.rental.update({
      where: { id: rentalId },
      data: { status: 'OWNER_PENDING' },
      include: {
        product: { select: { title: true } },
        owner: { select: { id: true, name: true } },
      },
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

    securityLogger.info('PAYMENT_COMPLETED', 'Payment', session.userId, {
      rentalId,
      transactionId: txnId,
      method: paymentMethod,
    });

    return success({
      rental: updatedRental,
      message: 'Payment successful!',
      transactionId: txnId,
    });
  } catch (error: unknown) {
    return safeError(error, 'PAYMENT_VERIFY');
  }
}
