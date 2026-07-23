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

  // Find rides that have at least one offered seat not occupied by PENDING/APPROVED bookings
  const rides = await prisma.ride.findMany({
    where: {
      status: RIDE_STATUS.ACTIVE,
      seatsAvailable: { gt: 0 },
      ...(filters.fromId !== undefined ? { fromId: filters.fromId } : {}),
      ...(filters.toId !== undefined ? { toId: filters.toId } : {}),
      departureTime: departureFilter,
    },
    include: {
      from: true,
      to: true,
      driver: true,
      bookings: {
        where: { status: { in: [BOOKING_STATUS.APPROVED, BOOKING_STATUS.PENDING] } },
        select: { seatIds: true },
      },
    },
    orderBy: { departureTime: 'asc' },
    take: 100,
  });

  // Filter out rides where all offered seats are occupied
  return rides.filter((ride) => {
    const occupiedSeats = new Set(ride.bookings.flatMap((b) => b.seatIds));
    const hasAvailableSeat = ride.offeredSeats.some((seatId) => !occupiedSeats.has(seatId));
    return hasAvailableSeat;
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

  // Check for driver time conflicts (4-hour window)
  const departureTime = new Date(input.departureTime);
  const CONFLICT_WINDOW_MS = 4 * 60 * 60 * 1000;
  const conflictingRide = await prisma.ride.findFirst({
    where: {
      driverId,
      status: RIDE_STATUS.ACTIVE,
      departureTime: {
        gte: new Date(departureTime.getTime() - CONFLICT_WINDOW_MS),
        lte: new Date(departureTime.getTime() + CONFLICT_WINDOW_MS),
      },
    },
  });
  if (conflictingRide) {
    throw new RideError('FORBIDDEN', 'You already have an active ride near this time');
  }

  // Filter out driver seat (id=1) from offeredSeats - driver seat cannot be offered to passengers
  const validOfferedSeats = input.offeredSeats.filter((id) => id !== 1);
  if (validOfferedSeats.length === 0) {
    throw new RideError('FORBIDDEN', 'At least one passenger seat must be offered');
  }

  return prisma.ride.create({
    data: {
      driverId,
      fromId: input.fromId,
      toId: input.toId,
      departureTime: new Date(input.departureTime),
      seatsAvailable: validOfferedSeats.length,
      offeredSeats: validOfferedSeats,
      price: input.price,
      driverNote: input.driverNote || null,
    },
  });
}

export async function getRideById(id: number, requesterId: string) {
  const ride = await prisma.ride.findUnique({
    where: { id },
    include: {
      from: true,
      to: true,
      driver: true,
      // Include PENDING bookings so seats render as occupied (grey) for everyone
      bookings: {
        where: { status: { in: [BOOKING_STATUS.APPROVED, BOOKING_STATUS.PENDING] } },
        include: { passenger: true },
      },
    },
  });

  if (!ride) return null;

  // Scrub passenger data for PENDING bookings to prevent data leak,
  // unless the requester is the driver or the passenger themselves
  if (ride.driverId !== requesterId) {
    ride.bookings = ride.bookings.map((b) => {
      if (b.status === BOOKING_STATUS.PENDING && b.passengerId !== requesterId) {
        const { passenger: _p, passengerNote: _n, ...rest } = b;
        return rest as typeof ride.bookings[number];
      }
      return b;
    });
  }

  return ride;
}

export async function listMyRides(driverId: string) {
  return prisma.ride.findMany({
    where: { driverId },
    orderBy: [
      { status: 'asc' },
      { departureTime: 'desc' },
    ],
    include: {
      from: true,
      to: true,
      driver: true,
      // Only include active bookings (PENDING/APPROVED), not CANCELLED/REJECTED
      bookings: {
        where: { status: { in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED] } },
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
    if (ride.departureTime < new Date()) throw new RideError('FORBIDDEN', 'Нельзя отменить прошедшую поездку');

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
