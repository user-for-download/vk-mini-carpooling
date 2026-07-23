import type { CreateBookingInput, UpdateBookingStatusInput, UpdateBookingInput } from '@local-blablacar/contracts';
import { RIDE_STATUS, BOOKING_STATUS } from '@local-blablacar/contracts';
import { prisma, env } from '../runtime';

/**
 * Seat Management Invariant:
 * - `Ride.offeredSeats`: Array of seat IDs the driver offers (e.g. [1, 2, 3])
 * - `Ride.seatsAvailable`: Fast-indexable counter, decremented only on APPROVAL
 * - `Booking.seatIds`: Specific seat IDs requested by the passenger
 *
 * The `seatsAvailable` counter is decremented when a booking is APPROVED, not when created.
 * PENDING bookings do NOT affect `seatsAvailable`. This allows multiple passengers to
 * request the same seat (only the first approved wins).
 *
 * Exact seat validation is done via:
 * 1. Checking `seatIds` against `offeredSeats` (are these seats available?)
 * 2. Checking `seatIds` against already APPROVED/PENDING bookings (is anyone else using them?)
 */

export class BookingError extends Error {
  constructor(
    public code: 'FORBIDDEN' | 'ALREADY_PROCESSED' | 'NO_SEATS' | 'NOT_FOUND' | 'MAX_BOOKINGS' | 'TIME_CONFLICT',
    message: string,
  ) {
    super(message);
  }
}

export async function createBooking(passengerId: string, input: CreateBookingInput) {
  return prisma.$transaction(
    async (tx) => {
      const ride = await tx.ride.findUnique({
        where: { id: input.rideId },
      });
      if (!ride || ride.status !== RIDE_STATUS.ACTIVE) {
        throw new BookingError('NOT_FOUND', 'Ride not found or no longer active');
      }
      if (ride.driverId === passengerId) {
        throw new BookingError('FORBIDDEN', 'Drivers cannot book their own ride');
      }

      // 1. Verify selected seats are actually offered by the driver
      if (ride.offeredSeats.length > 0) {
        const invalidSeats = input.seatIds.filter((id) => !ride.offeredSeats.includes(id));
        if (invalidSeats.length > 0) {
          throw new BookingError('NO_SEATS', 'Selected seats are not offered on this ride');
        }
      }

      // 2. Prevent booking seats that are already APPROVED or PENDING for another passenger
      const blockingBookings = await tx.booking.findMany({
        where: { rideId: ride.id, status: { in: [BOOKING_STATUS.APPROVED, BOOKING_STATUS.PENDING] } },
      });
      const takenSeats = new Set(blockingBookings.flatMap((b) => b.seatIds));
      if (input.seatIds.some((id) => takenSeats.has(id))) {
        throw new BookingError('NO_SEATS', 'One or more selected seats are already taken or pending');
      }

      // 3. Check max booking count (only future/active rides)
      const activeBookingCount = await tx.booking.count({
        where: {
          passengerId,
          status: { in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED] },
          ride: {
            status: RIDE_STATUS.ACTIVE,
            departureTime: { gte: new Date() },
          },
        },
      });
      if (activeBookingCount >= env.MAX_BOOKING_COUNT) {
        throw new BookingError(
          'MAX_BOOKINGS',
          `Maximum ${env.MAX_BOOKING_COUNT} active bookings allowed`,
        );
      }

      // 4. Check for time conflict (overlapping rides)
      const CONFLICT_WINDOW_MS = 4 * 60 * 60 * 1000;
      const conflictWindowStart = new Date(ride.departureTime.getTime() - CONFLICT_WINDOW_MS);
      const conflictWindowEnd = new Date(ride.departureTime.getTime() + CONFLICT_WINDOW_MS);

      const conflictingBooking = await tx.booking.findFirst({
        where: {
          passengerId,
          status: { in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED] },
          ride: {
            status: RIDE_STATUS.ACTIVE,
            departureTime: { gte: conflictWindowStart, lte: conflictWindowEnd },
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

      // 5. Check if passenger already has a record (to avoid Prisma unique constraint crash)
      const existingBooking = await tx.booking.findUnique({
        where: { rideId_passengerId: { rideId: ride.id, passengerId } },
      });

      if (existingBooking) {
        if (existingBooking.status === BOOKING_STATUS.PENDING || existingBooking.status === BOOKING_STATUS.APPROVED) {
          throw new BookingError('ALREADY_PROCESSED', 'You already have an active booking for this ride');
        }
        // Reuse the cancelled/rejected booking record safely, refresh createdAt
        return tx.booking.update({
          where: { id: existingBooking.id },
          data: {
            status: BOOKING_STATUS.PENDING,
            seatsBooked: input.seatIds.length,
            seatIds: input.seatIds,
            passengerNote: input.passengerNote || null,
            createdAt: new Date(),
          }
        });
      }

      return tx.booking.create({
        data: {
          rideId: input.rideId,
          passengerId,
          seatsBooked: input.seatIds.length,
          seatIds: input.seatIds,
          passengerNote: input.passengerNote || null,
        },
      });
    },
    { isolationLevel: 'Serializable' },
  );
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
  return prisma.$transaction(
    async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: input.bookingId },
        include: { ride: true },
      });
      if (!booking) throw new BookingError('NOT_FOUND', 'Booking not found');
      if (booking.ride.driverId !== input.driverId) {
        throw new BookingError('FORBIDDEN', 'Only the ride owner can update this booking');
      }
      // Block updates to terminal states (REJECTED, CANCELLED)
      if (booking.status === BOOKING_STATUS.REJECTED || booking.status === BOOKING_STATUS.CANCELLED) {
        throw new BookingError('ALREADY_PROCESSED', 'Cannot update a rejected or cancelled booking');
      }

      if (input.status === BOOKING_STATUS.APPROVED) {
        if (booking.status === BOOKING_STATUS.APPROVED) {
          throw new BookingError('ALREADY_PROCESSED', 'Booking is already approved');
        }
        if (booking.ride.seatsAvailable < booking.seatsBooked) {
          throw new BookingError('NO_SEATS', 'Not enough seats left');
        }

        // Check specific seat collisions for approvals
        const approvedBookings = await tx.booking.findMany({
          where: { rideId: booking.rideId, status: BOOKING_STATUS.APPROVED },
        });
        const takenSeats = new Set(approvedBookings.flatMap((b) => b.seatIds));
        if (booking.seatIds.some((id) => takenSeats.has(id))) {
          throw new BookingError('NO_SEATS', 'These seats were already approved for another passenger');
        }

        await tx.ride.update({
          where: { id: booking.rideId, seatsAvailable: { gte: booking.seatsBooked } },
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
    },
    { isolationLevel: 'Serializable' },
  );
}

export async function listMyBookings(passengerId: string) {
  return prisma.booking.findMany({
    where: { passengerId },
    orderBy: [
      { status: 'asc' },
      { createdAt: 'desc' },
    ],
    include: { ride: { include: { from: true, to: true, driver: true } } },
  });
}

/**
 * Cancel a booking. Passengers can cancel PENDING or APPROVED bookings.
 * If cancelling an APPROVED booking on an active ride, seats are restored.
 */
export async function cancelBooking(passengerId: string, bookingId: number) {
  return prisma.$transaction(
    async (tx) => {
      const booking = await tx.booking.findUnique({
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
      if (booking.status === BOOKING_STATUS.CANCELLED) {
        throw new BookingError('ALREADY_PROCESSED', 'Booking is already cancelled');
      }

      // Only restore seats if the ride is still active and in the future
      if (booking.status === BOOKING_STATUS.APPROVED && booking.ride.status === RIDE_STATUS.ACTIVE && booking.ride.departureTime > new Date()) {
        await tx.ride.update({
          where: { id: booking.rideId },
          data: { seatsAvailable: { increment: booking.seatsBooked } },
        });
      }

      // Soft-delete: mark as CANCELLED instead of removing the record
      return tx.booking.update({
        where: { id: bookingId },
        data: { status: BOOKING_STATUS.CANCELLED },
      });
    },
    { isolationLevel: 'Serializable' },
  );
}

/**
 * Update seats/note on an existing PENDING booking.
 * Only the passenger who owns the booking can update it.
 */
export async function updateBooking(passengerId: string, bookingId: number, input: UpdateBookingInput) {
  return prisma.$transaction(
    async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { ride: true },
      });
      if (!booking) throw new BookingError('NOT_FOUND', 'Booking not found');
      if (booking.passengerId !== passengerId) {
        throw new BookingError('FORBIDDEN', 'Only the booking owner can update');
      }
      if (booking.status !== BOOKING_STATUS.PENDING) {
        throw new BookingError('ALREADY_PROCESSED', 'Can only update pending bookings');
      }

      const ride = booking.ride;

      // 1. Verify selected seats are actually offered
      if (ride.offeredSeats.length > 0) {
        const invalidSeats = input.seatIds.filter((id) => !ride.offeredSeats.includes(id));
        if (invalidSeats.length > 0) {
          throw new BookingError('NO_SEATS', 'Selected seats are not offered on this ride');
        }
      }

      // 2. Prevent booking seats already approved or pending for another passenger
      const blockingBookings = await tx.booking.findMany({
        where: {
          rideId: ride.id,
          status: { in: [BOOKING_STATUS.APPROVED, BOOKING_STATUS.PENDING] },
          id: { not: bookingId },
        },
      });
      const takenSeats = new Set(blockingBookings.flatMap((b) => b.seatIds));
      if (input.seatIds.some((id) => takenSeats.has(id))) {
        throw new BookingError('NO_SEATS', 'One or more selected seats are already taken or pending');
      }

      // Use strict undefined check to allow null (clearing the note)
      const updatedNote = input.passengerNote !== undefined ? input.passengerNote : booking.passengerNote;

      return tx.booking.update({
        where: { id: bookingId },
        data: {
          seatIds: input.seatIds,
          seatsBooked: input.seatIds.length,
          passengerNote: updatedNote,
        },
      });
    },
    { isolationLevel: 'Serializable' },
  );
}
