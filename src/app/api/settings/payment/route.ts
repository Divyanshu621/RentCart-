// GET /api/settings/payment — Public: returns which payment methods are enabled
// PUT /api/settings/payment — Admin only: update payment method toggles
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { safeError, validationError, unauthorized, forbidden, success } from '@/lib/secure-handler';
import { securityLogger } from '@/lib/security-logger';

const putPaymentSettingsSchema = z.object({
  razorpayEnabled: z.boolean().optional(),
  upiEnabled: z.boolean().optional(),
  cardEnabled: z.boolean().optional(),
  netbankingEnabled: z.boolean().optional(),
  walletEnabled: z.boolean().optional(),
  cashOnPickupEnabled: z.boolean().optional(),
}).strict();

export async function GET() {
  try {
    let settings = await db.paymentSettings.findUnique({ where: { id: 'default' } });

    if (!settings) {
      settings = await db.paymentSettings.create({
        data: { id: 'default' },
      });
    }

    return success({
      enabledMethods: {
        razorpay: settings.razorpayEnabled,
        upi: settings.upiEnabled,
        card: settings.cardEnabled,
        netbanking: settings.netbankingEnabled,
        wallet: settings.walletEnabled,
        cash: settings.cashOnPickupEnabled,
      },
    });
  } catch (error: unknown) {
    return safeError(error, 'PAYMENT_SETTINGS_GET');
  }
}

export async function PUT(request: NextRequest) {
  const clientIp = getClientIp(request);

  try {
    const session = await getSession(request);
    const rl = rateLimiters.admin.check(session?.userId || clientIp);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    if (!session) return unauthorized();

    const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return forbidden('Admin access required');
    }

    const body = await request.json();
    const parsed = putPaymentSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }

    const updateData: Record<string, boolean> = {};
    if (parsed.data.razorpayEnabled !== undefined) updateData.razorpayEnabled = parsed.data.razorpayEnabled;
    if (parsed.data.upiEnabled !== undefined) updateData.upiEnabled = parsed.data.upiEnabled;
    if (parsed.data.cardEnabled !== undefined) updateData.cardEnabled = parsed.data.cardEnabled;
    if (parsed.data.netbankingEnabled !== undefined) updateData.netbankingEnabled = parsed.data.netbankingEnabled;
    if (parsed.data.walletEnabled !== undefined) updateData.walletEnabled = parsed.data.walletEnabled;
    if (parsed.data.cashOnPickupEnabled !== undefined) updateData.cashOnPickupEnabled = parsed.data.cashOnPickupEnabled;

    let settings = await db.paymentSettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await db.paymentSettings.create({ data: { id: 'default' } });
    }

    const afterUpdate = { ...settings, ...updateData };
    const anyEnabled = [
      afterUpdate.razorpayEnabled,
      afterUpdate.upiEnabled,
      afterUpdate.cardEnabled,
      afterUpdate.netbankingEnabled,
      afterUpdate.walletEnabled,
      afterUpdate.cashOnPickupEnabled,
    ].some(Boolean);

    if (!anyEnabled) {
      return validationError('At least one payment method must remain enabled');
    }

    const updated = await db.paymentSettings.update({
      where: { id: 'default' },
      data: updateData,
    });

    securityLogger.info('PAYMENT_SETTINGS_UPDATED', 'Settings', session.userId, { changes: updateData, ip: clientIp });

    return success({
      message: 'Payment settings updated',
      enabledMethods: {
        razorpay: updated.razorpayEnabled,
        upi: updated.upiEnabled,
        card: updated.cardEnabled,
        netbanking: updated.netbankingEnabled,
        wallet: updated.walletEnabled,
        cash: updated.cashOnPickupEnabled,
      },
    });
  } catch (error: unknown) {
    securityLogger.error('PAYMENT_SETTINGS_UPDATE_FAILED', 'Settings', null, { ip: clientIp, error: error instanceof Error ? error.message : String(error) });
    return safeError(error, 'PAYMENT_SETTINGS_PUT');
  }
}
