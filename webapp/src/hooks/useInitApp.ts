import { useContext, useEffect } from 'react';
import bridge from '@vkontakte/vk-bridge';
import { DataContext } from '../context/dataContext';
import { initUser } from '../api/user';
import { listLocations } from '../api/locations';

export function useInitApp() {
  const ctx = useContext(DataContext);

  useEffect(() => {
    if (!ctx) return;

    const initialize = async () => {
      try {
        // 1. Initialize User
        if (import.meta.env.DEV && !window.location.search.includes('vk_user_id')) {
          const mockUser = new URLSearchParams(window.location.search).get('mock_user') ?? 'passenger';
          await initUser({
            firstName: mockUser === 'driver' ? 'Alex' : 'Ivan',
            lastName: mockUser === 'driver' ? 'Driver' : 'Smirnov',
          });
        } else {
          let firstName: string | undefined;
          let lastName: string | undefined;
          let photoUrl: string | undefined;

          try {
            const vkUserInfo = await bridge.send('VKWebAppGetUserInfo');
            firstName = vkUserInfo.first_name;
            lastName = vkUserInfo.last_name;
            photoUrl = vkUserInfo.photo_200;
          } catch (bridgeErr) {
            console.warn('VKWebAppGetUserInfo denied or failed. Initializing with default data.', bridgeErr);
          }

          await initUser({ firstName, lastName, photoUrl });
        }

        // 2. Fetch Locations
        const locations = await listLocations();

        // 3. Update Global Context
        ctx.setData((prev) => ({
          ...prev,
          locations,
          isReady: true,
        }));
      } catch (err) {
        console.error('Failed to init app:', err);
        // Allow the app to render even if init fails
        ctx.setData((prev) => ({ ...prev, isReady: true }));
      }
    };

    initialize();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
