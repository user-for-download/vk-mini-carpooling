import type { ErrorHandler } from 'hono';
import { ZodError } from 'zod';

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    return c.json(
      { error: 'VALIDATION_ERROR', message: issue?.message ?? 'Invalid request', issues: err.issues },
      400,
    );
  }

  console.error(err);
  return c.json({ error: 'Internal server error' }, 500);
};
