import { createMiddleware } from 'hono/factory';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../runtime';

const MAX_LAUNCH_PARAMS_AGE_SECONDS = 86400; // 24h

type Variables = { userId: string; vkPlatform: string | undefined };

/**
 * Verifies VK Mini App launch params sent as `Authorization: Bearer <query-string>`.
 *
 * When VK_AUTH_MOCK_ENABLED=true (dev only), skips HMAC verification entirely
 * and trusts whatever vk_user_id the client sends.
 */
export const vkAuthMiddleware = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const launchParams = authHeader.slice('Bearer '.length);
  const searchParams = new URLSearchParams(launchParams);

  // --- Mock mode: trust the client, skip HMAC ---
  if (env.VK_AUTH_MOCK_ENABLED) {
    const userId = searchParams.get('vk_user_id') ?? '123456789';
    c.set('userId', userId);
    c.set('vkPlatform', searchParams.get('vk_platform') ?? undefined);
    return await next();
  }

  // --- Production mode: full VK signature verification ---
  const sign = searchParams.get('sign');
  const queryParams: { key: string; value: string }[] = [];
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith('vk_')) queryParams.push({ key, value });
  }
  if (!sign || queryParams.length === 0) {
    return c.json({ error: 'Missing launch params' }, 401);
  }

  const signString = queryParams
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(({ key, value }) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  const computedSign = createHmac('sha256', env.VK_APP_SECRET)
    .update(signString)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=$/, '');

  // Constant-time comparison to prevent timing attacks (M3)
  const computedBuf = Buffer.from(computedSign);
  const signBuf = Buffer.from(sign);
  const maxLen = Math.max(computedBuf.length, signBuf.length);
  const cmpA = Buffer.alloc(maxLen, computedBuf);
  const cmpB = Buffer.alloc(maxLen, signBuf);
  if (!timingSafeEqual(cmpA, cmpB)) {
    return c.json({ error: 'Invalid sign' }, 403);
  }

  const vkTs = searchParams.get('vk_ts');
  if (!vkTs || Math.floor(Date.now() / 1000) - parseInt(vkTs, 10) > MAX_LAUNCH_PARAMS_AGE_SECONDS) {
    return c.json({ error: 'Launch params expired' }, 401);
  }

  const userId = searchParams.get('vk_user_id');
  if (!userId) {
    return c.json({ error: 'Missing vk_user_id' }, 401);
  }

  c.set('userId', userId);
  c.set('vkPlatform', searchParams.get('vk_platform') ?? undefined);
  await next();
});
