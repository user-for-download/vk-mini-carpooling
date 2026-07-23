import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateRideSchema, SearchRidesSchema } from '@local-blablacar/contracts';
import { vkAuthMiddleware } from '../middleware/vkAuth';
import { RideError, cancelRide, createRide, getRideById, listMyRides, searchRides } from '../services/rides.service';

export const ridesRoutes = new Hono();

const STATUS_BY_ERROR_CODE = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  NOT_ACTIVE: 409,
} as const;

ridesRoutes.onError((err, c) => {
  if (err instanceof RideError) {
    return c.json({ error: err.code, message: err.message }, STATUS_BY_ERROR_CODE[err.code]);
  }
  throw err;
});

ridesRoutes.get('/', vkAuthMiddleware, zValidator('query', SearchRidesSchema), async (c) => {
  const query = c.req.valid('query');
  const rides = await searchRides(query);
  return c.json(rides);
});

ridesRoutes.get('/mine', vkAuthMiddleware, async (c) => {
  const driverId = c.get('userId');
  const rides = await listMyRides(driverId);
  return c.json(rides);
});

ridesRoutes.get('/:id', vkAuthMiddleware, async (c) => {
  const id = Number(c.req.param('id'));
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ride id' }, 400);
  const ride = await getRideById(id);
  if (!ride) return c.json({ error: 'Not found' }, 404);
  return c.json(ride);
});

ridesRoutes.post('/', vkAuthMiddleware, zValidator('json', CreateRideSchema), async (c) => {
  const driverId = c.get('userId');
  const body = c.req.valid('json');
  const ride = await createRide(driverId, body);
  return c.json(ride, 201);
});

ridesRoutes.delete('/:id', vkAuthMiddleware, async (c) => {
  const driverId = c.get('userId');
  const rideId = Number(c.req.param('id'));
  if (Number.isNaN(rideId)) return c.json({ error: 'Invalid ride id' }, 400);
  const ride = await cancelRide(driverId, rideId);
  return c.json(ride);
});
