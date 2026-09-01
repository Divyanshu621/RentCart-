import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { safeError, validationError, unauthorized, forbidden, success } from '@/lib/secure-handler';
import { securityLogger } from '@/lib/security-logger';

const createProductSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be at most 200 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().max(2000, 'Description must be at most 2000 characters').optional(),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'DAMAGED']),
  dailyPrice: z.number().positive('Daily price must be positive'),
  weeklyPrice: z.number().positive().optional(),
  securityDeposit: z.number().min(0, 'Security deposit must be non-negative'),
  minRentalDays: z.number().int().min(1, 'Minimum rental days must be at least 1'),
  maxRentalDays: z.number().int().min(1, 'Maximum rental days must be at least 1'),
  stateId: z.string().min(1, 'State is required'),
  cityId: z.string().min(1, 'City is required'),
  pickupAddress: z.string().max(500, 'Pickup address must be at most 500 characters').optional(),
  deliveryAvailable: z.boolean(),
  deliveryFee: z.number().min(0, 'Delivery fee must be non-negative'),
  rentalRules: z.string().max(2000).optional(),
  cancellationPolicy: z.string().max(2000).optional(),
  brand: z.string().max(200).optional(),
  model: z.string().max(200).optional(),
  purchaseYear: z.number().int().min(1990).max(new Date().getFullYear()).optional(),
  ownerNotes: z.string().max(2000).optional(),
  imageUrls: z.array(z.string().max(2048).url().or(z.string().max(2048).startsWith('/'))).max(5, 'Maximum 5 images allowed').optional(),
});

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  return base;
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  const existing = await db.product.findUnique({ where: { slug } });
  if (!existing) return slug;

  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let random = '';
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  slug = `${baseSlug}-${random}`;
  return slug;
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimiters.search.check(ip);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const session = await getSession(request).catch(() => null);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId');
    const stateId = searchParams.get('stateId');
    const cityId = searchParams.get('cityId');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const condition = searchParams.get('condition');
    const sort = searchParams.get('sort') || 'newest';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const ownerId = searchParams.get('ownerId');
    const favorited = searchParams.get('favorited');
    const deliveryAvailable = searchParams.get('deliveryAvailable');
    const where: Record<string, unknown> = {};

    if (ownerId) {
      where.ownerId = ownerId;
    } else {
      where.status = 'APPROVED';
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { brand: { contains: search } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (stateId) where.stateId = stateId;
    if (cityId) where.cityId = cityId;
    if (minPrice) where.dailyPrice = { ...((where.dailyPrice as Record<string, unknown>) || {}), gte: parseFloat(minPrice) };
    if (maxPrice) where.dailyPrice = { ...((where.dailyPrice as Record<string, unknown>) || {}), lte: parseFloat(maxPrice) };
    if (minPrice && maxPrice) where.dailyPrice = { gte: parseFloat(minPrice), lte: parseFloat(maxPrice) };
    if (condition) where.condition = condition;
    if (deliveryAvailable === 'true') where.deliveryAvailable = true;

    // Filter by user's favorites
    if (favorited === 'true' && session) {
      const favoriteIds = await db.favorite.findMany({
        where: { userId: session.userId },
        select: { productId: true },
      });
      where.id = { in: favoriteIds.map(f => f.productId) };
    } else if (favorited === 'true') {
      // Not logged in - return nothing for favorites
      where.id = { in: [] };
    }

    let orderBy: Record<string, string>[] | Record<string, string> = { createdAt: 'desc' };
    if (sort === 'price_asc' || sort === 'price_low') orderBy = { dailyPrice: 'asc' };
    else if (sort === 'price_desc' || sort === 'price_high') orderBy = { dailyPrice: 'desc' };
    else if (sort === 'recommended') orderBy = [{ totalRentals: 'desc' }, { createdAt: 'desc' }];
    else if (sort === 'rating') orderBy = { avgRating: 'desc' };
    else if (sort === 'most_rented') orderBy = { totalRentals: 'desc' };

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, avatarUrl: true, isVerified: true, avgRating: true, totalReviews: true, trustScore: true } },
          category: { select: { id: true, name: true, slug: true } },
          state: { select: { id: true, name: true, code: true } },
          city: { select: { id: true, name: true, stateId: true } },
          images: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { reviews: true, favorites: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return success({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    return safeError(error, 'PRODUCTS_LIST');
  }
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  try {
    const session = await getSession(request);
    const rl = rateLimiters.api.check(session?.userId || clientIp);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    if (!session) return unauthorized();

    // Auto-upgrade CUSTOMER → OWNER so anyone can list items
    const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true, kycStatus: true } });
    if (!user) return forbidden('User not found');

    let actualRole = user.role;
    if (user.role === 'CUSTOMER') {
      actualRole = 'OWNER';
      await db.user.update({
        where: { id: session.userId },
        data: { role: 'OWNER', kycStatus: user.kycStatus === 'NOT_REQUIRED' ? 'PENDING' : user.kycStatus },
      });
      securityLogger.info('AUTO_UPGRADED_TO_OWNER', 'Product', session.userId, { ip: clientIp });
    }

    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }

    const data = parsed.data;
    const imageUrls = data.imageUrls || [];
    const { imageUrls: _i, ...productData } = data;
    const slug = await ensureUniqueSlug(generateSlug(data.title));

    const product = await db.product.create({
      data: {
        ownerId: session.userId,
        title: data.title,
        slug,
        categoryId: data.categoryId,
        description: data.description,
        condition: data.condition,
        brand: data.brand,
        model: data.model,
        purchaseYear: data.purchaseYear,
        dailyPrice: data.dailyPrice,
        weeklyPrice: data.weeklyPrice,
        securityDeposit: data.securityDeposit,
        minRentalDays: data.minRentalDays,
        maxRentalDays: data.maxRentalDays,
        stateId: data.stateId,
        cityId: data.cityId,
        pickupAddress: data.pickupAddress,
        deliveryAvailable: data.deliveryAvailable,
        deliveryFee: data.deliveryFee,
        rentalRules: data.rentalRules,
        cancellationPolicy: data.cancellationPolicy,
        ownerNotes: data.ownerNotes,
        status: 'PENDING_REVIEW',
        images: imageUrls.length > 0 ? {
          create: imageUrls.map((url, idx) => ({
            url,
            altText: data.title,
            sortOrder: idx,
          })),
        } : undefined,
      },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    securityLogger.info('PRODUCT_CREATED', 'Product', session.userId, { productId: product.id, ip: clientIp });

    return success({ product }, 201);
  } catch (error: unknown) {
    return safeError(error, 'PRODUCT_CREATE');
  }
}
