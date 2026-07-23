import { Placeholder, Button } from '@vkontakte/vkui';

interface Props {
  action?: () => void;
  text?: string;
}

export function NetworkError({ action, text = 'Не удалось загрузить данные' }: Props) {
  return (
    <Placeholder
      stretched
      header="Ошибка"
      action={
        action && (
          <Button size="m" mode="secondary" onClick={action}>
            Повторить
          </Button>
        )
      }
    >
      {text}
    </Placeholder>
  );
}
