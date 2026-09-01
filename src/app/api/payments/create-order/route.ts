// POST /api/payments/create-order
// Creates a Razorpay order for a rental payment
// Falls back to simulated mode if RAZORPAY_KEY_ID is not configured
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { unauthorized, forbidden, validationError, notFound, safeError, success } from '@/lib/secure-handler';
import { securityLogger } from '@/lib/security-logger';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const isRazorpayConfigured = !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && RAZORPAY_KEY_ID.length > 10);

const createOrderSchema = z.object({
  rentalId: z.string().min(1, 'Rental ID is required'),
  paymentMethod: z.enum(['RAZORPAY', 'UPI', 'CARD', 'NETBANKING', 'WALLET', 'CASH_ON_PICKUP']).optional(),
});

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  try {
    // Rate limiting
    const rl = rateLimiters.payment.check(clientIp);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const session = await getSession(request);
    if (!session) {
      securityLogger.warn('PAYMENT_ORDER_UNAUTHORIZED', 'Payment', null, { ip: clientIp });
      return unauthorized();
    }

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }

    const { rentalId, paymentMethod } = parsed.data;

    // Check payment method is enabled in settings
    const paySettings = await db.paymentSettings.findUnique({ where: { id: 'default' } });
    const methodMap: Record<string, string> = {
      RAZORPAY: 'razorpay',
      UPI: 'upi',
      CARD: 'card',
      NETBANKING: 'netbanking',
      WALLET: 'wallet',
      CASH_ON_PICKUP: 'cash',
    };
    const methodKey = paymentMethod ? methodMap[paymentMethod] : 'razorpay';
    if (paySettings && methodKey) {
      const isEnabled = paySettings[`${methodKey}Enabled` as keyof typeof paySettings] as boolean | undefined;
      if (isEnabled === false) {
        return validationError('This payment method is currently disabled');
      }
    }

    const rental = await db.rental.findUnique({
      where: { id: rentalId },
      include: {
        product: { select: { title: true } },
        customer: { select: { name: true, email: true, phone: true } },
      },
    });

    if (!rental) return notFound('Rental not found');
    if (rental.customerId !== session.userId) {
      securityLogger.warn('PAYMENT_ORDER_FORBIDDEN', 'Payment', session.userId, { rentalId, ip: clientIp });
      return forbidden('Not your rental');
    }
    if (rental.status !== 'PENDING_PAYMENT') return validationError('Rental is not awaiting payment');

    const amountInPaise = Math.round(rental.totalAmount * 100);

    // Real Razorpay integration
    if (isRazorpayConfigured) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${rentalId.substring(0, 12)}`,
        notes: {
          rentalId,
          customerId: session.userId,
          productName: rental.product?.title || 'Rental',
        },
      });

      // Update payment method and store razorpayOrderId for webhook correlation
      await db.payment.updateMany({
        where: { rentalId, type: 'RENTAL', status: 'PENDING' },
        data: { paymentMethod: paymentMethod || 'RAZORPAY', razorpayOrderId: order.id },
      });

      securityLogger.info('PAYMENT_ORDER_CREATED', 'Payment', session.userId, { rentalId, amount: rental.totalAmount, method: paymentMethod || 'RAZORPAY', ip: clientIp });

      return success({
        orderId: order.id,
        amount: rental.totalAmount,
        currency: 'INR',
        key: RAZORPAY_KEY_ID,
        customer: {
          name: rental.customer?.name || '',
          email: rental.customer?.email || '',
          contact: rental.customer?.phone || '',
        },
        method: 'razorpay',
      });
    }

    // Demo/simulated mode
    await db.payment.updateMany({
      where: { rentalId, type: 'RENTAL', status: 'PENDING' },
      data: { paymentMethod: paymentMethod || 'SIMULATED' },
    });

    securityLogger.info('PAYMENT_ORDER_CREATED', 'Payment', session.userId, { rentalId, amount: rental.totalAmount, method: paymentMethod || 'SIMULATED', simulated: true, ip: clientIp });

    return success({
      orderId: `order_demo_${Date.now()}`,
      amount: rental.totalAmount,
      currency: 'INR',
      key: null,
      customer: {
        name: rental.customer?.name || '',
        email: rental.customer?.email || '',
        contact: rental.customer?.phone || '',
      },
      method: 'simulated',
    });
  } catch (error: unknown) {
    return safeError(error, 'CREATE_ORDER');
  }
}
