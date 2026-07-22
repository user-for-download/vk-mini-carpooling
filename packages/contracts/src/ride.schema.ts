import { z } from 'zod';

export const RideStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']);
export type RideStatus = z.infer<typeof RideStatusSchema>;

/** What the driver submits from the "Create ride" form. */
export const CreateRideSchema = z.object({
  fromId: z.number().int(),
  toId: z.number().int(),
  // ISO 8601 string, always sent as UTC. Convert from <input type="datetime-local">
  // using `new Date(localValue).toISOString()` on the client.
  departureTime: z.string().datetime(),
  seatsAvailable: z.number().int().min(1).max(8),
  price: z.number().int().min(0).max(1_000_000),
}).refine((v) => v.fromId !== v.toId, {
  message: 'fromId and toId must be different locations',
  path: ['toId'],
});
export type CreateRideInput = z.infer<typeof CreateRideSchema>;

/** What the search form submits. */
export const SearchRidesSchema = z.object({
  fromId: z.number().int().optional(),
  toId: z.number().int().optional(),
  date: z.string().date().optional(), // YYYY-MM-DD
});
export type SearchRidesInput = z.infer<typeof SearchRidesSchema>;

/** What the API returns for a single ride. */
export const RideDTOSchema = z.object({
  id: z.number().int(),
  driverId: z.string(),
  fromId: z.number().int(),
  toId: z.number().int(),
  departureTime: z.string().datetime(),
  seatsAvailable: z.number().int(),
  price: z.number().int(),
  status: RideStatusSchema,
  createdAt: z.string().datetime(),
});
export type RideDTO = z.infer<typeof RideDTOSchema>;
