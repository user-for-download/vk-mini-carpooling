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

  // Build departure time filter - compare in UTC to avoid timezone issues
  let departureFilter: { gte: Date; lt?: Date };
  if (filters.date) {
    const requestedDate = new Date(`${filters.date}T00:00:00.000Z`);
    departureFilter = {
      gte: requestedDate > now ? requestedDate : now,
      lt: new Date(`${filters.date}T23:59:59.999Z`),
    };
  } else {
    departureFilter = { gte: now };
  }

  return prisma.ride.findMany({
    where: {
      status: RIDE_STATUS.ACTIVE,
      seatsAvailable: { gt: 0 },
      ...(filters.fromId !== undefined ? { fromId: filters.fromId } : {}),
      ...(filters.toId !== undefined ? { toId: filters.toId } : {}),
      departureTime: departureFilter,
    },
    orderBy: { departureTime: 'asc' },
    include: { from: true, to: true, driver: true },
    take: 100,
  });
}

export async function createRide(driverId: string, input: CreateRideInput) {
  const user = await prisma.user.findUnique({ where: { id: driverId } });
  if (!user) throw new RideError('NOT_FOUND', 'User not found. Call POST /init first.');

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
    include: {
      from: true,
      to: true,
      driver: true,
      // Only return approved bookings to prevent data leak
      bookings: {
        where: { status: BOOKING_STATUS.APPROVED },
        include: { passenger: true },
      },
    },
  });
}

export async function listMyRides(driverId: string) {
  return prisma.ride.findMany({
    where: { driverId },
    orderBy: { departureTime: 'desc' },
    include: {
      from: true,
      to: true,
      // Only return approved bookings for driver view
      bookings: {
        where: { status: BOOKING_STATUS.APPROVED },
        include: { passenger: true },
      },
    },
    take: 200,
  });
}

export async function cancelRide(driverId: string, rideId: number) {
  return prisma.$transaction(async (tx) => {
    const ride = await tx.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new RideError('NOT_FOUND', 'Ride not found');
    if (ride.driverId !== driverId) throw new RideError('FORBIDDEN', 'Only the ride owner can cancel');
    if (ride.status !== RIDE_STATUS.ACTIVE) throw new RideError('NOT_ACTIVE', 'Only active rides can be cancelled');

    // Cascade: cancel all pending/approved bookings when ride is cancelled
    await tx.booking.updateMany({
      where: { rideId, status: { in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED] } },
      data: { status: BOOKING_STATUS.CANCELLED },
    });

    return tx.ride.update({
      where: { id: rideId },
      data: { status: RIDE_STATUS.CANCELLED },
    });
  });
}
