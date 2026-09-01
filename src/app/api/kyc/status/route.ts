import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { safeError, unauthorized, notFound, success } from '@/lib/secure-handler';

export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const session = await getSession(request);
    if (!session) return unauthorized();
    const rl = rateLimiters.api.check(session?.userId || clientIp);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true, kycStatus: true },
    });

    if (!user) {
      return notFound('User not found');
    }

    if (user.role !== 'OWNER') {
      return success({ kycStatus: 'NOT_REQUIRED', kyc: null });
    }

    let kyc = await db.sellerKyc.findUnique({
      where: { userId: session.userId },
    });

    if (!kyc) {
      kyc = await db.sellerKyc.create({
        data: { userId: session.userId },
      });
      await db.user.update({
        where: { id: session.userId },
        data: { kycStatus: 'PENDING' },
      });
    }

    return success({ kycStatus: user.kycStatus, kyc });
  } catch (error: unknown) {
    return safeError(error, 'KYC_STATUS');
  }
}
