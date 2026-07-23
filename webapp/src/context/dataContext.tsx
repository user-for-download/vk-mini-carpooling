import { createContext, useState, type ReactNode } from 'react';
import type { UserDTO, LocationDTO } from '@local-blablacar/contracts';

interface AppData {
  user: UserDTO | null;
  locations: LocationDTO[];
  isReady: boolean;
}

export interface AppContextType extends AppData {
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

export const DataContext = createContext<AppContextType | null>(null);

export function DataContextProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>({
    user: null,
    locations: [],
    isReady: false,
  });

  return (
    <DataContext.Provider value={{ ...data, setData }}>
      {children}
    </DataContext.Provider>
  );
}
