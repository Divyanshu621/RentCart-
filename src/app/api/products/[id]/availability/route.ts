import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { safeError, validationError, notFound, success } from '@/lib/secure-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimiters.search.check(ip);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const { id: productId } = await params;
    const { searchParams } = new URL(request.url);

    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (!startDateStr || !endDateStr) {
      return validationError('startDate and endDate are required');
    }

    const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

    const startDateParsed = dateSchema.safeParse(startDateStr);
    const endDateParsed = dateSchema.safeParse(endDateStr);
    if (!startDateParsed.success || !endDateParsed.success) {
      return validationError('Invalid date format');
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return validationError('Invalid date format');
    }

    if (endDate <= startDate) {
      return validationError('endDate must be after startDate');
    }

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return notFound('Product not found');
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

    const unavailableDates: string[] = [];
    for (const rental of overlappingRentals) {
      const start = new Date(rental.startDate) > startDate ? new Date(rental.startDate) : startDate;
      const end = new Date(rental.endDate) < endDate ? new Date(rental.endDate) : endDate;
      const current = new Date(start);
      while (current <= end) {
        unavailableDates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    }

    return success({
      available: overlappingRentals.length === 0,
      unavailableDates,
    });
  } catch (error: unknown) {
    return safeError(error, 'PRODUCT_AVAILABILITY');
  }
}
