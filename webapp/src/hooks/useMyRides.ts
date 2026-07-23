import { useState, useEffect, useCallback } from 'react';
import type { RideDTO } from '@local-blablacar/contracts';
import { listMyRides } from '../api/rides';

export function useMyRides() {
  const [rides, setRides] = useState<RideDTO[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRides = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMyRides();
      setRides(data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Не удалось загрузить поездки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  return { rides, isLoading, error, refetch: fetchRides };
}
