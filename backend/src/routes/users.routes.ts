import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { InitUserSchema } from '@local-blablacar/contracts';
import { vkAuthMiddleware } from '../middleware/vkAuth';
import { ensureUser } from '../services/users.service';

export const usersRoutes = new Hono();

usersRoutes.get('/me', vkAuthMiddleware, async (c) => {
  const userId = c.get('userId');
  const platform = c.get('vkPlatform');
  const user = await ensureUser({ id: userId, platform });
  return c.json(user);
});

usersRoutes.post('/init', vkAuthMiddleware, zValidator('json', InitUserSchema), async (c) => {
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
