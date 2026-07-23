import { Text, Title, Div, Card, Button } from '@vkontakte/vkui';
import { CarSeatMap } from './CarSeatMap';
import { formatRideDateTime } from '../utils/format';

interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  seatId?: number;
}

interface TripCardProps {
  ride: {
    id: number;
    price: number;
    seatsAvailable: number;
    departureTime: string;
    from?: { name: string };
    to?: { name: string };
    driver?: {
      firstName: string;
      lastName: string;
    };
  };
  bookings?: Array<{
    id: number;
    passengerId: string;
    seatsBooked: number;
    status: string;
    passenger?: {
      firstName: string;
      lastName: string;
    };
  }>;
  selectedSeats?: number[];
  onSelectSeat?: (seatId: number) => void;
  onBook?: () => void;
  onCancel?: () => void;
  mode?: 'driver' | 'passenger';
  isBooked?: boolean;
}

const SEATS = [
  { id: 1, label: 'В', position: 'front' as const },
  { id: 2, label: 'Л', position: 'back-left' as const },
  { id: 3, label: 'П', position: 'back-right' as const },
];

export function TripCard({
  ride,
  bookings = [],
  selectedSeats = [],
  onSelectSeat,
  onBook,
  onCancel,
  mode = 'passenger',
  isBooked = false,
}: TripCardProps) {
  // Map bookings to occupied seats (first passenger gets front, others get back)
  const occupiedSeats = bookings
    .filter((b) => b.status === 'APPROVED' || b.status === 'PENDING')
    .flatMap((b, index) => {
      const seats = [];
      for (let i = 0; i < b.seatsBooked; i++) {
        const seatId = index === 0 && i === 0 ? 1 : i === 0 ? 2 : 3;
        seats.push({ seatId, booking: b });
      }
      return seats;
    });

  const passengers: Passenger[] = bookings
    .filter((b) => b.status === 'APPROVED' || b.status === 'PENDING')
    .map((b, index) => ({
      id: b.passengerId,
      firstName: b.passenger?.firstName ?? 'Пассажир',
      lastName: b.passenger?.lastName ?? '',
      seatId: index === 0 ? 1 : index === 1 ? 2 : 3,
    }));

  return (
    <Card mode="shadow">
      <Div>
        {/* Route header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <Title level="3" style={{ color: 'var(--vkui-color-text-accent)', marginBottom: 4 }}>
              {ride.price} ₽
            </Title>
            <Text style={{ marginBottom: 4 }}>
              {ride.from?.name} → {ride.to?.name}
            </Text>
            <Text style={{ color: 'var(--vkui-color-text-secondary)', fontSize: 13 }}>
              {formatRideDateTime(ride.departureTime)}
            </Text>
          </div>
          {mode === 'driver' && (
            <Text style={{ color: 'var(--vkui-color-text-secondary)', fontSize: 13 }}>
              {ride.seatsAvailable} мест
            </Text>
          )}
        </div>

        {/* Car seat map */}
        <div style={{ marginBottom: 16 }}>
          <CarSeatMap
            seats={SEATS}
            selectedSeats={selectedSeats}
            occupiedSeats={occupiedSeats}
            maxSeats={3}
            onSelectSeat={onSelectSeat}
            mode={mode === 'passenger' && !isBooked ? 'select' : 'view'}
          />
        </div>

        {/* Driver info (for passengers) */}
        {mode === 'passenger' && ride.driver && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 0',
            borderTop: '1px solid var(--vkui-color-separator)',
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--vkui-color-background-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 16,
              fontWeight: 700,
            }}>
              {ride.driver.firstName[0]}
            </div>
            <div>
              <Text style={{ fontWeight: 500 }}>
                {ride.driver.firstName} {ride.driver.lastName}
              </Text>
              <Text style={{ color: 'var(--vkui-color-text-secondary)', fontSize: 12 }}>
                Водитель
              </Text>
            </div>
          </div>
        )}

        {/* Passenger list */}
        {passengers.length > 0 && (
          <div style={{ borderTop: '1px solid var(--vkui-color-separator)', paddingTop: 12 }}>
            <Text style={{ fontWeight: 500, marginBottom: 8, color: 'var(--vkui-color-text-secondary)', fontSize: 12 }}>
              Пассажиры ({passengers.length})
            </Text>
            {passengers.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 0',
                }}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--vkui-color-background-positive)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  {p.firstName[0]}
                </div>
                <Text style={{ fontSize: 13 }}>
                  {p.firstName} {p.lastName}
                </Text>
                <Text style={{ fontSize: 11, color: 'var(--vkui-color-text-secondary)' }}>
                  {SEATS.find((s) => s.id === p.seatId)?.label}
                </Text>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {mode === 'passenger' && (
          <div style={{ marginTop: 16 }}>
            {isBooked ? (
              <Button
                size="l"
                stretched
                mode="secondary"
                onClick={onCancel}
              >
                Отменить бронь
              </Button>
            ) : (
              <Button
                size="l"
                stretched
                mode="primary"
                appearance="positive"
                onClick={onBook}
                disabled={selectedSeats.length === 0}
              >
                Забронировать ({selectedSeats.length} мест)
              </Button>
            )}
          </div>
        )}
      </Div>
    </Card>
  );
}
