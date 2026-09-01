import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { safeError, unauthorized, notFound, success } from '@/lib/secure-handler';

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

    const { id: productId } = await params;

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) return notFound('Product not found');

    const existing = await db.favorite.findUnique({
      where: { userId_productId: { userId: session.userId, productId } },
    });

    let isFavorited: boolean;

    if (existing) {
      await db.favorite.delete({ where: { id: existing.id } });
      isFavorited = false;
    } else {
      await db.favorite.create({
        data: { userId: session.userId, productId },
      });
      isFavorited = true;
    }

    return success({ isFavorited });
  } catch (error: unknown) {
    return safeError(error, 'PRODUCT_FAVORITE');
  }
}
