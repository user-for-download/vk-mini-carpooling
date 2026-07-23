import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import bridge from '@vkontakte/vk-bridge';
import { RouterProvider, useActiveVkuiLocation, useGetPanelForView } from '@vkontakte/vk-mini-apps-router';
import {
  AdaptivityProvider,
  AppRoot,
  ConfigProvider,
  Root,
  View,
  type AppearanceType,
} from '@vkontakte/vkui';
import { router } from './router';
import { RoleSelector } from './panels/RoleSelector';
import { PassengerPanel } from './panels/PassengerPanel';
import { DriverPanel } from './panels/DriverPanel';
import { RideDetails } from './panels/RideDetails';
import { initUser } from './api/user';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2>Что-то пошло не так</h2>
          <p style={{ color: '#818c99' }}>Попробуйте перезагрузить страницу</p>
          <button onClick={() => window.location.reload()}>Перезагрузить</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function useVkAppearance(): AppearanceType {
  const [appearance, setAppearance] = useState<AppearanceType>('light');

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler: Parameters<typeof bridge.subscribe>[0] = ((e: any) => {
      if (e.detail.type === 'VKWebAppUpdateConfig' && 'appearance' in e.detail.data) {
        setAppearance(e.detail.data.appearance as AppearanceType);
      }
    }) as any;
    bridge.subscribe(handler);
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bridge.unsubscribe(handler as any);
    };
  }, []);

  return appearance;
}

function Layout() {
  const { view: activeView } = useActiveVkuiLocation();
  const activePanel = useGetPanelForView('main');
  const [userReady, setUserReady] = useState(false);

  useEffect(() => {
    async function ensureUser() {
      try {
        if (import.meta.env.DEV && !window.location.search.includes('vk_user_id')) {
          const mockUser = new URLSearchParams(window.location.search).get('mock_user') ?? 'passenger';
          await initUser({ 
            firstName: mockUser === 'driver' ? 'Alex' : 'Ivan', 
            lastName: mockUser === 'driver' ? 'Driver' : 'Smirnov' 
          });
        } else {
          let firstName = undefined;
          let lastName = undefined;
          let photoUrl = undefined;
          
          try {
            // This can throw if the user clicks "Deny" on the VK permissions popup
            const vkUserInfo = await bridge.send('VKWebAppGetUserInfo');
            firstName = vkUserInfo.first_name;
            lastName = vkUserInfo.last_name;
            photoUrl = vkUserInfo.photo_200;
          } catch (bridgeErr) {
            console.warn('VKWebAppGetUserInfo denied or failed. Initializing with default data.', bridgeErr);
          }
          
          // The backend implicitly gets their vk_user_id from the Launch Params HMAC token
          await initUser({ firstName, lastName, photoUrl });
        }
      } catch (err) {
        console.error('Failed to init user:', err);
      } finally {
        setUserReady(true);
      }
    }
    ensureUser();
  }, []);

  if (!userReady) {
    return (
      <Root activeView="main">
        <View nav="main" activePanel="role_selector">
          <RoleSelector nav="role_selector" />
        </View>
      </Root>
    );
  }

  return (
    <Root activeView={activeView ?? 'main'}>
      <View nav="main" activePanel={activePanel ?? 'role_selector'}>
        <RoleSelector nav="role_selector" />
        <PassengerPanel nav="passenger" />
        <DriverPanel nav="driver" />
        <RideDetails nav="ride_details" />
      </View>
    </Root>
  );
}

export const App = () => {
  const appearance = useVkAppearance();

  return (
    <ErrorBoundary>
      <ConfigProvider appearance={appearance}>
        <AdaptivityProvider>
          <AppRoot>
            <RouterProvider router={router}>
              <Layout />
            </RouterProvider>
          </AppRoot>
        </AdaptivityProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
};
