import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { unauthorized, forbidden, notFound, validationError, safeError, success } from '@/lib/secure-handler';
import { securityLogger } from '@/lib/security-logger';

const reviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().max(500).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let adminUserId: string | null = null;
  try {
    const clientIp = getClientIp(request);
    const rl = rateLimiters.admin.check(clientIp);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const session = await getSession(request);
    if (!session) {
      securityLogger.warn('ADMIN_KYC_REVIEW_UNAUTHORIZED', 'AdminKYC', null, { ip: clientIp });
      return unauthorized();
    }
    adminUserId = session.userId;

    // Check admin permissions (role from DB, never from client)
    const adminUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN')) {
      securityLogger.error('ADMIN_KYC_REVIEW_FORBIDDEN', 'AdminKYC', session.userId, { role: adminUser?.role, ip: clientIp });
      return forbidden('Admin access required');
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return validationError('Invalid request. Action must be APPROVE or REJECT.');
    }

    const { action, rejectionReason } = parsed.data;

    const kyc = await db.sellerKyc.findUnique({
      where: { id },
    });

    if (!kyc) {
      return notFound('KYC record not found');
    }

    if (kyc.status !== 'SUBMITTED' && kyc.status !== 'UNDER_REVIEW') {
      return validationError(`Cannot review KYC with status: ${kyc.status}`);
    }

    const now = new Date();

    if (action === 'APPROVE') {
      await db.sellerKyc.update({
        where: { id },
        data: {
          status: 'VERIFIED',
          verifiedAt: now,
          reviewedBy: session.userId,
        },
      });

      await db.user.update({
        where: { id: kyc.userId },
        data: {
          kycStatus: 'VERIFIED',
          isVerified: true,
        },
      });
    } else {
      await db.sellerKyc.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectedAt: now,
          rejectionReason: rejectionReason || 'Documents do not meet our verification standards',
          reviewedBy: session.userId,
        },
      });

      await db.user.update({
        where: { id: kyc.userId },
        data: { kycStatus: 'REJECTED' },
      });
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: `KYC_${action}`,
        entity: 'SellerKyc',
        entityId: id,
        details: `Admin reviewed KYC for user ${kyc.userId}: ${action}`,
      },
    });

    securityLogger.info('ADMIN_KYC_REVIEW_SUCCESS', 'AdminKYC', session.userId, {
      kycId: id,
      targetUserId: kyc.userId,
      action,
    });

    return success({ message: action === 'APPROVE' ? 'KYC verified successfully' : 'KYC rejected' });
  } catch (error: unknown) {
    return safeError(error, 'ADMIN_KYC_REVIEW', adminUserId);
  }
}
