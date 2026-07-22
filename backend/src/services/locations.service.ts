import { prisma } from '../runtime';

export async function listLocations() {
  return prisma.location.findMany({ orderBy: { name: 'asc' } });
}
