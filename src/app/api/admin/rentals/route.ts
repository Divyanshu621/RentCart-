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
      securityLogger.warn('ADMIN_RENTALS_LIST_UNAUTHORIZED', 'AdminRentals', null, { ip: clientIp });
      return unauthorized();
    }

    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      securityLogger.error('ADMIN_RENTALS_LIST_FORBIDDEN', 'AdminRentals', session.userId, { role: user?.role, ip: clientIp });
      return forbidden('Admin access required');
    }

    securityLogger.info('ADMIN_RENTALS_LIST_ACCESS', 'AdminRentals', session.userId);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { id: search },
        { customer: { name: { contains: search } } },
        { owner: { name: { contains: search } } },
        { product: { title: { contains: search } } },
      ];
    }

    const [rentals, total] = await Promise.all([
      db.rental.findMany({
        where,
        include: {
          product: { select: { id: true, title: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 }, category: { select: { name: true } } } },
          customer: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
          owner: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
          payments: { orderBy: { createdAt: 'desc' } },
          refunds: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.rental.count({ where }),
    ]);

    return success({
      rentals,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    return safeError(error, 'ADMIN_RENTALS_LIST');
  }
}
