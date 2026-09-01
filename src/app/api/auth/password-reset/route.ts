// POST /api/auth/password-reset
// Requests a password reset email. Always returns 200 to prevent email enumeration.
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { safeError, success, validationError } from '@/lib/secure-handler';
import { securityLogger } from '@/lib/security-logger';
import crypto from 'crypto';

const requestResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  try {
    // Rate limiting
    const rl = rateLimiters.passwordReset.check(clientIp);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const body = await request.json();
    const parsed = requestResetSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }

    const { email } = parsed.data;

    // Look up user - but don't reveal whether they exist
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (user) {
      // Generate crypto-random token
      const token = crypto.randomBytes(32).toString('hex');

      // Create password reset token (expires in 1 hour)
      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      securityLogger.info('PASSWORD_RESET_REQUESTED', 'Auth', user.id, { ip: clientIp });

      if (process.env.NODE_ENV === 'development') {
        // In development, return the token for testing
        return success({
          message: 'If an account exists with this email, a reset link has been sent',
          ...(process.env.NODE_ENV === 'development' && { _devToken: token }),
        });
      }

      // In production, would send email here. For now, just log it.
      console.error(`[PASSWORD_RESET] Reset token generated for user ${user.id}. Token: ${token}`);
    }

    // Always return the same response regardless of whether user exists
    // This prevents email enumeration attacks
    return success({
      message: 'If an account exists with this email, a reset link has been sent',
    });
  } catch (error) {
    return safeError(error, 'PASSWORD_RESET_REQUEST');
  }
}
