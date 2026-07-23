import { z } from 'zod';
import { LocationDTOSchema } from './location.schema';

export const BookingStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

/** What a passenger submits to request a seat. */
export const CreateBookingSchema = z.object({
  rideId: z.number().int(),
  seatIds: z.array(z.number().int()).min(1).max(5),
  passengerNote: z.string().max(500).optional(),
});
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

/** What a driver submits to approve/reject a pending booking. */
export const UpdateBookingStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});
export type UpdateBookingStatusInput = z.infer<typeof UpdateBookingStatusSchema>;

/** Minimal ride reference embedded in BookingDTO (avoids circular reference with RideDTO). */
const RideRefSchema = z.object({
  id: z.number().int(),
  departureTime: z.string().datetime(),
  seatsAvailable: z.number().int(),
  offeredSeats: z.array(z.number().int()),
  price: z.number().int(),
  from: LocationDTOSchema.optional(),
  to: LocationDTOSchema.optional(),
});

export const BookingDTOSchema = z.object({
  id: z.number().int(),
  rideId: z.number().int(),
  passengerId: z.string(),
  seatsBooked: z.number().int(),
  seatIds: z.array(z.number().int()),
  passengerNote: z.string().nullable().optional(),
  status: BookingStatusSchema,
  ride: RideRefSchema.optional(),
});
export type BookingDTO = z.infer<typeof BookingDTOSchema>;
