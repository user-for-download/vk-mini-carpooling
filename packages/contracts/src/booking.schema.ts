import { z } from 'zod';

export const BookingStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

/** What a passenger submits to request a seat. */
export const CreateBookingSchema = z.object({
  rideId: z.number().int(),
  seatsBooked: z.number().int().min(1).max(8),
});
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

/** What a driver submits to approve/reject a pending booking. */
export const UpdateBookingStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});
export type UpdateBookingStatusInput = z.infer<typeof UpdateBookingStatusSchema>;

export const BookingDTOSchema = z.object({
  id: z.number().int(),
  rideId: z.number().int(),
  passengerId: z.string(),
  seatsBooked: z.number().int(),
  status: BookingStatusSchema,
});
export type BookingDTO = z.infer<typeof BookingDTOSchema>;
