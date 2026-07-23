import type { ErrorHandler } from 'hono';

// Prisma error codes that should return 4xx instead of 500
const PRISMA_CLIENT_ERRORS = new Set(['P2003', 'P2025']);

export const errorHandler: ErrorHandler = (err, c) => {
  // Handle known Prisma errors gracefully (M6)
  if (err && typeof err === 'object' && 'code' in err) {
    const prismaErr = err as { code: string; message: string; meta?: unknown };

    // Serialization anomaly (write conflict) - race condition
    if (prismaErr.code === 'P2034') {
      return c.json(
        { error: 'CONFLICT', message: 'Данные были изменены. Попробуйте снова.' },
        409,
      );
    }

    if (PRISMA_CLIENT_ERRORS.has(prismaErr.code)) {
      if (prismaErr.code === 'P2025') {
        return c.json({ error: 'NOT_FOUND', message: 'Referenced record not found' }, 404);
      }
      return c.json({ error: 'VALIDATION_ERROR', message: 'Data integrity constraint violated' }, 400);
    }
  }

  console.error('[ERROR]', err instanceof Error ? err.stack ?? err.message : err);
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : (err instanceof Error ? err.message : String(err));
  return c.json({ error: 'Internal server error', message }, 500);
};
