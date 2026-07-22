import type { CreateBookingInput, UpdateBookingStatusInput } from '@local-blablacar/contracts';
import { RIDE_STATUS, BOOKING_STATUS } from '@local-blablacar/contracts';
import { prisma, env } from '../runtime';

export class BookingError extends Error {
  constructor(
    public code: 'FORBIDDEN' | 'ALREADY_PROCESSED' | 'NO_SEATS' | 'NOT_FOUND' | 'MAX_BOOKINGS' | 'TIME_CONFLICT',
    message: string,
  ) {
    super(message);
  }
}

export async function createBooking(passengerId: string, input: CreateBookingInput) {
  const ride = await prisma.ride.findUnique({ where: { id: input.rideId } });
  if (!ride || ride.status !== RIDE_STATUS.ACTIVE) {
    throw new BookingError('NOT_FOUND', 'Ride not found or no longer active');
  }
  if (ride.driverId === passengerId) {
    throw new BookingError('FORBIDDEN', 'Drivers cannot book their own ride');
  }

  // Check if seats available
  if (ride.seatsAvailable < input.seatsBooked) {
    throw new BookingError('NO_SEATS', 'Not enough seats available');
  }

  // Check max booking count
  const activeBookingCount = await prisma.booking.count({
    where: {
      passengerId,
      status: { in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED] },
    },
  });
  if (activeBookingCount >= env.MAX_BOOKING_COUNT) {
    throw new BookingError(
      'MAX_BOOKINGS',
      `Maximum ${env.MAX_BOOKING_COUNT} active bookings allowed`,
    );
  }

  // Check for time conflict (overlapping rides)
  const rideStart = new Date(ride.departureTime);
  const rideEnd = new Date(rideStart.getTime() + 2 * 60 * 60 * 1000); // Assume 2h ride duration

  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      passengerId,
      status: { in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED] },
      ride: {
        status: RIDE_STATUS.ACTIVE,
        departureTime: {
          gte: new Date(rideEnd.getTime() - 2 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000), // 4h before ride end
          lte: new Date(rideStart.getTime() + 2 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2h after ride end
        },
      },
    },
    include: { ride: true },
  });

  if (conflictingBooking) {
    throw new BookingError(
      'TIME_CONFLICT',
      `You already have a booking for a ride at a similar time (${conflictingBooking.ride.departureTime})`,
    );
  }

  return prisma.booking.create({
    data: { rideId: input.rideId, passengerId, seatsBooked: input.seatsBooked },
  });
}

/**
 * Approves or rejects a booking. Approval decrements Ride.seatsAvailable.
 * Rejection of an approved booking restores seats.
 */
export async function updateBookingStatus(input: {
  driverId: string;
  bookingId: number;
  status: UpdateBookingStatusInput['status'];
}) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: input.bookingId },
      include: { ride: true },
    });
    if (!booking) throw new BookingError('NOT_FOUND', 'Booking not found');
    if (booking.ride.driverId !== input.driverId) {
      throw new BookingError('FORBIDDEN', 'Only the ride owner can update this booking');
    }
    if (booking.status === BOOKING_STATUS.REJECTED) {
      throw new BookingError('ALREADY_PROCESSED', 'Cannot update a rejected booking');
    }

    if (input.status === BOOKING_STATUS.APPROVED) {
      if (booking.status === BOOKING_STATUS.APPROVED) {
        throw new BookingError('ALREADY_PROCESSED', 'Booking is already approved');
      }
      if (booking.ride.seatsAvailable < booking.seatsBooked) {
        throw new BookingError('NO_SEATS', 'Not enough seats left');
      }
      await tx.ride.update({
        where: { id: booking.rideId },
        data: { seatsAvailable: { decrement: booking.seatsBooked } },
      });
    }

    if (input.status === BOOKING_STATUS.REJECTED) {
      if (booking.status === BOOKING_STATUS.APPROVED) {
        // Restore seats when rejecting an approved booking
        await tx.ride.update({
          where: { id: booking.rideId },
          data: { seatsAvailable: { increment: booking.seatsBooked } },
        });
      }
    }

    return tx.booking.update({ where: { id: input.bookingId }, data: { status: input.status } });
  });
}

export async function listMyBookings(passengerId: string) {
  return prisma.booking.findMany({
    where: { passengerId },
    orderBy: { createdAt: 'desc' },
    include: { ride: { include: { from: true, to: true } } },
  });
}

/**
 * Cancel a booking. Passengers can cancel PENDING or APPROVED bookings.
 * If cancelling an APPROVED booking, seats are restored.
 */
export async function cancelBooking(passengerId: string, bookingId: number) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { ride: true },
  });
  if (!booking) throw new BookingError('NOT_FOUND', 'Booking not found');
  if (booking.passengerId !== passengerId) {
    throw new BookingError('FORBIDDEN', 'Only the booking owner can cancel');
  }
  if (booking.status === BOOKING_STATUS.REJECTED) {
    throw new BookingError('ALREADY_PROCESSED', 'Cannot cancel a rejected booking');
  }

  return prisma.$transaction(async (tx) => {
    // If cancelling an approved booking, restore seats
    if (booking.status === BOOKING_STATUS.APPROVED) {
      await tx.ride.update({
        where: { id: booking.rideId },
        data: { seatsAvailable: { increment: booking.seatsBooked } },
      });
    }
    return tx.booking.delete({ where: { id: bookingId } });
  });
}
