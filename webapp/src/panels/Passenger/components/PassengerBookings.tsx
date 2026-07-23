import { useState } from 'react';
import { Div, Title, Button, Card, Text, Spinner } from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import type { BookingDTO } from '@local-blablacar/contracts';
import { BOOKING_STATUS, MAX_BOOKING_COUNT } from '@local-blablacar/contracts';
import { TripListItem } from '../../../components/TripListItem';

interface Props {
  bookings: BookingDTO[];
  isLoading: boolean;
  onRefresh: () => void;
  onCancelClick: (id: number) => void;
}

export function PassengerBookings({ bookings, isLoading, onRefresh, onCancelClick }: Props) {
  const routeNavigator = useRouteNavigator();
  const [showHistory, setShowHistory] = useState(false);

  const activeBookings = bookings.filter((b) => b.status === BOOKING_STATUS.PENDING || b.status === BOOKING_STATUS.APPROVED);
  const historyBookings = bookings.filter((b) => b.status === BOOKING_STATUS.REJECTED || b.status === BOOKING_STATUS.CANCELLED);

  return (
    <Div style={{ paddingBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Title level="3">Мои бронирования ({activeBookings.length}/{MAX_BOOKING_COUNT})</Title>
        <Button size="s" mode="secondary" onClick={onRefresh} disabled={isLoading}>
          Обновить
        </Button>
      </div>

      {isLoading && bookings.length === 0 ? (
        <Spinner size="medium" style={{ margin: '20px 0' }} />
      ) : !isLoading && bookings.length === 0 ? (
        <Card mode="shadow" style={{ textAlign: 'center', padding: 20 }}>
          <Text style={{ color: 'var(--vkui-color-text-secondary)' }}>
            У вас пока нет бронирований
          </Text>
        </Card>
      ) : (
        <>
          {activeBookings.length === 0 && !isLoading ? (
            <Card mode="shadow" style={{ textAlign: 'center', padding: 16 }}>
              <Text style={{ color: 'var(--vkui-color-text-secondary)', fontSize: 13 }}>
                Нет активных бронирований
              </Text>
            </Card>
          ) : (
            activeBookings.map((booking) => (
              <TripListItem
                key={booking.id}
                ride={{
                  id: booking.rideId,
                  price: booking.ride?.price || 0,
                  seatsAvailable: booking.ride?.seatsAvailable || 0,
                  departureTime: booking.ride?.departureTime || '',
                  from: booking.ride?.from,
                  to: booking.ride?.to,
                  bookings: [{ id: booking.id, status: booking.status, seatsBooked: booking.seatsBooked, seatIds: booking.seatIds }],
                }}
                onClick={() => routeNavigator.push(`/ride/${booking.rideId}`)}
                rightElement={
                  <Button
                    size="s"
                    mode="secondary"
                    onClick={(e) => { e.stopPropagation(); onCancelClick(booking.id); }}
                  >
                    Отменить
                  </Button>
                }
              />
            ))
          )}

          {historyBookings.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Button
                size="s"
                mode="tertiary"
                onClick={() => setShowHistory(!showHistory)}
                style={{ marginBottom: showHistory ? 8 : 0 }}
              >
                {showHistory ? '▲ Скрыть историю' : `▼ История (${historyBookings.length})`}
              </Button>
              {showHistory && historyBookings.map((b) => (
                <TripListItem
                  key={b.id}
                  ride={{
                    id: b.rideId,
                    price: b.ride?.price || 0,
                    seatsAvailable: b.ride?.seatsAvailable || 0,
                    departureTime: b.ride?.departureTime || '',
                    from: b.ride?.from,
                    to: b.ride?.to,
                  }}
                  dimmed
                />
              ))}
            </div>
          )}
        </>
      )}
    </Div>
  );
}
