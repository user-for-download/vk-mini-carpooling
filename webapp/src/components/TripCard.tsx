import { Text, Title, Div, Card, Button, FormItem, Textarea } from '@vkontakte/vkui';
import { CarSeatMap } from './CarSeatMap';
import { formatRideDateTime, formatPrice } from '../utils/format';
import { SEATS } from '../utils/constants';
import { BOOKING_STATUS } from '@local-blablacar/contracts';

interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  seatId?: number;
  note?: string | null;
  isFirstSeatOfBooking: boolean;
}

interface TripCardProps {
  ride: {
    id: number;
    price: number;
    seatsAvailable: number;
    offeredSeats: number[];
    departureTime: string;
    driverNote?: string | null;
    from?: { name: string };
    to?: { name: string };
    driver?: { firstName: string; lastName: string };
  };
  bookings?: Array<{
    id: number;
    passengerId: string;
    seatsBooked: number;
    seatIds: number[];
    status: string;
    passengerNote?: string | null;
    passenger?: { firstName: string; lastName: string };
  }>;
  selectedSeats?: number[];
  passengerNote?: string;
  onPassengerNoteChange?: (val: string) => void;
  onSelectSeat?: (seatId: number) => void;
  onBook?: () => void;
  onCancel?: () => void;
  mode?: 'driver' | 'passenger';
  isBooked?: boolean;
  bookingStatus?: string;
}

export function TripCard({
  ride,
  bookings = [],
  selectedSeats = [],
  passengerNote = '',
  onPassengerNoteChange,
  onSelectSeat,
  onBook,
  onCancel,
  mode = 'passenger',
  isBooked = false,
  bookingStatus,
}: TripCardProps) {
  const occupiedSeats = bookings
    .filter((b) => b.status === BOOKING_STATUS.APPROVED)
    .flatMap((b) => (b.seatIds || []).map((seatId) => ({ seatId, booking: b })));

  const passengers: Passenger[] = bookings
    .filter((b) => b.status === BOOKING_STATUS.APPROVED)
    .flatMap((b) =>
      (b.seatIds || []).map((seatId, idx) => ({
        id: `${b.passengerId}-${seatId}`,
        firstName: b.passenger?.firstName ?? 'Пассажир',
        lastName: b.passenger?.lastName ?? '',
        seatId,
        note: b.passengerNote,
        isFirstSeatOfBooking: idx === 0,
      })),
    );

  return (
    <Card mode="shadow">
      <Div>
        {/* Route header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <Title level="3" style={{ color: 'var(--vkui-color-text-accent)', marginBottom: 4 }}>
              {formatPrice(ride.price)}
            </Title>
            <Text style={{ marginBottom: 4 }}>{ride.from?.name} → {ride.to?.name}</Text>
            <Text style={{ color: 'var(--vkui-color-text-secondary)', fontSize: 13 }}>
              {formatRideDateTime(ride.departureTime)}
            </Text>
          </div>
          {mode === 'driver' && (
            <Text style={{ color: 'var(--vkui-color-text-secondary)', fontSize: 13 }}>{ride.seatsAvailable} мест</Text>
          )}
        </div>

        {/* Car seat map */}
        <div style={{ marginBottom: 16 }}>
          <CarSeatMap
            seats={SEATS}
            selectedSeats={selectedSeats}
            occupiedSeats={occupiedSeats}
            offeredSeats={ride.offeredSeats}
            onSelectSeat={onSelectSeat}
            mode={mode === 'passenger' && !isBooked ? 'select' : 'view'}
          />
        </div>

        {/* Driver info & note */}
        {ride.driver && (
          <div style={{ padding: '12px 0', borderTop: '1px solid var(--vkui-color-separator)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: 'var(--vkui-color-background-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 16, fontWeight: 700,
              }}>
                {ride.driver.firstName[0]}
              </div>
              <div>
                <Text style={{ fontWeight: 500 }}>{ride.driver.firstName} {ride.driver.lastName}</Text>
                <Text style={{ color: 'var(--vkui-color-text-secondary)', fontSize: 12 }}>Водитель</Text>
              </div>
            </div>
            {ride.driverNote && (
              <div style={{ padding: 12, background: 'var(--vkui--color_background_secondary)', borderRadius: 8, marginTop: 12 }}>
                <Text style={{ fontSize: 13, color: 'var(--vkui--color_text_secondary)', marginBottom: 4 }}>Условия поездки:</Text>
                <Text style={{ fontSize: 14 }}>{ride.driverNote}</Text>
              </div>
            )}
          </div>
        )}

        {/* Passenger list & notes */}
        {passengers.length > 0 && (
          <div style={{ borderTop: '1px solid var(--vkui-color-separator)', paddingTop: 12 }}>
            <Text style={{ fontWeight: 500, marginBottom: 8, color: 'var(--vkui-color-text-secondary)', fontSize: 12 }}>
              Пассажиры ({passengers.length})
            </Text>
            {passengers.map((p) => (
              <div key={p.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: 'var(--vkui-color-background-positive)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 600,
                  }}>
                    {p.firstName[0]}
                  </div>
                  <Text style={{ fontSize: 13 }}>{p.firstName} {p.lastName}</Text>
                  <Text style={{ fontSize: 11, color: 'var(--vkui-color-text-secondary)' }}>
                    {SEATS.find((s) => s.id === p.seatId)?.label}
                  </Text>
                </div>
                {p.note && p.isFirstSeatOfBooking && (
                  <div style={{ paddingLeft: 36, marginTop: -4, marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, color: 'var(--vkui--color_text_secondary)', fontStyle: 'italic' }}>
                      «{p.note}»
                    </Text>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions & passenger comment field */}
        {mode === 'passenger' && (
          <div style={{ marginTop: 16 }}>
            {isBooked ? (
              <>
                {bookingStatus === BOOKING_STATUS.PENDING && (
                  <div style={{
                    padding: 12,
                    background: 'var(--vkui--color_background_secondary)',
                    borderRadius: 8,
                    marginBottom: 12,
                    textAlign: 'center',
                  }}>
                    <Text style={{ color: 'var(--vkui--color_text_secondary)', fontSize: 13 }}>
                      Ваша заявка ожидает подтверждения водителя
                    </Text>
                  </div>
                )}
                <Button size="l" stretched mode="secondary" onClick={onCancel}>
                  Отменить бронь
                </Button>
              </>
            ) : (
              <>
                <FormItem top="Комментарий для водителя (необязательно)" style={{ padding: 0, marginBottom: 16 }}>
                  <Textarea
                    placeholder="Например: со мной будет большая сумка"
                    value={passengerNote}
                    onChange={(e) => onPassengerNoteChange?.(e.target.value)}
                  />
                </FormItem>
                <Button
                  size="l" stretched mode="primary" appearance="positive" onClick={onBook} disabled={selectedSeats.length === 0}
                >
                  Забронировать ({selectedSeats.length} мест)
                </Button>
              </>
            )}
          </div>
        )}
      </Div>
    </Card>
  );
}
