import { Snackbar, Button } from '@vkontakte/vkui';

interface Props {
  text?: string;
  onClose: () => void;
  action?: () => void;
}

export function ErrorSnackbar({
  text = 'Что-то пошло не так',
  onClose,
  action,
}: Props) {
  return (
    <Snackbar
      onClose={onClose}
      before={
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--vkui-color-background-negative)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontSize: 16, fontWeight: 700 }}>!</span>
        </div>
      }
      action={
        action ? (
          <Button mode="link" appearance="accent" size="s" onClick={action}>
            Повторить
          </Button>
        ) : undefined
      }
    >
      {text}
    </Snackbar>
  );
}
