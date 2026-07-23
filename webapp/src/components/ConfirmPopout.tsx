import { Alert } from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';

interface ConfirmOptions {
  title: string;
  text: string;
  onConfirm: () => void;
  confirmText?: string;
}

/**
 * Shows a confirmation dialog.
 * In dev mode (non-VK), uses window.confirm for simplicity.
 * In VK Mini App, uses VKUI Alert via router popout.
 */
export function useConfirm() {
  const routeNavigator = useRouteNavigator();

  const isDev = import.meta.env.DEV && !window.location.search.includes('vk_user_id');

  return ({ title, text, onConfirm, confirmText = 'Подтвердить' }: ConfirmOptions) => {
    if (isDev) {
      const message = `${title}\n\n${text}`;
      if (window.confirm(message)) {
        onConfirm();
      }
      return;
    }

    // Use VKUI Alert in VK Mini App
    routeNavigator.showPopout(
      <Alert
        actions={[
          {
            title: confirmText,
            mode: 'destructive',
            action: () => {
              onConfirm();
              routeNavigator.hidePopout();
            },
          },
          {
            title: 'Отмена',
            mode: 'cancel',
          },
        ]}
        actionsLayout="horizontal"
        onClose={() => routeNavigator.hidePopout()}
        header={title}
        text={text}
      />
    );
  };
}
