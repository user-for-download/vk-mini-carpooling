import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env, corsOrigins } from './runtime';
import { ridesRoutes } from './routes/rides.routes';
import { bookingsRoutes } from './routes/bookings.routes';
import { locationsRoutes } from './routes/locations.routes';
import { usersRoutes } from './routes/users.routes';

const app = new Hono();

app.use('*', logger());
app.use('*', cors({ origin: corsOrigins, allowHeaders: ['Content-Type', 'Authorization'] }));

app.get('/health', (c) => c.json({ ok: true }));

app.route('/api/rides', ridesRoutes);
app.route('/api/bookings', bookingsRoutes);
app.route('/api/locations', locationsRoutes);
app.route('/api/users', usersRoutes);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default {
  port: env.PORT,
  hostname: '0.0.0.0',
  fetch: app.fetch,
};
