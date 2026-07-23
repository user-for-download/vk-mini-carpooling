import { Div, Title, Button, Card, Text } from '@vkontakte/vkui';
import type { RideDTO } from '@local-blablacar/contracts';
import { RIDE_STATUS } from '@local-blablacar/contracts';
import { TripListItem } from '../../../components/TripListItem';

interface Props {
  rides: RideDTO[];
  onCreateClick: () => void;
  onRideClick: (ride: RideDTO) => void;
  onRefresh: () => void;
}

export function ActiveTripsList({ rides, onCreateClick, onRideClick, onRefresh }: Props) {
  const activeRides = rides.filter((r) => r.status === RIDE_STATUS.ACTIVE);

  return (
    <Div style={{ paddingBottom: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level="3">Активные поездки</Title>
        <Button size="s" mode="primary" appearance="positive" onClick={onCreateClick}>
          Создать
        </Button>
      </div>

      {activeRides.length === 0 ? (
        <Card mode="shadow" style={{ textAlign: 'center', padding: 40 }}>
          <Title level="3" style={{ marginBottom: 8 }}>Нет активных поездок</Title>
          <Text style={{ color: 'var(--vkui-color-text-secondary)', marginBottom: 24 }}>
            Создайте поездку и найдите попутчиков
          </Text>
          <Button size="l" mode="primary" appearance="positive" onClick={onCreateClick}>
            Создать поездку
          </Button>
        </Card>
      ) : (
        activeRides.map((ride) => (
          <TripListItem key={ride.id} ride={ride} onClick={() => onRideClick(ride)} />
        ))
      )}

      {rides.length > 0 && (
        <Button size="l" stretched mode="secondary" onClick={onRefresh} style={{ marginTop: 12 }}>
          Обновить
        </Button>
      )}
    </Div>
  );
}
