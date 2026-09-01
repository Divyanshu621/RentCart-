import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { safeError, validationError, unauthorized, success } from '@/lib/secure-handler';

const validateSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').max(50, 'Coupon code must be at most 50 characters'),
  orderAmount: z.number().min(0).optional(),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const session = await getSession(request);
    const rl = rateLimiters.coupon.check(session?.userId || ip);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    if (!session) return unauthorized();

    const body = await request.json();
    const parsed = validateSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }

    const { code, orderAmount } = parsed.data;
    const couponCode = code.toUpperCase();

    const coupon = await db.coupon.findUnique({ where: { code: couponCode } });

    if (!coupon) {
      return success({ valid: false, error: 'Coupon not found' });
    }

    if (!coupon.isActive) {
      return success({ valid: false, error: 'Coupon is inactive' });
    }

    const now = new Date();
    if (coupon.validFrom > now) {
      return success({ valid: false, error: 'Coupon is not yet valid' });
    }
    if (coupon.validUntil && coupon.validUntil < now) {
      return success({ valid: false, error: 'Coupon has expired' });
    }

    if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
      return success({ valid: false, error: 'Coupon usage limit reached' });
    }

    const userUsages = await db.couponUsage.count({
      where: { couponId: coupon.id, userId: session.userId },
    });
    if (userUsages >= coupon.perUserLimit) {
      return success({ valid: false, error: 'You have already used this coupon' });
    }

    let discountAmount = 0;
    if (orderAmount !== undefined) {
      if (orderAmount < coupon.minOrder) {
        return success({ valid: false, error: `Minimum order amount is ₹${coupon.minOrder}` });
      }

      if (coupon.type === 'PERCENTAGE') {
        discountAmount = orderAmount * (coupon.value / 100);
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      } else {
        discountAmount = coupon.value;
      }
    }

    return success({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        maxDiscount: coupon.maxDiscount,
        minOrder: coupon.minOrder,
      },
      discountAmount,
    });
  } catch (error: unknown) {
    return safeError(error, 'COUPON_VALIDATE');
  }
}
