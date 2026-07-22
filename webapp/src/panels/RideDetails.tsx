import { useEffect, useState } from 'react';
import {
  Panel as PanelType,
  PanelHeader,
  PanelHeaderBack,
  Button,
  Text,
  Title,
  Div,
  Card,
  Spinner,
} from '@vkontakte/vkui';
import { useParams, useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import type { RideDTO, BookingDTO } from '@local-blablacar/contracts';
import { RIDE_STATUS } from '@local-blablacar/contracts';
import { getRide } from '../api/rides';
import { createBooking, listMyBookings } from '../api/bookings';
import '../styles.css';

export function RideDetails(props: React.ComponentProps<typeof PanelType>) {
  const routeNavigator = useRouteNavigator();
  const params = useParams<'id'>();
  const [ride, setRide] = useState<RideDTO | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [myBookings, setMyBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    getRide(Number(params.id))
      .then(setRide)
      .catch(() => setNotFound(true));
    listMyBookings().then(setMyBookings).catch(console.error);
  }, [params?.id]);

  function isBooked(rideId: number): boolean {
    return myBookings.some((b) => b.rideId === rideId);
  }

  async function handleBook() {
    if (!ride) return;
    setLoading(true);
    try {
      await createBooking({ rideId: ride.id, seatsBooked: 1 });
      const updatedBookings = await listMyBookings();
      setMyBookings(updatedBookings);
    } finally {
      setLoading(false);
    }
  }

  const booked = ride ? isBooked(ride.id) : false;

  return (
    <PanelType {...props}>
      <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.back()} />}>
        Детали поездки
      </PanelHeader>

      {!ride && !notFound && (
        <Div style={{ textAlign: 'center', padding: 40 }}>
          <Spinner />
        </Div>
      )}

      {notFound && (
        <Div style={{ textAlign: 'center', padding: 40 }}>
          <Title level="3" style={{ marginBottom: 8 }}>
            Поездка не найдена
          </Title>
          <Text style={{ color: 'var(--vkui-color-text-secondary)' }}>
            Возможно, она уже завершена
          </Text>
        </Div>
      )}

      {ride && (
        <Div>
          <Card mode="shadow">
            <Div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Text style={{ color: 'var(--vkui-color-text-secondary)', marginBottom: 8 }}>
                  Маршрут
                </Text>
                <Title level="2" style={{ marginBottom: 8 }}>
                  {ride.from?.name}
                </Title>
                <Text style={{ color: 'var(--vkui-color-text-accent)', fontSize: 24, marginBottom: 8 }}>
                  →
                </Text>
                <Title level="2">
                  {ride.to?.name}
                </Title>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderTop: '1px solid var(--vkui-color-separator)',
              }}>
                <Text style={{ color: 'var(--vkui-color-text-secondary)' }}>
                  Дата и время
                </Text>
                <Text style={{ fontWeight: 500 }}>
                  {new Date(ride.departureTime).toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderTop: '1px solid var(--vkui-color-separator)',
              }}>
                <Text style={{ color: 'var(--vkui-color-text-secondary)' }}>
                  Свободных мест
                </Text>
                <Text style={{ fontWeight: 500 }}>{ride.seatsAvailable}</Text>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderTop: '1px solid var(--vkui-color-separator)',
              }}>
                <Text style={{ color: 'var(--vkui-color-text-secondary)' }}>
                  Цена за место
                </Text>
                <Title level="3" style={{ color: 'var(--vkui-color-text-accent)' }}>
                  {ride.price} ₽
                </Title>
              </div>

              {ride.driver && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '16px 0',
                  borderTop: '1px solid var(--vkui-color-separator)',
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'var(--vkui-color-background-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 20,
                    fontWeight: 700,
                  }}>
                    {ride.driver.firstName[0]}
                  </div>
                  <div>
                    <Text style={{ fontWeight: 500 }}>
                      {ride.driver.firstName} {ride.driver.lastName}
                    </Text>
                    <Text style={{ color: 'var(--vkui-color-text-secondary)', fontSize: 13 }}>
                      Водитель
                    </Text>
                  </div>
                </div>
              )}

              <Button
                size="l"
                stretched
                mode={booked ? 'secondary' : 'primary'}
                appearance={booked ? 'neutral' : 'positive'}
                disabled={booked || loading}
                onClick={handleBook}
                style={{ marginTop: 16 }}
              >
                {loading ? 'Отправка...' : booked ? 'Заявка отправлена' : 'Забронировать место'}
              </Button>
            </Div>
          </Card>
        </Div>
      )}
    </PanelType>
  );
}
