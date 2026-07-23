import { useState, useEffect, useCallback } from 'react';
import type { BookingDTO } from '@local-blablacar/contracts';
import { listMyBookings } from '../api/bookings';

export function useMyBookings() {
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMyBookings();
      setBookings(data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Не удалось загрузить бронирования');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return { bookings, setBookings, isLoading, error, refetch: fetchBookings };
}
