import { db } from '@/lib/db';
import { safeError } from '@/lib/secure-handler';

export async function GET() {
  try {
    const states = await db.state.findMany({
      where: { isActive: true },
      include: {
        cities: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
          include: {
            areas: {
              where: { isActive: true },
              orderBy: { name: 'asc' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return Response.json(states);
  } catch (error: unknown) {
    return safeError(error, 'STATES');
  }
}
