import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { securityLogger } from '@/lib/security-logger';
import { safeError, validationError, unauthorized, success } from '@/lib/secure-handler';

const createRentalSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  couponCode: z.string().max(50).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const session = await getSession(request);
    if (!session) return unauthorized();
    const rl = rateLimiters.api.check(session?.userId || clientIp);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const role = searchParams.get('role') || 'customer';

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (role === 'owner') {
      where.ownerId = session.userId;
    } else {
      where.customerId = session.userId;
    }

    const rentals = await db.rental.findMany({
      where,
      include: {
        product: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, category: { select: { name: true } } } },
        customer: { select: { id: true, name: true, avatarUrl: true } },
        owner: { select: { id: true, name: true, avatarUrl: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success({ rentals });
  } catch (error: unknown) {
    return safeError(error, 'RENTALS_LIST', null);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const session = await getSession(request);
    const rl = rateLimiters.api.check(session?.userId || ip);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    if (!session) return unauthorized();

    const body = await request.json();
    const parsed = createRentalSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }

    const { productId, startDate: startDateStr, endDate: endDateStr, couponCode } = parsed.data;

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return validationError('Invalid date format');
    }

    if (endDate <= startDate) {
      return validationError('End date must be after start date');
    }

    const product = await db.product.findUnique({
      where: { id: productId },
      include: { owner: true },
    });

    if (!product) return validationError('Product not found');

    if (product.status !== 'APPROVED') {
      return validationError('Product is not available for rental');
    }

    if (product.ownerId === session.userId) {
      return validationError('Cannot rent your own product');
    }

    const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (rentalDays < product.minRentalDays) {
      return validationError(`Minimum rental period is ${product.minRentalDays} days`);
    }

    if (rentalDays > product.maxRentalDays) {
      return validationError(`Maximum rental period is ${product.maxRentalDays} days`);
    }

    const overlappingRentals = await db.rental.findMany({
      where: {
        productId,
        status: { in: ['OWNER_ACCEPTED', 'ACTIVE', 'RETURN_PENDING'] },
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } },
        ],
      },
    });

    if (overlappingRentals.length > 0) {
      return validationError('Product is not available for the selected dates');
    }

    const dailyRate = product.dailyPrice;
    const rentalAmount = dailyRate * rentalDays;
    const platformFee = rentalAmount * 0.10;
    const deliveryFee = product.deliveryAvailable ? product.deliveryFee : 0;
    let discount = 0;

    let couponUsed: Record<string, unknown> | null = null;
    if (couponCode) {
      const coupon = await db.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
      if (!coupon || !coupon.isActive) {
        return validationError('Invalid or inactive coupon');
      }

      const now = new Date();
      if (coupon.validUntil && coupon.validUntil < now) {
        return validationError('Coupon has expired');
      }
      if (coupon.validFrom > now) {
        return validationError('Coupon is not yet valid');
      }
      if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
        return validationError('Coupon usage limit reached');
      }

      const userUsages = await db.couponUsage.count({
        where: { couponId: coupon.id, userId: session.userId },
      });
      if (userUsages >= coupon.perUserLimit) {
        return validationError('You have already used this coupon');
      }

      if (rentalAmount < coupon.minOrder) {
        return validationError(`Minimum order amount for this coupon is ₹${coupon.minOrder}`);
      }

      if (coupon.type === 'PERCENTAGE') {
        discount = rentalAmount * (coupon.value / 100);
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else {
        discount = coupon.value;
      }

      couponUsed = coupon;
    }

    const tax = rentalAmount * 0.18;
    const totalAmount = rentalAmount + platformFee + deliveryFee + tax - discount;

    const rental = await db.rental.create({
      data: {
        customerId: session.userId,
        ownerId: product.ownerId,
        productId,
        startDate,
        endDate,
        rentalDays,
        dailyRate,
        rentalAmount,
        securityDeposit: product.securityDeposit,
        platformFee,
        deliveryFee,
        tax,
        discount,
        totalAmount,
        status: 'PENDING_PAYMENT',
      },
      include: {
        product: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, category: { select: { name: true } } } },
        customer: { select: { id: true, name: true, avatarUrl: true } },
        owner: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    await db.payment.create({
      data: {
        rentalId: rental.id,
        amount: totalAmount,
        type: 'RENTAL',
        status: 'PENDING',
      },
    });

    if (couponUsed) {
      await db.couponUsage.create({
        data: { couponId: couponUsed.id, userId: session.userId, rentalId: rental.id },
      });
      await db.coupon.update({
        where: { id: couponUsed.id },
        data: { timesUsed: { increment: 1 } },
      });
    }

    securityLogger.info('RENTAL_CREATED', 'Rental', session.userId);
    return success({ rental }, 201);
  } catch (error: unknown) {
    return safeError(error, 'RENTAL_CREATE');
  }
}
