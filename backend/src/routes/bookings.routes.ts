import { Hono } from 'hono';
import { CreateBookingSchema, UpdateBookingStatusSchema } from '@local-blablacar/contracts';
import { vkAuthMiddleware } from '../middleware/vkAuth';
import { BookingError, cancelBooking, createBooking, listMyBookings, updateBookingStatus } from '../services/bookings.service';

export const bookingsRoutes = new Hono();

const STATUS_BY_ERROR_CODE = {
  FORBIDDEN: 403,
  ALREADY_PROCESSED: 409,
  NO_SEATS: 409,
  NOT_FOUND: 404,
  MAX_BOOKINGS: 409,
  TIME_CONFLICT: 409,
} as const;

bookingsRoutes.onError((err, c) => {
  if (err instanceof BookingError) {
    return c.json({ error: err.code, message: err.message }, STATUS_BY_ERROR_CODE[err.code]);
  }
  throw err;
});

bookingsRoutes.get('/mine', vkAuthMiddleware, async (c) => {
  const passengerId = c.get('userId');
  const bookings = await listMyBookings(passengerId);
  return c.json(bookings);
});

bookingsRoutes.post('/', vkAuthMiddleware, async (c) => {
  const passengerId = c.get('userId');
  const body = CreateBookingSchema.parse(await c.req.json());
  const booking = await createBooking(passengerId, body);
  return c.json(booking, 201);
});

bookingsRoutes.patch('/:id/status', vkAuthMiddleware, async (c) => {
  const driverId = c.get('userId');
  const bookingId = Number(c.req.param('id'));
  const body = UpdateBookingStatusSchema.parse(await c.req.json());
  const booking = await updateBookingStatus({ driverId, bookingId, status: body.status });
  return c.json(booking);
});

bookingsRoutes.delete('/:id', vkAuthMiddleware, async (c) => {
  const passengerId = c.get('userId');
  const bookingId = Number(c.req.param('id'));
  const booking = await cancelBooking(passengerId, bookingId);
  return c.json(booking);
});
