import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { safeError, notFound, success } from '@/lib/secure-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return notFound('Product not found');
    }

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where: { productId },
        include: {
          reviewer: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.review.count({ where: { productId } }),
    ]);

    return success({
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      avgRating: product.avgRating,
      totalReviews: product.totalReviews,
    });
  } catch (error: unknown) {
    return safeError(error, 'PRODUCT_REVIEWS_GET');
  }
}
