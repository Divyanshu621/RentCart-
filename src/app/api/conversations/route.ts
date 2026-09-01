import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { securityLogger } from '@/lib/security-logger';
import { safeError, validationError, unauthorized, forbidden, notFound, success } from '@/lib/secure-handler';

const createConvSchema = z.object({
  otherUserId: z.string().min(1, 'Other user ID is required'),
  productId: z.string().min(1).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const session = await getSession(request);
    if (!session) return unauthorized();
    const rl = rateLimiters.api.check(session?.userId || clientIp);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const conversations = await db.conversation.findMany({
      where: {
        OR: [
          { user1Id: session.userId },
          { user2Id: session.userId },
        ],
      },
      include: {
        user1: { select: { id: true, name: true, avatarUrl: true } },
        user2: { select: { id: true, name: true, avatarUrl: true } },
        product: { select: { id: true, title: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } } },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    const enriched = conversations.map((conv) => {
      const isUser1 = conv.user1Id === session.userId;
      const otherUser = isUser1 ? conv.user2 : conv.user1;
      return {
        ...conv,
        otherUser,
      };
    });

    return success({ conversations: enriched });
  } catch (error: unknown) {
    return safeError(error, 'CONVERSATIONS_LIST');
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const session = await getSession(request);
    const rl = rateLimiters.api.check(session?.userId || ip);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    if (!session) return unauthorized();

    const body = await request.json();
    const parsed = createConvSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }

    const { otherUserId, productId } = parsed.data;

    if (otherUserId === session.userId) {
      return validationError('Cannot create conversation with yourself');
    }

    const otherUser = await db.user.findUnique({ where: { id: otherUserId } });
    if (!otherUser) return notFound('User not found');

    const [smallerId, largerId] = [session.userId, otherUserId].sort();

    let conversation = await db.conversation.findUnique({
      where: {
        user1Id_user2Id_productId: {
          user1Id: smallerId,
          user2Id: largerId,
          productId: productId || null as unknown as string,
        },
      },
      include: {
        user1: { select: { id: true, name: true, avatarUrl: true } },
        user2: { select: { id: true, name: true, avatarUrl: true } },
        product: { select: { id: true, title: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } } },
      },
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          user1Id: smallerId,
          user2Id: largerId,
          productId: productId || null,
        },
        include: {
          user1: { select: { id: true, name: true, avatarUrl: true } },
          user2: { select: { id: true, name: true, avatarUrl: true } },
          product: { select: { id: true, title: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } } },
        },
      });
    }

    securityLogger.info('CONVERSATION_CREATED', 'Conversation', session.userId);
    return success({ conversation });
  } catch (error: unknown) {
    return safeError(error, 'CONVERSATION_CREATE');
  }
}
