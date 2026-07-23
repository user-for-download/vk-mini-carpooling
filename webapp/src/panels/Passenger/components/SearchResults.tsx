import { useContext } from 'react';
import { Div, Title, Text, Button } from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import type { RideDTO } from '@local-blablacar/contracts';
import { TripListItem } from '../../../components/TripListItem';
import { DataContext } from '../../../context/dataContext';

interface Props {
  rides: RideDTO[];
  fromId: string;
  toId: string;
  date: string;
  isBooked: (rideId: number) => boolean;
  onNewSearch: () => void;
}

export function SearchResults({ rides, fromId, toId, date, isBooked, onNewSearch }: Props) {
  const routeNavigator = useRouteNavigator();
  const ctx = useContext(DataContext);
  const locations = ctx?.locations ?? [];

  const fromName = locations.find((l) => l.id === Number(fromId))?.name || '';
  const toName = locations.find((l) => l.id === Number(toId))?.name || '';
  const dateLabel = date ? new Date(date + 'T00:00:00').toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Любая дата';

  if (rides.length === 0) {
    return (
      <Div style={{ paddingBottom: 100 }}>
        <Title level="3" style={{ marginBottom: 8 }}>Ничего не найдено</Title>
        <Text style={{ color: 'var(--vkui-color-text-secondary)', marginBottom: 24 }}>
          Попробуйте выбрать другие точки
        </Text>
        <Button size="l" mode="primary" appearance="positive" onClick={onNewSearch}>
          Новый поиск
        </Button>
      </Div>
    );
  }

  return (
    <Div style={{ paddingBottom: 100 }}>
      {/* Search summary - plain text */}
      <Text style={{ color: 'var(--vkui-color-text-secondary)', marginBottom: 4 }}>
        {fromName} → {toName} · {dateLabel}
      </Text>
      <Text style={{ color: 'var(--vkui-color-text-secondary)', marginBottom: 12 }}>
        Найдено: {rides.length} {rides.length === 1 ? 'поездка' : rides.length < 5 ? 'поездки' : 'поездок'}
      </Text>

      {rides.map((ride) => (
        <TripListItem
          key={ride.id}
          ride={ride}
          onClick={() => routeNavigator.push(`/ride/${ride.id}`)}
        />
      ))}

      <Button size="l" stretched mode="secondary" onClick={onNewSearch} style={{ marginTop: 12 }}>
        Новый поиск
      </Button>
    </Div>
  );
}
