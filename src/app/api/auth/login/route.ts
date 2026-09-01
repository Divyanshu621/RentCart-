import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { compare } from 'bcryptjs';
import { db } from '@/lib/db';
import { createSession, setAuthCookie, isLoginRateLimited, recordLoginAttempt } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { safeError, unauthorized, forbidden, success } from '@/lib/secure-handler';
import { securityLogger } from '@/lib/security-logger';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  try {
    // ─── Rate Limiting ─────────────────────────────
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // IP-based rate limiting
    const ipResult = rateLimiters.auth.check(clientIp);
    if (ipResult.limited) {
      securityLogger.warn('LOGIN_RATE_LIMITED_IP', 'Auth', null, { ip: clientIp });
      return rateLimitResponse(ipResult.retryAfterMs);
    }

    // Email-based brute-force protection
    const bruteForceCheck = await isLoginRateLimited(normalizedEmail, clientIp);
    if (bruteForceCheck.limited) {
      securityLogger.warn('LOGIN_BRUTE_FORCE_BLOCKED', 'Auth', null, { email: normalizedEmail, ip: clientIp });
      return NextResponse.json(
        { success: false, error: 'Too many failed login attempts. Please try again later.', retryAfter: Math.ceil(bruteForceCheck.retryAfterMs / 1000) },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(bruteForceCheck.retryAfterMs / 1000)) } }
      );
    }

    // ─── Lookup User ───────────────────────────────
    const user = await db.user.findUnique({ where: { email: normalizedEmail } });

    // Account enumeration protection: use same error message for not found vs wrong password
    if (!user) {
      await recordLoginAttempt(normalizedEmail, false, clientIp);
      securityLogger.warn('LOGIN_FAILED_USER_NOT_FOUND', 'Auth', null, { ip: clientIp });
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      await recordLoginAttempt(normalizedEmail, false, clientIp);
      securityLogger.warn('LOGIN_FAILED_WRONG_PASSWORD', 'Auth', user.id, { ip: clientIp });
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.isActive) {
      await recordLoginAttempt(normalizedEmail, false, clientIp);
      securityLogger.warn('LOGIN_FAILED_ACCOUNT_SUSPENDED', 'Auth', user.id, { ip: clientIp });
      return forbidden('Account is suspended');
    }

    // ─── Create Session ─────────────────────────────
    const token = await createSession(user.id, request);
    await recordLoginAttempt(normalizedEmail, true, clientIp);

    securityLogger.info('LOGIN_SUCCESS', 'Auth', user.id, { ip: clientIp });

    // Update last login info
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date().toISOString() },
    }).catch(() => {});

    const { passwordHash: _, ...userWithoutPassword } = user;

    const response = success({ user: userWithoutPassword });
    setAuthCookie(response, token);

    return response;
  } catch (error: unknown) {
    return safeError(error, 'LOGIN');
  }
}
