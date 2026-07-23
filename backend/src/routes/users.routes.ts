import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { InitUserSchema } from '@local-blablacar/contracts';
import { vkAuthMiddleware } from '../middleware/vkAuth';
import { ensureUser, getUserById } from '../services/users.service';

export const usersRoutes = new Hono();

usersRoutes.get('/me', vkAuthMiddleware, async (c) => {
  const userId = c.get('userId');
  // GET /me should not mutate state — just return the user if exists (M1)
  const user = await getUserById(userId);
  return c.json(user ?? null);
});

usersRoutes.post('/init', vkAuthMiddleware, zValidator('json', InitUserSchema, (result, c) => {
  if (!result.success) {
    return c.json({ error: 'VALIDATION_ERROR', message: result.error.issues[0].message }, 400);
  }
}), async (c) => {
  const userId = c.get('userId');
  const platform = c.get('vkPlatform');
  const body = c.req.valid('json');
  const user = await ensureUser({
    id: userId,
    platform,
    firstName: body.firstName,
    lastName: body.lastName,
    photoUrl: body.photoUrl,
  });
  return c.json(user);
});
