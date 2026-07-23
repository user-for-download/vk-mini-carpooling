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

  // --- Mock mode: trust the client, skip HMAC ---
  if (env.VK_AUTH_MOCK_ENABLED) {
    const searchParams = new URLSearchParams(launchParams);
    const userId = searchParams.get('vk_user_id') ?? '123456789';
    c.set('userId', userId);
    c.set('vkPlatform', searchParams.get('vk_platform') ?? undefined);
    return await next();
  }

  // --- Production mode: full VK signature verification ---
  // Parse raw string to preserve exact encoding VK signed
  const params = launchParams.split('&');
  const signParam = params.find((p) => p.startsWith('sign='));
  const sign = signParam ? signParam.slice('sign='.length) : null;

  // Extract all vk_ params preserving raw encoding
  const vkParams: { key: string; value: string }[] = [];
  for (const param of params) {
    const eqIdx = param.indexOf('=');
    if (eqIdx === -1) continue;
    const key = param.slice(0, eqIdx);
    const value = param.slice(eqIdx + 1);
    if (key.startsWith('vk_') && key !== 'sign') {
      vkParams.push({ key, value });
    }
  }

  if (!sign || vkParams.length === 0) {
    return c.json({ error: 'Missing launch params' }, 401);
  }

  // Build sign string using raw values (preserving VK's exact encoding)
  const signString = vkParams
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(({ key, value }) => `${key}=${value}`)
    .join('&');

  const computedSign = createHmac('sha256', env.VK_APP_SECRET)
    .update(signString)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=$/, '');

  // Constant-time comparison to prevent timing attacks
  const computedBuf = Buffer.from(computedSign);
  const signBuf = Buffer.from(sign);
  if (computedBuf.length !== signBuf.length) {
    return c.json({ error: 'Invalid sign' }, 403);
  }
  if (!timingSafeEqual(computedBuf, signBuf)) {
    return c.json({ error: 'Invalid sign' }, 403);
  }

  // Extract vk_ts from raw params
  const tsParam = params.find((p) => p.startsWith('vk_ts='));
  const vkTs = tsParam ? tsParam.slice('vk_ts='.length) : null;
  const ts = parseInt(vkTs ?? '', 10);
  if (!vkTs || Number.isNaN(ts) || Math.floor(Date.now() / 1000) - ts > MAX_LAUNCH_PARAMS_AGE_SECONDS) {
    return c.json({ error: 'Launch params expired' }, 401);
  }

  // Extract vk_user_id from raw params
  const userIdParam = params.find((p) => p.startsWith('vk_user_id='));
  const userId = userIdParam ? userIdParam.slice('vk_user_id='.length) : null;
  if (!userId) {
    return c.json({ error: 'Missing vk_user_id' }, 401);
  }

  const platformParam = params.find((p) => p.startsWith('vk_platform='));
  const platform = platformParam ? platformParam.slice('vk_platform='.length) : undefined;

  c.set('userId', userId);
  c.set('vkPlatform', platform);
  await next();
});
