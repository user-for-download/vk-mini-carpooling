import { Hono } from 'hono';
import { z } from 'zod';
import { vkAuthMiddleware } from '../middleware/vkAuth';
import { ensureUser } from '../services/users.service';

export const usersRoutes = new Hono();

const InitUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  photoUrl: z.string().url().optional(),
});

usersRoutes.get('/me', vkAuthMiddleware, async (c) => {
  const userId = c.get('userId');
  const platform = c.get('vkPlatform');
  const user = await ensureUser({ id: userId, platform });
  return c.json(user);
});

usersRoutes.post('/init', vkAuthMiddleware, async (c) => {
  const userId = c.get('userId');
  const platform = c.get('vkPlatform');
  const body = InitUserSchema.parse(await c.req.json());
  const user = await ensureUser({
    id: userId,
    platform,
    firstName: body.firstName,
    lastName: body.lastName,
    photoUrl: body.photoUrl,
  });
  return c.json(user);
});
