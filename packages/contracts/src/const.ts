import { RideStatusSchema } from './ride.schema';
import { BookingStatusSchema } from './booking.schema';

// Derived from the schemas themselves so these two can never drift apart.
export const RIDE_STATUS = RideStatusSchema.enum;
export type RideStatusValue = (typeof RIDE_STATUS)[keyof typeof RIDE_STATUS];

export const BOOKING_STATUS = BookingStatusSchema.enum;
export type BookingStatusValue = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

// Shared with backend/src/runtime.ts (env default) and PassengerPanel.tsx.
export const MAX_BOOKING_COUNT = 5;
