import { useState, useEffect } from 'react';
import type { RideDTO } from '@local-blablacar/contracts';
import { getRide } from '../api/rides';

export function useRideDetails(rideId: number | null) {
  const [ride, setRide] = useState<RideDTO | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    if (rideId === null) return;

    let ignore = false;
    setLoading(true);
    setRide(null);
    setNotFound(false);
    setNetworkError(false);

    getRide(rideId)
      .then((data) => { if (!ignore) setRide(data); })
      .catch((err) => {
        if (!ignore) {
          if (err?.response?.status === 404) {
            setNotFound(true);
          } else {
            setNetworkError(true);
          }
        }
      })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, [rideId]);

  return { ride, setRide, notFound, networkError, isLoading };
}
