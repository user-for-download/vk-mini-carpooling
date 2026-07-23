import { z } from 'zod';
import { LocationDTOSchema } from './location.schema';
import { UserDTOSchema } from './user.schema';
import { BookingDTOSchema } from './booking.schema';

export const RideStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']);
export type RideStatus = z.infer<typeof RideStatusSchema>;

/** What the driver submits from the "Create ride" form. */
export const CreateRideSchema = z.object({
  fromId: z.number().int().positive(),
  toId: z.number().int().positive(),
  departureTime: z.string().datetime().refine((val) => new Date(val) > new Date(), {
    message: 'Departure time must be in the future',
  }),
  offeredSeats: z.array(z.number().int()).min(1).max(5),
  price: z.number().int().min(0).max(1_000_000),
  driverNote: z.string().max(500).optional(),
}).refine((v) => v.fromId !== v.toId, {
  message: 'fromId and toId must be different locations',
  path: ['toId'],
});
export type CreateRideInput = z.infer<typeof CreateRideSchema>;

/** What the search form submits (query params are strings, so coerce). */
export const SearchRidesSchema = z.object({
  fromId: z.coerce.number().int().optional(),
  toId: z.coerce.number().int().optional(),
  date: z.string().date().optional(),
});
export type SearchRidesInput = z.infer<typeof SearchRidesSchema>;

/** What the API returns for a single ride (with relations). */
export const RideDTOSchema = z.object({
  id: z.number().int(),
  driverId: z.string(),
  fromId: z.number().int(),
  toId: z.number().int(),
  departureTime: z.string().datetime(),
  seatsAvailable: z.number().int(),
  offeredSeats: z.array(z.number().int()),
  price: z.number().int(),
  driverNote: z.string().nullable().optional(),
  status: RideStatusSchema,
  createdAt: z.string().datetime(),
  from: LocationDTOSchema.optional(),
  to: LocationDTOSchema.optional(),
  driver: UserDTOSchema.optional(),
  bookings: z.array(BookingDTOSchema).optional(),
});
export type RideDTO = z.infer<typeof RideDTOSchema>;
