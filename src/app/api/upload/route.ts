import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { unauthorized, safeError, success, validationError } from '@/lib/secure-handler';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { securityLogger } from '@/lib/security-logger';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_CATEGORIES = ['product', 'kyc', 'profile', 'chat'];

function getExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/png': return 'png';
    case 'image/jpeg':
    case 'image/jpg': return 'jpg';
    case 'image/webp': return 'webp';
    default: return 'bin';
  }
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  try {
    const session = await getSession(request);
    const rl = rateLimiters.api.check(session?.userId || clientIp);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    if (!session) return unauthorized();

    const formData = await request.formData();
    const files = formData.getAll('file');
    const category = (formData.get('category') as string) || 'product';

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return validationError(`Invalid upload category. Allowed: ${ALLOWED_CATEGORIES.join(', ')}`);
    }

    if (!files || files.length === 0) {
      return validationError('No file provided');
    }

    if (files.length > 5) {
      return validationError('Maximum 5 files per upload');
    }

    const file = files[0] as File;

    if (!ALLOWED_TYPES.includes(file.type)) {
      return validationError('Invalid file type. Only PNG, JPG, and WEBP are allowed.');
    }

    if (file.size > MAX_SIZE) {
      return validationError('File too large. Maximum size is 5MB.');
    }

    const ext = getExtension(file.type);
    const filename = `${randomUUID()}.${ext}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads', category);

    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const url = `/uploads/${category}/${filename}`;

    securityLogger.info('FILE_UPLOADED', 'Upload', session.userId, {
      filename,
      category,
      size: file.size,
      type: file.type,
      ip: clientIp,
    });

    return success({
      url,
      originalName: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error: unknown) {
    return safeError(error, 'FILE_UPLOAD');
  }
}
