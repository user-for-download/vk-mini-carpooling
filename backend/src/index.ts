import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env, corsOrigins } from './runtime';
import { errorHandler } from './middleware/errorHandler';
import { ridesRoutes } from './routes/rides.routes';
import { bookingsRoutes } from './routes/bookings.routes';
import { locationsRoutes } from './routes/locations.routes';
import { usersRoutes } from './routes/users.routes';

const app = new Hono();

app.use('*', logger());
app.use('*', cors({ origin: corsOrigins, allowHeaders: ['Content-Type', 'Authorization'] }));

// Security headers (L12)
app.use('*', async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  await next();
});

app.onError(errorHandler);

app.get('/health', (c) => c.json({ ok: true }));

app.route('/api/rides', ridesRoutes);
app.route('/api/bookings', bookingsRoutes);
app.route('/api/locations', locationsRoutes);
app.route('/api/users', usersRoutes);

export type AppType = typeof app;

export default {
  port: env.PORT,
  hostname: '0.0.0.0',
  fetch: app.fetch,
};
