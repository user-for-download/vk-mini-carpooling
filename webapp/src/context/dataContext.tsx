import { createContext, useState, useCallback, type ReactNode } from 'react';
import type { UserDTO, LocationDTO } from '@local-blablacar/contracts';

interface AppData {
  user: UserDTO | null;
  locations: LocationDTO[];
  isReady: boolean;
}

export interface AppContextType extends AppData {
  setUser: (user: UserDTO | null) => void;
  setLocations: (locations: LocationDTO[]) => void;
  setReady: (ready: boolean) => void;
  updateData: (patch: Partial<AppData>) => void;
}

export const DataContext = createContext<AppContextType | null>(null);

export function DataContextProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>({
    user: null,
    locations: [],
    isReady: false,
  });

  const setUser = useCallback((user: UserDTO | null) => setData((prev) => ({ ...prev, user })), []);
  const setLocations = useCallback((locations: LocationDTO[]) => setData((prev) => ({ ...prev, locations })), []);
  const setReady = useCallback((isReady: boolean) => setData((prev) => ({ ...prev, isReady })), []);
  const updateData = useCallback((patch: Partial<AppData>) => setData((prev) => ({ ...prev, ...patch })), []);

  return (
    <DataContext.Provider value={{ ...data, setUser, setLocations, setReady, updateData }}>
      {children}
    </DataContext.Provider>
  );
}
