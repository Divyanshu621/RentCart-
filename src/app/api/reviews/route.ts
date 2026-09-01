import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { securityLogger } from '@/lib/security-logger';
import { safeError, validationError, unauthorized, forbidden, notFound, success } from '@/lib/secure-handler';

const reviewSchema = z.object({
  rentalId: z.string().min(1, 'Rental ID is required'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().max(2000, 'Comment must be at most 2000 characters').optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const session = await getSession(request);
    const rl = rateLimiters.api.check(session?.userId || ip);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    if (!session) return unauthorized();

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }

    const { rentalId, rating, comment } = parsed.data;

    const rental = await db.rental.findUnique({
      where: { id: rentalId },
      include: { product: true },
    });

    if (!rental) return notFound('Rental not found');

    if (rental.customerId !== session.userId && rental.ownerId !== session.userId) {
      return forbidden('You are not part of this rental');
    }

    if (rental.status !== 'COMPLETED') {
      return validationError('Can only review completed rentals');
    }

    const existingReview = await db.review.findFirst({
      where: { rentalId, reviewerId: session.userId },
    });

    if (existingReview) {
      return validationError('You have already reviewed this rental');
    }

    const targetId = rental.customerId === session.userId ? rental.ownerId : rental.customerId;

    const review = await db.review.create({
      data: {
        rentalId,
        reviewerId: session.userId,
        targetId,
        productId: rental.productId,
        rating,
        comment,
      },
      include: {
        reviewer: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    const reviews = await db.review.findMany({
      where: { productId: rental.productId },
      select: { rating: true },
    });

    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;

    await db.product.update({
      where: { id: rental.productId },
      data: { avgRating, totalReviews },
    });

    const targetReviews = await db.review.findMany({
      where: { targetId },
      select: { rating: true },
    });

    const userTotalReviews = targetReviews.length;
    const userAvgRating = userTotalReviews > 0 ? targetReviews.reduce((sum, r) => sum + r.rating, 0) / userTotalReviews : 0;

    await db.user.update({
      where: { id: targetId },
      data: { avgRating: userAvgRating, totalReviews: userTotalReviews },
    });

    const reviewerReviews = await db.review.count({
      where: { reviewerId: session.userId },
    });
    await db.user.update({
      where: { id: session.userId },
      data: { totalReviews: reviewerReviews },
    });

    securityLogger.info('REVIEW_CREATED', 'Review', session.userId, { rentalId, rating });
    return success({ review }, 201);
  } catch (error: unknown) {
    return safeError(error, 'REVIEW_CREATE');
  }
}
