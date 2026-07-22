import { Hono } from 'hono';
import { vkAuthMiddleware } from '../middleware/vkAuth';
import { listLocations } from '../services/locations.service';

export const locationsRoutes = new Hono();

locationsRoutes.get('/', vkAuthMiddleware, async (c) => {
  const locations = await listLocations();
  return c.json(locations);
});
