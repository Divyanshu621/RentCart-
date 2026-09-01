import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { unauthorized, forbidden, notFound, validationError, safeError, success } from '@/lib/secure-handler';
import { securityLogger } from '@/lib/security-logger';

const productActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'suspend', 'restore']),
  reason: z.string().max(500).optional(),
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
      securityLogger.warn('ADMIN_PRODUCT_UPDATE_UNAUTHORIZED', 'AdminProduct', null, { ip: clientIp });
      return unauthorized();
    }
    adminUserId = session.userId;

    const currentUser = await db.user.findUnique({ where: { id: session.userId } });
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      securityLogger.error('ADMIN_PRODUCT_UPDATE_FORBIDDEN', 'AdminProduct', session.userId, { role: currentUser?.role, ip: clientIp });
      return forbidden('Admin access required');
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = productActionSchema.safeParse(body);

    if (!parsed.success) {
      return validationError('Invalid request. Action must be one of: approve, reject, suspend, restore');
    }

    const { action, reason } = parsed.data;

    const product = await db.product.findUnique({
      where: { id },
      include: { owner: { select: { id: true, name: true } } },
    });

    if (!product) {
      return notFound('Product not found');
    }

    const updateData: Record<string, unknown> = {};
    let auditAction = '';

    switch (action) {
      case 'approve':
        updateData.status = 'APPROVED';
        auditAction = 'APPROVE_PRODUCT';
        break;
      case 'reject':
        updateData.status = 'REJECTED';
        auditAction = 'REJECT_PRODUCT';
        break;
      case 'suspend':
        updateData.status = 'SUSPENDED';
        auditAction = 'SUSPEND_PRODUCT';
        break;
      case 'restore':
        updateData.status = 'APPROVED';
        auditAction = 'RESTORE_PRODUCT';
        break;
    }

    const updated = await db.product.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        category: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: auditAction,
        entity: 'Product',
        entityId: id,
        details: `Admin ${currentUser.name} performed ${action} on product \"${product.title}\" by ${product.owner.name}`,
      },
    });

    securityLogger.info('ADMIN_PRODUCT_UPDATE_SUCCESS', 'AdminProduct', session.userId, {
      productId: id,
      action,
      ownerId: product.ownerId,
    });

    // Notify product owner
    await db.notification.create({
      data: {
        userId: product.ownerId,
        title: `Product ${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : action === 'suspend' ? 'Suspended' : 'Restored'}`,
        message: `Your product "${product.title}" has been ${action}d by admin.${reason ? ` Reason: ${reason}` : ''}`,
        type: 'RENTAL_REQUEST',
      },
    });

    return success({ product: updated });
  } catch (error: unknown) {
    return safeError(error, 'ADMIN_PRODUCT_UPDATE', adminUserId);
  }
}
