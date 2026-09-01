import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { unauthorized, forbidden, safeError, success } from '@/lib/secure-handler';
import { securityLogger } from '@/lib/security-logger';

export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rl = rateLimiters.admin.check(clientIp);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const session = await getSession(request);
    if (!session) {
      securityLogger.warn('ADMIN_DASHBOARD_UNAUTHORIZED', 'AdminDashboard', null, { ip: clientIp });
      return unauthorized();
    }

    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      securityLogger.error('ADMIN_DASHBOARD_FORBIDDEN', 'AdminDashboard', session.userId, { role: user?.role, ip: clientIp });
      return forbidden('Admin access required');
    }

    securityLogger.info('ADMIN_DASHBOARD_ACCESS', 'AdminDashboard', session.userId);

    const now = new Date();

    const [
      totalUsers,
      totalOwners,
      totalListings,
      activeRentals,
      completedRentals,
      overdueRentals,
      pendingVerifications,
      openDisputes,
      revenueAgg,
      recentRentals,
      rentalsByStatus,
      usersByRole,
      productsByCategory,
    ] = await Promise.all([
      db.user.count({ where: { role: 'CUSTOMER' } }),
      db.user.count({ where: { role: 'OWNER' } }),
      db.product.count({ where: { status: 'APPROVED' } }),
      db.rental.count({ where: { status: 'ACTIVE' } }),
      db.rental.count({ where: { status: 'COMPLETED' } }),
      db.rental.count({ where: { status: 'OVERDUE' } }),
      db.product.count({ where: { status: 'PENDING_REVIEW' } }),
      db.dispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
      db.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      db.rental.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true } },
          product: { select: { id: true, title: true } },
        },
      }),
      db.rental.groupBy({
        by: ['status'],
        _count: true,
      }),
      db.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      db.product.groupBy({
        by: ['categoryId'],
        _count: true,
      }),
    ]);

    // Monthly revenue for last 6 months
    const monthlyRevenue: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthAgg = await db.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: date, lt: endDate },
        },
        _sum: { amount: true },
      });

      monthlyRevenue.push({
        month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
        revenue: monthAgg._sum.amount || 0,
      });
    }

    // Enrich productsByCategory with category names
    const categoryIds = productsByCategory.map((p) => p.categoryId);
    const categories = await db.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    const productsByCategoryEnriched = productsByCategory.map((p) => ({
      category: catMap.get(p.categoryId) || 'Unknown',
      count: p._count,
    }));

    return success({
      totalUsers,
      totalOwners,
      totalListings,
      activeRentals,
      completedRentals,
      overdueRentals,
      totalRevenue: revenueAgg._sum.amount || 0,
      pendingVerifications,
      openDisputes,
      recentRentals,
      monthlyRevenue,
      rentalsByStatus: rentalsByStatus.map((r) => ({ status: r.status, count: r._count })),
      usersByRole: usersByRole.map((u) => ({ role: u.role, count: u._count })),
      productsByCategory: productsByCategoryEnriched,
    });
  } catch (error: unknown) {
    return safeError(error, 'ADMIN_DASHBOARD');
  }
}
