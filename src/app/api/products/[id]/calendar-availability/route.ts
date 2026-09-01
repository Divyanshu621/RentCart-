import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { safeError, notFound, success } from '@/lib/secure-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimiters.search.check(ip);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const { id: productId } = await params;

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return notFound('Product not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 90);

    const activeRentals = await db.rental.findMany({
      where: {
        productId,
        status: { in: ['OWNER_ACCEPTED', 'ACTIVE', 'RETURN_PENDING'] },
        OR: [
          { startDate: { lte: futureDate }, endDate: { gte: today } },
        ],
      },
    });

    const unavailableDates: string[] = [];
    for (const rental of activeRentals) {
      const rentalStart = new Date(rental.startDate);
      rentalStart.setHours(0, 0, 0, 0);
      const rentalEnd = new Date(rental.endDate);
      rentalEnd.setHours(0, 0, 0, 0);

      const start = rentalStart > today ? rentalStart : today;
      const end = rentalEnd < futureDate ? rentalEnd : futureDate;

      const current = new Date(start);
      while (current <= end) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const dd = String(current.getDate()).padStart(2, '0');
        unavailableDates.push(`${yyyy}-${mm}-${dd}`);
        current.setDate(current.getDate() + 1);
      }
    }

    return success({ unavailableDates });
  } catch (error: unknown) {
    return safeError(error, 'PRODUCT_CALENDAR_AVAILABILITY');
  }
}
