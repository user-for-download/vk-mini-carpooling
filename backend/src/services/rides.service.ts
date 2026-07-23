import type { CreateRideInput, SearchRidesInput } from '@local-blablacar/contracts';
import { RIDE_STATUS } from '@local-blablacar/contracts';
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
  return prisma.ride.findMany({
    where: {
      status: RIDE_STATUS.ACTIVE,
      fromId: filters.fromId,
      toId: filters.toId,
      departureTime: filters.date
        ? {
            gte: new Date(`${filters.date}T00:00:00.000Z`),
            lt: new Date(`${filters.date}T23:59:59.999Z`),
          }
        : { gte: new Date() },
    },
    orderBy: { departureTime: 'asc' },
    include: { from: true, to: true, driver: true },
  });
}

export async function createRide(driverId: string, input: CreateRideInput) {
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
  });
}

export async function cancelRide(driverId: string, rideId: number) {
  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) throw new RideError('NOT_FOUND', 'Ride not found');
  if (ride.driverId !== driverId) throw new RideError('FORBIDDEN', 'Only the ride owner can cancel');
  if (ride.status !== RIDE_STATUS.ACTIVE) throw new RideError('NOT_ACTIVE', 'Only active rides can be cancelled');
  return prisma.ride.update({
    where: { id: rideId },
    data: { status: RIDE_STATUS.CANCELLED },
  });
}
