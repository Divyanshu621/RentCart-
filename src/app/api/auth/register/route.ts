import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { createSession, setAuthCookie } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { safeError, success } from '@/lib/secure-handler';
import { securityLogger } from '@/lib/security-logger';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number').max(15, 'Invalid phone number'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  stateId: z.string().min(1, 'State is required'),
  cityId: z.string().min(1, 'City is required'),
  pinCode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid pin code'),
  address: z.string().min(1, 'Address is required').max(500, 'Address too long'),
});

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  try {
    // ─── Rate Limiting ─────────────────────────────
    const ipResult = rateLimiters.register.check(clientIp);
    if (ipResult.limited) {
      securityLogger.warn('REGISTER_RATE_LIMITED', 'Auth', null, { ip: clientIp });
      return rateLimitResponse(ipResult.retryAfterMs);
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const data = parsed.data;
    const normalizedEmail = data.email.toLowerCase().trim();

    // ─── Check email uniqueness ────────────────────
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      securityLogger.info('REGISTER_EMAIL_EXISTS', 'Auth', null, { email: normalizedEmail });
      return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 409 });
    }

    // ─── Hash password with bcrypt (12 rounds) ───
    const passwordHash = await hash(data.password, 12);

    // ─── Create user (role is ALWAYS set server-side) ───
    const user = await db.user.create({
      data: {
        name: data.name.trim(),
        email: normalizedEmail,
        phone: data.phone,
        passwordHash,
        stateId: data.stateId,
        cityId: data.cityId,
        pinCode: data.pinCode,
        address: data.address.trim(),
        role: 'CUSTOMER', // Always server-set, never from client
        isVerified: true,
        isActive: true,
      },
    });

    // ─── Create session ────────────────────────────
    const token = await createSession(user.id, request);
    securityLogger.info('REGISTER_SUCCESS', 'Auth', user.id, { ip: clientIp });

    const { passwordHash: _, ...userWithoutPassword } = user;

    const response = success({ user: userWithoutPassword }, 201);
    setAuthCookie(response, token);

    return response;
  } catch (error: unknown) {
    return safeError(error, 'REGISTER');
  }
}
