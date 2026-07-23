import type { CreateRideInput, RideDTO, SearchRidesInput } from '@local-blablacar/contracts';
import { api } from './client';

export async function searchRides(filters: SearchRidesInput, signal?: AbortSignal): Promise<RideDTO[]> {
  const { data } = await api.get<RideDTO[]>('/api/rides', { params: filters, signal });
  return data;
}

export async function getRide(id: number): Promise<RideDTO> {
  const { data } = await api.get<RideDTO>(`/api/rides/${id}`);
  return data;
}

export async function createRide(input: CreateRideInput): Promise<RideDTO> {
  const { data } = await api.post<RideDTO>('/api/rides', input);
  return data;
}

export async function listMyRides(): Promise<RideDTO[]> {
  const { data } = await api.get<RideDTO[]>('/api/rides/mine');
  return data;
}

export async function cancelRide(id: number): Promise<RideDTO> {
  const { data } = await api.delete<RideDTO>(`/api/rides/${id}`);
  return data;
}
