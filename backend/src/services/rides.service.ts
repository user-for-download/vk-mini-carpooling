import type { CreateRideInput, SearchRidesInput } from '@local-blablacar/contracts';
import { RIDE_STATUS, BOOKING_STATUS } from '@local-blablacar/contracts';
import { prisma } from '../runtime';

export class RideError extends Error {
  constructor(
    public code: 'NOT_FOUND' | 'FORBIDDEN' | 'NOT_ACTIVE',
    message: string,
  ) {
    super(message);
  }
}

export async function searchRides(filters: SearchRidesInput) {
  const now = new Date();
  return prisma.ride.findMany({
    where: {
      status: RIDE_STATUS.ACTIVE,
      ...(filters.fromId !== undefined ? { fromId: filters.fromId } : {}),
      ...(filters.toId !== undefined ? { toId: filters.toId } : {}),
      departureTime: filters.date
        ? {
            gte: new Date(`${filters.date}T00:00:00.000Z`),
            lt: new Date(`${filters.date}T23:59:59.999Z`),
          }
        : { gte: new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) },
    },
    orderBy: { departureTime: 'asc' },
    include: { from: true, to: true, driver: true },
    // Limit results to prevent unbounded queries
    take: 100,
  });
}

export async function createRide(driverId: string, input: CreateRideInput) {
  // Verify user exists before creating ride (prevents P2003 foreign key crash)
  const user = await prisma.user.findUnique({ where: { id: driverId } });
  if (!user) throw new RideError('NOT_FOUND', 'User not found. Call POST /init first.');

  // Verify locations exist
  const [fromLoc, toLoc] = await Promise.all([
    prisma.location.findUnique({ where: { id: input.fromId } }),
    prisma.location.findUnique({ where: { id: input.toId } }),
  ]);
  if (!fromLoc) throw new RideError('NOT_FOUND', `Location with id ${input.fromId} not found`);
  if (!toLoc) throw new RideError('NOT_FOUND', `Location with id ${input.toId} not found`);

  return prisma.ride.create({
    data: {
      driverId,
      fromId: input.fromId,
      toId: input.toId,
      departureTime: new Date(input.departureTime),
      seatsAvailable: input.offeredSeats.length,
      offeredSeats: input.offeredSeats,
      price: input.price,
      driverNote: input.driverNote || null,
    },
  });
}

export async function getRideById(id: number) {
  return prisma.ride.findUnique({
    where: { id },
    include: { from: true, to: true, driver: true, bookings: true },
  });
}

export async function listMyRides(driverId: string) {
  return prisma.ride.findMany({
    where: { driverId },
    orderBy: { departureTime: 'desc' },
    include: { from: true, to: true, bookings: true },
    take: 200,
  });
}

export async function cancelRide(driverId: string, rideId: number) {
  return prisma.$transaction(async (tx) => {
    const ride = await tx.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new RideError('NOT_FOUND', 'Ride not found');
    if (ride.driverId !== driverId) throw new RideError('FORBIDDEN', 'Only the ride owner can cancel');
    if (ride.status !== RIDE_STATUS.ACTIVE) throw new RideError('NOT_ACTIVE', 'Only active rides can be cancelled');

    // Cascade: reject all pending/approved bookings when ride is cancelled (H3, H6)
    await tx.booking.updateMany({
      where: { rideId, status: { in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED] } },
      data: { status: BOOKING_STATUS.REJECTED },
    });

    return tx.ride.update({
      where: { id: rideId },
      data: { status: RIDE_STATUS.CANCELLED },
    });
  });
}
