import { createHashRouter } from '@vkontakte/vk-mini-apps-router';

export const router = createHashRouter([
  {
    path: '/',
    panel: 'role_selector',
    view: 'main',
  },
  {
    path: '/passenger',
    panel: 'passenger',
    view: 'main',
  },
  {
    path: '/driver',
    panel: 'driver',
    view: 'main',
  },
  {
    path: '/ride/:id',
    panel: 'ride_details',
    view: 'main',
  },
]);
