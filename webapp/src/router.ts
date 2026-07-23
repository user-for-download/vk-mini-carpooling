import { createHashRouter } from '@vkontakte/vk-mini-apps-router';
import { EPanel } from './consts/panels';
import { EView } from './consts/views';

export const router = createHashRouter([
  {
    path: '/',
    panel: EPanel.ROLE_SELECTOR,
    view: EView.MAIN,
  },
  {
    path: '/passenger',
    panel: EPanel.PASSENGER,
    view: EView.MAIN,
  },
  {
    path: '/driver',
    panel: EPanel.DRIVER,
    view: EView.MAIN,
  },
  {
    path: '/ride/:id',
    panel: EPanel.RIDE_DETAILS,
    view: EView.MAIN,
  },
]);
