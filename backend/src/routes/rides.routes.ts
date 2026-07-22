import { Hono } from 'hono';
import { CreateRideSchema, SearchRidesSchema } from '@local-blablacar/contracts';
import { vkAuthMiddleware } from '../middleware/vkAuth';
import { cancelRide, createRide, getRideById, listMyRides, searchRides } from '../services/rides.service';

export const ridesRoutes = new Hono();

ridesRoutes.get('/', vkAuthMiddleware, async (c) => {
  const query = SearchRidesSchema.parse({
    fromId: c.req.query('fromId') ? Number(c.req.query('fromId')) : undefined,
    toId: c.req.query('toId') ? Number(c.req.query('toId')) : undefined,
    date: c.req.query('date') || undefined,
  });
  const rides = await searchRides(query);
  return c.json(rides);
});

ridesRoutes.get('/mine', vkAuthMiddleware, async (c) => {
  const driverId = c.get('userId');
  const rides = await listMyRides(driverId);
  return c.json(rides);
});

ridesRoutes.get('/:id', vkAuthMiddleware, async (c) => {
  const ride = await getRideById(Number(c.req.param('id')));
  if (!ride) return c.json({ error: 'Not found' }, 404);
  return c.json(ride);
});

ridesRoutes.post('/', vkAuthMiddleware, async (c) => {
  const driverId = c.get('userId');
  const body = CreateRideSchema.parse(await c.req.json());
  const ride = await createRide(driverId, body);
  return c.json(ride, 201);
});

ridesRoutes.delete('/:id', vkAuthMiddleware, async (c) => {
  const driverId = c.get('userId');
  const rideId = Number(c.req.param('id'));
  const ride = await cancelRide(driverId, rideId);
  return c.json(ride);
});
