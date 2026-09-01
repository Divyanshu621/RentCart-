import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { safeError, unauthorized, success } from '@/lib/secure-handler';

export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const session = await getSession(request);
    if (!session) return unauthorized();
    const rl = rateLimiters.api.check(session?.userId || clientIp);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const userId = session.userId;

    const [
      activeRentals,
      completedRentals,
      upcomingRentals,
      spendingAgg,
      earningsAgg,
      pendingRequests,
      productCount,
      favoriteCount,
      user,
    ] = await Promise.all([
      db.rental.count({ where: { customerId: userId, status: 'ACTIVE' } }),
      db.rental.count({ where: { customerId: userId, status: 'COMPLETED' } }),
      db.rental.count({
        where: {
          customerId: userId,
          status: { in: ['OWNER_ACCEPTED', 'READY_FOR_PICKUP'] },
          startDate: { gt: new Date() },
        },
      }),
      db.rental.aggregate({
        where: { customerId: userId, status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true },
      }),
      db.rental.aggregate({
        where: { ownerId: userId, status: { not: 'CANCELLED' } },
        _sum: { rentalAmount: true },
      }),
      db.rental.count({
        where: { ownerId: userId, status: { in: ['OWNER_PENDING', 'PENDING_PAYMENT'] } },
      }),
      db.product.count({ where: { ownerId: userId } }),
      db.favorite.count({ where: { userId } }),
      db.user.findUnique({ where: { id: userId } }),
    ]);

    return success({
      activeRentals,
      completedRentals,
      upcomingRentals,
      totalSpending: spendingAgg._sum.totalAmount || 0,
      totalEarnings: earningsAgg._sum.rentalAmount || 0,
      pendingRequests,
      productCount,
      favoriteCount,
      avgRatingReceived: user?.avgRating || 0,
    });
  } catch (error: unknown) {
    return safeError(error, 'DASHBOARD_GET');
  }
}
