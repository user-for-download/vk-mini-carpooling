import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { MAX_BOOKING_COUNT } from '@local-blablacar/contracts';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  VK_APP_SECRET: z.string().min(1, 'VK_APP_SECRET is required to verify launch params'),
  CORS_ORIGINS: z.string().default('https://vk.com,https://m.vk.com,https://vk.ru,https://m.vk.ru'),
  PORT: z.coerce.number().default(3000),
  VK_AUTH_MOCK_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  MAX_BOOKING_COUNT: z.coerce.number().int().min(1).default(MAX_BOOKING_COUNT),
});

export const env = EnvSchema.parse(process.env);

// --- Production safety gate ---
if (env.VK_AUTH_MOCK_ENABLED && process.env.NODE_ENV === 'production') {
  throw new Error(
    'FATAL: VK_AUTH_MOCK_ENABLED=true is forbidden in production. ' +
    'Remove VK_AUTH_MOCK_ENABLED from your env or set it to false before deploying.',
  );
}

if (env.VK_AUTH_MOCK_ENABLED) {
  console.warn('⚠️  VK_AUTH_MOCK_ENABLED is ON — all requests auto-authenticate without VK signatures. DO NOT deploy with this flag.');
}

// Auto-trust Vite dev server origin outside production so browsers at
// localhost:5173 don't hit CORS errors. Production keeps the strict list.
const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const configuredOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
export const corsOrigins =
  process.env.NODE_ENV === 'production' ? configuredOrigins : [...configuredOrigins, ...DEV_ORIGINS];

// One Prisma client for the whole process. Importing this instead of
// `new PrismaClient()` per-file avoids exhausting Postgres connections
// under Bun's hot-reload dev server.
export const prisma = new PrismaClient();
