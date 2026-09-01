// POST /api/auth/password-reset/confirm
// Confirms a password reset using a valid, unexpired token.
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { safeError, success, validationError } from '@/lib/secure-handler';
import { securityLogger } from '@/lib/security-logger';
import { destroyAllUserSessions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

const passwordPattern = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/;

const confirmResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordPattern, 'Password must contain at least 1 uppercase letter, 1 number, and 1 special character'),
});

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  try {
    // Rate limiting
    const rl = rateLimiters.passwordReset.check(clientIp);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const body = await request.json();
    const parsed = confirmResetSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }

    const { token, newPassword } = parsed.data;

    // Look up the reset token - must be unused and not expired
    const resetToken = await db.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetToken) {
      securityLogger.warn('PASSWORD_RESET_INVALID_TOKEN', 'Auth', null, { ip: clientIp });
      return validationError('Invalid or expired reset token');
    }

    // Mark token as used (single-use)
    await db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    // Look up the user
    const user = await db.user.findUnique({ where: { id: resetToken.userId } });
    if (!user) {
      return validationError('User not found');
    }

    // Hash the new password with bcrypt (12 rounds)
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Destroy ALL user sessions (force re-login after password change)
    await destroyAllUserSessions(user.id);

    securityLogger.info('PASSWORD_RESET_COMPLETED', 'Auth', user.id, { ip: clientIp });

    return success({ message: 'Password has been reset successfully' });
  } catch (error) {
    return safeError(error, 'PASSWORD_RESET_CONFIRM');
  }
}
