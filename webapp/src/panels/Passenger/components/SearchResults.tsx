import { Div, Card, Title, Text, Button } from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import type { RideDTO } from '@local-blablacar/contracts';
import { TripListItem } from '../../../components/TripListItem';

interface Props {
  rides: RideDTO[];
  isBooked: (rideId: number) => boolean;
  onNewSearch: () => void;
}

export function SearchResults({ rides, isBooked, onNewSearch }: Props) {
  const routeNavigator = useRouteNavigator();

  if (rides.length === 0) {
    return (
      <Div style={{ paddingBottom: 100 }}>
        <Card mode="shadow" style={{ textAlign: 'center', padding: 40 }}>
          <Title level="3" style={{ marginBottom: 8 }}>Ничего не найдено</Title>
          <Text style={{ color: 'var(--vkui-color-text-secondary)', marginBottom: 24 }}>
            Попробуйте выбрать другие точки
          </Text>
          <Button size="l" mode="primary" appearance="positive" onClick={onNewSearch}>
            Новый поиск
          </Button>
        </Card>
      </Div>
    );
  }

  return (
    <Div style={{ paddingBottom: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: 'var(--vkui-color-text-secondary)' }}>Найдено поездок: {rides.length}</Text>
        <Button size="s" mode="secondary" onClick={onNewSearch}>Изменить поиск</Button>
      </div>

      {rides.map((ride) => {
        const booked = isBooked(ride.id);
        return (
          <TripListItem
            key={ride.id}
            ride={ride}
            onClick={() => routeNavigator.push(`/ride/${ride.id}`)}
            rightElement={
              <Button
                size="s"
                mode={booked ? 'secondary' : 'primary'}
                appearance={booked ? 'neutral' : 'positive'}
                onClick={(e) => { e.stopPropagation(); routeNavigator.push(`/ride/${ride.id}`); }}
              >
                {booked ? 'Забронировано' : 'Подробнее'}
              </Button>
            }
          />
        );
      })}

      <Button size="l" stretched mode="secondary" onClick={onNewSearch} style={{ marginTop: 12 }}>
        Новый поиск
      </Button>
    </Div>
  );
}
