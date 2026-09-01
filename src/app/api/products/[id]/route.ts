import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { securityLogger } from '@/lib/security-logger';
import { safeError, validationError, unauthorized, forbidden, notFound, success } from '@/lib/secure-handler';

const patchProductSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional(),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'DAMAGED']).optional(),
  dailyPrice: z.number().positive().optional(),
  weeklyPrice: z.number().positive().optional(),
  securityDeposit: z.number().min(0).optional(),
  minRentalDays: z.number().int().min(1).optional(),
  maxRentalDays: z.number().int().min(1).optional(),
  stateId: z.string().min(1).optional(),
  cityId: z.string().min(1).optional(),
  pickupAddress: z.string().max(500).optional(),
  deliveryAvailable: z.boolean().optional(),
  deliveryFee: z.number().min(0).optional(),
  rentalRules: z.string().max(2000).optional(),
  cancellationPolicy: z.string().max(2000).optional(),
  ownerNotes: z.string().max(2000).optional(),
  brand: z.string().max(200).optional(),
  model: z.string().max(200).optional(),
  purchaseYear: z.number().int().min(1990).max(new Date().getFullYear()).optional(),
  status: z.string().optional(),
}).strict();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(request);

    const product = await db.product.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true, isVerified: true, avgRating: true, totalReviews: true, responseRate: true, totalRentals: true } },
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        reviews: {
          include: {
            reviewer: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { reviews: true, favorites: true, rentals: true } },
      },
    });

    if (!product) return notFound('Product not found');

    let isFavorited = false;
    if (session) {
      const fav = await db.favorite.findUnique({
        where: { userId_productId: { userId: session.userId, productId: id } },
      });
      isFavorited = !!fav;
    }

    return success({ ...product, isFavorited });
  } catch (error: unknown) {
    return safeError(error, 'PRODUCT_GET');
  }
}

export async function PATCH(
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
    const product = await db.product.findUnique({ where: { id } });

    if (!product) return notFound('Product not found');

    const user = await db.user.findUnique({ where: { id: session.userId } });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    if (product.ownerId !== session.userId && !isAdmin) {
      return forbidden('You do not have permission to edit this product');
    }

    const body = await request.json();
    const parsed = patchProductSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }

    // Only admins can change status
    if (parsed.data.status && !isAdmin) {
      return forbidden('Only admins can change product status');
    }

    const updated = await db.product.update({
      where: { id },
      data: parsed.data,
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    securityLogger.info('PRODUCT_UPDATED', 'Product', session.userId, { productId: id });
    return success({ product: updated });
  } catch (error: unknown) {
    return safeError(error, 'PRODUCT_PATCH');
  }
}

export async function DELETE(
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
    const product = await db.product.findUnique({ where: { id } });

    if (!product) return notFound('Product not found');

    const user = await db.user.findUnique({ where: { id: session.userId } });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    if (product.ownerId !== session.userId && !isAdmin) {
      return forbidden('You do not have permission to delete this product');
    }

    await db.product.delete({ where: { id } });

    securityLogger.info('PRODUCT_DELETED', 'Product', session.userId, { productId: id });
    return success({ message: 'Product deleted' });
  } catch (error: unknown) {
    return safeError(error, 'PRODUCT_DELETE');
  }
}
