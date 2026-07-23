import { Panel, PanelHeader, Title, Text, Button, Card, Div } from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import '../../styles.css';

interface Props {
  nav: string;
}

export function RoleSelector({ nav }: Props) {
  const routeNavigator = useRouteNavigator();

  return (
    <Panel nav={nav}>
      <PanelHeader>Local BlaBlaCar</PanelHeader>

      <Div style={{ textAlign: 'center', paddingTop: 0 }}>
        <Title level="1" style={{ marginBottom: 8, color: 'var(--vkui-color-text-primary)' }}>
          Local BlaBlaCar
        </Title>
        <Text style={{ color: 'var(--vkui-color-text-secondary)', marginBottom: 40 }}>
          Найди попутчика или предложи поездку
        </Text>
      </Div>

      <Div>
        <Card
          mode="shadow"
          style={{ cursor: 'pointer', marginBottom: 16 }}
          onClick={() => routeNavigator.push('/passenger')}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              routeNavigator.push('/passenger');
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Пассажир — найти поездку"
        >
          <Div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--vkui-color-background-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <Title level="2" style={{ marginBottom: 4, color: 'var(--vkui-color-text-primary)' }}>
                Пассажир
              </Title>
              <Text style={{ color: 'var(--vkui-color-text-secondary)' }}>
                Найти поездку
              </Text>
            </div>
          </Div>
        </Card>

        <Card
          mode="shadow"
          style={{ cursor: 'pointer' }}
          onClick={() => routeNavigator.push('/driver')}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              routeNavigator.push('/driver');
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Водитель — предложить поездку"
        >
          <Div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--vkui-color-background-positive)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <Title level="2" style={{ marginBottom: 4, color: 'var(--vkui-color-text-primary)' }}>
                Водитель
              </Title>
              <Text style={{ color: 'var(--vkui-color-text-secondary)' }}>
                Предложить поездку
              </Text>
            </div>
          </Div>
        </Card>
      </Div>
    </Panel>
  );
}
