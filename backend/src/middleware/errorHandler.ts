import type { ErrorHandler } from 'hono';
import { ZodError } from 'zod';

// Prisma error codes that should return 4xx instead of 500
const PRISMA_CLIENT_ERRORS = new Set(['P2003', 'P2025']);

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    return c.json(
      { error: 'VALIDATION_ERROR', message: issue?.message ?? 'Invalid request', issues: err.issues },
      400,
    );
  }

  // Handle known Prisma errors gracefully (M6)
  if (err && typeof err === 'object' && 'code' in err) {
    const prismaErr = err as { code: string; message: string; meta?: unknown };
    if (PRISMA_CLIENT_ERRORS.has(prismaErr.code)) {
      return c.json(
        { error: 'NOT_FOUND', message: 'Referenced record not found' },
        404,
      );
    }
  }

  console.error('[ERROR]', err instanceof Error ? err.stack ?? err.message : err);
  return c.json({ error: 'Internal server error', message: err instanceof Error ? err.message : String(err) }, 500);
};
