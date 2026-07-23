import { Alert } from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';

interface Props {
  title: string;
  text: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmPopout({
  title,
  text,
  onConfirm,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
}: Props) {
  const routeNavigator = useRouteNavigator();

  const handleConfirm = () => {
    onConfirm();
    routeNavigator.hidePopout();
  };

  return (
    <Alert
      actions={[
        {
          title: confirmText,
          mode: 'destructive',
          action: handleConfirm,
        },
        {
          title: cancelText,
          mode: 'cancel',
        },
      ]}
      actionsLayout="horizontal"
      onClose={() => routeNavigator.hidePopout()}
      header={title}
      text={text}
    />
  );
}
