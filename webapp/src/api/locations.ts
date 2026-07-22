import type { LocationDTO } from '@local-blablacar/contracts';
import { api } from './client';

export async function listLocations(): Promise<LocationDTO[]> {
  const { data } = await api.get<LocationDTO[]>('/api/locations');
  return data;
}
