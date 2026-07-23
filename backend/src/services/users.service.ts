import { prisma } from '../runtime';

/**
 * VK doesn't guarantee a first/last name or photo on every launch param set
 * (e.g. a user who hid their profile), so this only touches lastPlatform on
 * repeat visits and leaves name/photo alone unless explicitly provided by a
 * client that has already called VKWebAppGetUserInfo.
 */
export async function ensureUser(input: {
  id: string;
  platform?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
}) {
  return prisma.user.upsert({
    where: { id: input.id },
    update: {
      lastPlatform: input.platform,
      ...(input.firstName !== undefined && input.firstName !== '' && { firstName: input.firstName }),
      ...(input.lastName !== undefined && input.lastName !== '' && { lastName: input.lastName }),
      ...(input.photoUrl !== undefined && { photoUrl: input.photoUrl }),
    },
    create: {
      id: input.id,
      firstName: input.firstName ?? 'VK',
      lastName: input.lastName ?? 'User',
      photoUrl: input.photoUrl,
      lastPlatform: input.platform,
    },
  });
}

/** Read-only user lookup — does not mutate state (used by GET /me). */
export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}
