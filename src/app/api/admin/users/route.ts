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
      securityLogger.warn('ADMIN_USERS_LIST_UNAUTHORIZED', 'AdminUsers', null, { ip: clientIp });
      return unauthorized();
    }

    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      securityLogger.error('ADMIN_USERS_LIST_FORBIDDEN', 'AdminUsers', session.userId, { role: user?.role, ip: clientIp });
      return forbidden('Admin access required');
    }

    securityLogger.info('ADMIN_USERS_LIST_ACCESS', 'AdminUsers', session.userId);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (role) where.role = role;
    if (status === 'active') where.isActive = true;
    else if (status === 'suspended') where.isActive = false;
    else if (status === 'verified') where.isVerified = true;
    else if (status === 'unverified') where.isVerified = false;

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, phone: true, role: true,
          state: { select: { name: true } },
          city: { select: { name: true } },
          isVerified: true, isActive: true, avgRating: true,
          totalRentals: true, totalReviews: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return success({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    return safeError(error, 'ADMIN_USERS_LIST');
  }
}
