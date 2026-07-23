import { useEffect, useState } from 'react';
import type { LocationDTO } from '@local-blablacar/contracts';
import { listLocations } from '../api/locations';

/** Fetches the pickup-point list once on mount. Shared by DriverPanel and PassengerPanel. */
export function useLocations(): LocationDTO[] {
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  useEffect(() => {
    listLocations().then(setLocations).catch(console.error);
  }, []);
  return locations;
}
