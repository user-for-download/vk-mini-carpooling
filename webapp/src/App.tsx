import { useEffect, useState } from 'react';
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

function useVkAppearance(): AppearanceType {
  const [appearance, setAppearance] = useState<AppearanceType>('light');

  useEffect(() => {
    const unsubscribe = bridge.subscribe((e) => {
      if (e.detail.type === 'VKWebAppUpdateConfig' && 'appearance' in e.detail.data) {
        setAppearance(e.detail.data.appearance as AppearanceType);
      }
    });
    return () => bridge.unsubscribe(unsubscribe);
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
    <ConfigProvider appearance={appearance}>
      <AdaptivityProvider>
        <AppRoot>
          <RouterProvider router={router}>
            <Layout />
          </RouterProvider>
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  );
};
