import { z } from 'zod';

/**
 * Shape of VK's launch params after `vkAuthMiddleware` has verified `sign`.
 *
 * Note: vk_user_id is parsed as a string, not a number. VK's own docs
 * (dev.vk.ru/ru/general/long-id) recommend Int64 for user/community ids
 * going forward, which is unsafe to hold as a JS `number`. Keep it a
 * string everywhere — Prisma `User.id`, this schema, and the JWT/DTO layer.
 */
export const VkLaunchParamsSchema = z.object({
  vk_user_id: z.string(),
  vk_app_id: z.string(),
  vk_platform: z.string(), // e.g. "mobile_iphone", "desktop_web", "mobile_android"
  vk_language: z.string().optional(),
  vk_is_app_user: z.string().optional(),
  vk_are_notifications_enabled: z.string().optional(),
  vk_ts: z.string(),
});
export type VkLaunchParams = z.infer<typeof VkLaunchParamsSchema>;
