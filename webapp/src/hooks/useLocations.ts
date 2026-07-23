import { useEffect, useState, useRef } from 'react';
import type { LocationDTO } from '@local-blablacar/contracts';
import { listLocations } from '../api/locations';

interface UseLocationsResult {
  locations: LocationDTO[];
  loading: boolean;
  error: string | null;
}

/** Fetches the pickup-point list once on mount. Shared by DriverPanel and PassengerPanel. */
export function useLocations(): UseLocationsResult {
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ignoreRef = useRef(false);

  useEffect(() => {
    ignoreRef.current = false;
    setLoading(true);
    listLocations()
      .then((data) => {
        if (!ignoreRef.current) {
          setLocations(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignoreRef.current) {
          setError('Не удалось загрузить точки');
          console.error(err);
        }
      })
      .finally(() => {
        if (!ignoreRef.current) setLoading(false);
      });
    return () => { ignoreRef.current = true; };
  }, []);

  return { locations, loading, error };
}
