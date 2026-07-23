import type { BookingDTO, CreateBookingInput, UpdateBookingStatusInput, UpdateBookingInput } from '@local-blablacar/contracts';
import { api } from './client';

export async function createBooking(input: CreateBookingInput): Promise<BookingDTO> {
  const { data } = await api.post<BookingDTO>('/api/bookings', input);
  return data;
}

export async function listMyBookings(): Promise<BookingDTO[]> {
  const { data } = await api.get<BookingDTO[]>('/api/bookings/mine');
  return data;
}

export async function updateBookingStatus(
  id: number,
  input: UpdateBookingStatusInput,
): Promise<BookingDTO> {
  const { data } = await api.patch<BookingDTO>(`/api/bookings/${id}/status`, input);
  return data;
}

export async function updateBooking(id: number, input: UpdateBookingInput): Promise<BookingDTO> {
  const { data } = await api.patch<BookingDTO>(`/api/bookings/${id}`, input);
  return data;
}

export async function cancelBooking(id: number): Promise<BookingDTO> {
  const { data } = await api.delete<BookingDTO>(`/api/bookings/${id}`);
  return data;
}
