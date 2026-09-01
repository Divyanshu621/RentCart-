// POST /api/payments/webhook
// Handles Razorpay webhook events with HMAC-SHA256 signature verification.
// Always returns 200 to prevent Razorpay from retrying.
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { safeError } from '@/lib/secure-handler';
import { securityLogger } from '@/lib/security-logger';

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  try {
    // Rate limiting
    const rl = rateLimiters.payment.check(clientIp);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    // Get raw body as text for signature verification
    const body = await request.text();
    const signature = request.headers.get('razorpay-signature');

    if (!signature) {
      securityLogger.critical('WEBHOOK_MISSING_SIGNATURE', 'Payment', null, { ip: clientIp });
      return NextResponse.json({ success: false, error: 'Missing signature' }, { status: 200 });
    }

    // Verify HMAC-SHA256 signature with constant-time comparison
    if (RAZORPAY_KEY_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      try {
        const isValid = crypto.timingSafeEqual(
          Buffer.from(expectedSignature, 'hex'),
          Buffer.from(signature, 'hex'),
        );

        if (!isValid) {
          securityLogger.critical('WEBHOOK_INVALID_SIGNATURE', 'Payment', null, { ip: clientIp });
          return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 200 });
        }
      } catch {
        // Signature lengths don't match
        securityLogger.critical('WEBHOOK_INVALID_SIGNATURE', 'Payment', null, { ip: clientIp });
        return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 200 });
      }
    }

    // Parse the verified body
    const event = JSON.parse(body);
    const eventType = event.event;
    const entity = event.payload?.payment?.entity;

    securityLogger.info('WEBHOOK_EVENT_RECEIVED', 'Payment', null, {
      eventType,
      ip: clientIp,
    });

    if (eventType === 'payment.captured' && entity) {
      const razorpayOrderId = entity.order_id;
      const razorpayPaymentId = entity.id;

      // Find payment by razorpayOrderId
      const payment = await db.payment.findFirst({
        where: { razorpayOrderId },
      });

      if (!payment) {
        securityLogger.warn('WEBHOOK_PAYMENT_NOT_FOUND', 'Payment', null, {
          eventType,
          razorpayOrderId,
        });
        return NextResponse.json({ success: true }, { status: 200 });
      }

      // Idempotency: check if already processed
      if (payment.status === 'COMPLETED' && payment.transactionId === razorpayPaymentId) {
        securityLogger.info('WEBHOOK_IDEMPOTENT_SKIP', 'Payment', null, {
          eventType,
          paymentId: payment.id,
        });
        return NextResponse.json({ success: true }, { status: 200 });
      }

      // Update payment to COMPLETED
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          transactionId: razorpayPaymentId,
          paymentMethod: 'RAZORPAY',
        },
      });

      // Update rental status to OWNER_PENDING (awaiting owner acceptance)
      await db.rental.update({
        where: { id: payment.rentalId },
        data: { status: 'OWNER_PENDING' },
      });

      securityLogger.info('WEBHOOK_PAYMENT_CAPTURED', 'Payment', null, {
        paymentId: payment.id,
        rentalId: payment.rentalId,
        razorpayPaymentId,
        amount: entity.amount,
      });
    } else if (eventType === 'payment.failed' && entity) {
      const razorpayOrderId = entity.order_id;
      const razorpayPaymentId = entity.id;

      // Find payment by razorpayOrderId
      const payment = await db.payment.findFirst({
        where: { razorpayOrderId },
      });

      if (!payment) {
        securityLogger.warn('WEBHOOK_PAYMENT_NOT_FOUND', 'Payment', null, {
          eventType,
          razorpayOrderId,
        });
        return NextResponse.json({ success: true }, { status: 200 });
      }

      // Idempotency: check if already marked as failed for this transaction
      if (payment.status === 'FAILED' && payment.transactionId === razorpayPaymentId) {
        securityLogger.info('WEBHOOK_IDEMPOTENT_SKIP', 'Payment', null, {
          eventType,
          paymentId: payment.id,
        });
        return NextResponse.json({ success: true }, { status: 200 });
      }

      // Update payment to FAILED
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          transactionId: razorpayPaymentId,
        },
      });

      securityLogger.info('WEBHOOK_PAYMENT_FAILED', 'Payment', null, {
        paymentId: payment.id,
        rentalId: payment.rentalId,
        razorpayPaymentId,
        reason: entity.error_description || entity.error_code || 'Unknown',
      });
    } else {
      // Log unhandled event types for visibility
      securityLogger.info('WEBHOOK_UNHANDLED_EVENT', 'Payment', null, {
        eventType,
        ip: clientIp,
      });
    }

    // Always return 200 - Razorpay expects 200 even on processing errors to avoid retries
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    // Log but always return 200 to prevent retries
    safeError(error, 'WEBHOOK_PROCESSING');
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
