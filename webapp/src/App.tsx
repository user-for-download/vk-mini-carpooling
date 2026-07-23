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

// Error boundary to prevent white screen crashes (H24)
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
    // VKBridge's subscribe/unsubscribe types are incompatible with each other.
    // The handler passed to subscribe expects (event) => void, but unsubscribe
    // expects the same function back — and the overloaded signatures don't line up.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler: Parameters<typeof bridge.subscribe>[0] = ((e: any) => {
      if (e.detail.type === 'VKWebAppUpdateConfig' && 'appearance' in e.detail.data) {
        setAppearance(e.detail.data.appearance as AppearanceType);
      }
    }) as any;
    const unsubscribe = bridge.subscribe(handler);
    return () => bridge.unsubscribe(unsubscribe as any);
  }, []);

  return appearance;
}

function Layout() {
  const { view: activeView } = useActiveVkuiLocation();
  const activePanel = useGetPanelForView('main');

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
