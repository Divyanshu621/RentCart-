import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { securityLogger } from '@/lib/security-logger';
import { safeError, validationError, unauthorized, forbidden, notFound, success } from '@/lib/secure-handler';

const messageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(5000, 'Message must be at most 5000 characters'),
  type: z.enum(['TEXT', 'IMAGE', 'FILE']).default('TEXT'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clientIp = getClientIp(request);
    const session = await getSession(request);
    if (!session) return unauthorized();
    const rl = rateLimiters.api.check(session?.userId || clientIp);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const { id: conversationId } = await params;

    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) return notFound('Conversation not found');

    if (conversation.user1Id !== session.userId && conversation.user2Id !== session.userId) {
      return forbidden('You do not have access to this conversation');
    }

    await db.message.updateMany({
      where: {
        conversationId,
        senderId: { not: session.userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    const messages = await db.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return success({ messages });
  } catch (error: unknown) {
    return safeError(error, 'MESSAGES_GET');
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(request);
    const session = await getSession(request);
    const rl = rateLimiters.api.check(session?.userId || ip);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    if (!session) return unauthorized();

    const { id: conversationId } = await params;

    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) return notFound('Conversation not found');

    if (conversation.user1Id !== session.userId && conversation.user2Id !== session.userId) {
      return forbidden('You do not have access to this conversation');
    }

    const body = await request.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }

    const { content, type } = parsed.data;

    const message = await db.message.create({
      data: {
        conversationId,
        senderId: session.userId,
        content,
        type,
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    await db.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: content.substring(0, 200),
        lastMessageAt: new Date(),
      },
    });

    securityLogger.info('MESSAGE_SENT', 'Message', session.userId, { conversationId });
    return success({ message }, 201);
  } catch (error: unknown) {
    return safeError(error, 'MESSAGE_SEND');
  }
}
