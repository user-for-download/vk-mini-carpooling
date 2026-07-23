import { Component, useContext, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import bridge from '@vkontakte/vk-bridge';
import { RouterProvider, useActiveVkuiLocation, useGetPanelForView } from '@vkontakte/vk-mini-apps-router';
import {
  AdaptivityProvider,
  AppRoot,
  ConfigProvider,
  Root,
  View,
  Spinner,
  type AppearanceType,
} from '@vkontakte/vkui';
import { router } from './router';
import { RoleSelector } from './panels/RoleSelector/RoleSelectorPanel';
import { PassengerPanel } from './panels/Passenger/PassengerPanel';
import { DriverPanel } from './panels/Driver/DriverPanel';
import { RideDetailsPanel } from './panels/RideDetails/RideDetailsPanel';
import { DataContext, DataContextProvider } from './context/dataContext';
import { useInitApp } from './hooks/useInitApp';
import { EPanel } from './consts/panels';
import { EView } from './consts/views';

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
  const activePanel = useGetPanelForView(EView.MAIN);
  const ctx = useContext(DataContext);
  const isReady = ctx?.isReady ?? false;

  useInitApp();

  if (!isReady) {
    return (
      <Root activeView={EView.MAIN}>
        <View nav={EView.MAIN} activePanel={EPanel.ROLE_SELECTOR}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <Spinner size="large" />
          </div>
        </View>
      </Root>
    );
  }

  return (
    <Root activeView={activeView ?? EView.MAIN}>
      <View nav={EView.MAIN} activePanel={activePanel ?? EPanel.ROLE_SELECTOR}>
        <RoleSelector nav={EPanel.ROLE_SELECTOR} />
        <PassengerPanel nav={EPanel.PASSENGER} />
        <DriverPanel nav={EPanel.DRIVER} />
        <RideDetailsPanel nav={EPanel.RIDE_DETAILS} />
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
              <DataContextProvider>
                <Layout />
              </DataContextProvider>
            </RouterProvider>
          </AppRoot>
        </AdaptivityProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
};
