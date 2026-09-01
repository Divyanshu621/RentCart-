import { db } from '@/lib/db';
import { safeError } from '@/lib/secure-handler';

export async function GET() {
  try {
    const categories = await db.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return Response.json(categories);
  } catch (error: unknown) {
    return safeError(error, 'CATEGORIES');
  }
}
