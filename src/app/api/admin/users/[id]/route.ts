import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { unauthorized, forbidden, notFound, validationError, safeError, success } from '@/lib/secure-handler';
import { securityLogger } from '@/lib/security-logger';

const updateUserActionSchema = z.object({
  action: z.enum(['verify', 'unverify', 'suspend', 'activate', 'role']),
  role: z.enum(['CUSTOMER', 'OWNER', 'ADMIN']).optional(),
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
      securityLogger.warn('ADMIN_USER_UPDATE_UNAUTHORIZED', 'AdminUser', null, { ip: clientIp });
      return unauthorized();
    }
    adminUserId = session.userId;

    const currentUser = await db.user.findUnique({ where: { id: session.userId } });
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      securityLogger.error('ADMIN_USER_UPDATE_FORBIDDEN', 'AdminUser', session.userId, { role: currentUser?.role, ip: clientIp });
      return forbidden('Admin access required');
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateUserActionSchema.safeParse(body);

    if (!parsed.success) {
      return validationError('Invalid request. Action must be one of: verify, unverify, suspend, activate, role');
    }

    const { action, role: newRole } = parsed.data;

    const targetUser = await db.user.findUnique({ where: { id } });

    if (!targetUser) {
      return notFound('User not found');
    }

    const updateData: Record<string, unknown> = {};
    let auditAction = '';

    switch (action) {
      case 'verify':
        updateData.isVerified = true;
        auditAction = 'VERIFY_USER';
        break;
      case 'unverify':
        updateData.isVerified = false;
        auditAction = 'UNVERIFY_USER';
        break;
      case 'suspend':
        updateData.isActive = false;
        auditAction = 'SUSPEND_USER';
        break;
      case 'activate':
        updateData.isActive = true;
        auditAction = 'ACTIVATE_USER';
        break;
      case 'role':
        if (!newRole) {
          return validationError('Role is required when action is "role"');
        }
        updateData.role = newRole;
        auditAction = `CHANGE_ROLE_TO_${newRole}`;
        break;
    }

    const updated = await db.user.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: auditAction,
        entity: 'User',
        entityId: id,
        details: `Admin ${currentUser.name} performed ${action} on user ${targetUser.name}`,
      },
    });

    securityLogger.info('ADMIN_USER_UPDATE_SUCCESS', 'AdminUser', session.userId, {
      targetUserId: id,
      action,
      ...(newRole && { newRole }),
    });

    const { passwordHash: _, ...userWithoutPassword } = updated;

    return success({ user: userWithoutPassword });
  } catch (error: unknown) {
    return safeError(error, 'ADMIN_USER_UPDATE', adminUserId);
  }
}
