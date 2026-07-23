import { Div, Button, Card, Text } from '@vkontakte/vkui';
import type { RideDTO } from '@local-blablacar/contracts';
import { BOOKING_STATUS } from '@local-blablacar/contracts';
import { TripCard } from '../../../components/TripCard';
import { SEATS } from '../../../utils/constants';

interface Props {
  ride: RideDTO;
  onCancelRide: (id: number) => void;
  onDecision: (bookingId: number, status: 'APPROVED' | 'REJECTED') => void;
  decisionLoading: number | null;
}

export function DriverRideDetail({ ride, onCancelRide, onDecision, decisionLoading }: Props) {
  const pendingBookings = ride.bookings?.filter((b) => b.status === BOOKING_STATUS.PENDING) || [];

  return (
    <Div style={{ paddingBottom: 100 }}>
      <TripCard ride={ride} bookings={ride.bookings} mode="driver" />
      
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Button size="l" stretched mode="secondary" onClick={() => onCancelRide(ride.id)}>
          Отменить поездку
        </Button>
      </div>

      {pendingBookings.map((booking) => (
        <Card key={booking.id} mode="shadow" style={{ marginTop: 12 }}>
          <Div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontWeight: 500 }}>
                  {booking.passenger?.firstName} {booking.passenger?.lastName}
                </Text>
                <Text style={{ color: 'var(--vkui-color-text-secondary)', fontSize: 13 }}>
                  {booking.seatsBooked} мест ({(booking.seatIds || []).map((id) => SEATS.find((s) => s.id === id)?.label).join(', ')})
                </Text>
                {booking.passengerNote && (
                  <Text style={{ fontSize: 13, color: 'var(--vkui--color_text_secondary)', fontStyle: 'italic', marginTop: 4 }}>
                    «{booking.passengerNote}»
                  </Text>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  size="s"
                  mode="primary"
                  appearance="positive"
                  onClick={() => onDecision(booking.id, 'APPROVED')}
                  disabled={decisionLoading === booking.id}
                >
                  {decisionLoading === booking.id ? '...' : 'Да'}
                </Button>
                <Button
                  size="s"
                  mode="secondary"
                  onClick={() => onDecision(booking.id, 'REJECTED')}
                  disabled={decisionLoading === booking.id}
                >
                  Отклонить
                </Button>
              </div>
            </div>
          </Div>
        </Card>
      ))}
    </Div>
  );
}
