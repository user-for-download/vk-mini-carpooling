import type { UserDTO } from '@local-blablacar/contracts';
import { api } from './client';

export type User = UserDTO;

export async function initUser(data: { firstName?: string; lastName?: string; photoUrl?: string }): Promise<User> {
  const { data: user } = await api.post<User>('/api/users/init', data);
  return user;
}

export async function getCurrentUser(): Promise<User> {
  const { data: user } = await api.get<User>('/api/users/me');
  return user;
}
