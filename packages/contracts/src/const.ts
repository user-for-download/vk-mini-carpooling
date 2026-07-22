// Ride statuses
export const RIDE_STATUS = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type RideStatusValue = typeof RIDE_STATUS[keyof typeof RIDE_STATUS];

// Booking statuses
export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type BookingStatusValue = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS];
