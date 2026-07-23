import { useEffect, useState } from 'react';
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

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    listLocations()
      .then((data) => {
        if (!ignore) {
          setLocations(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError('Не удалось загрузить точки');
          console.error(err);
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => { ignore = true; };
  }, []);

  return { locations, loading, error };
}
