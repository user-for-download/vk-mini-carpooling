import { Text, Title, Div, Card } from '@vkontakte/vkui';
import { formatRideDateTime, formatPrice } from '../utils/format';
import { BOOKING_STATUS } from '@local-blablacar/contracts';

interface TripListItemProps {
  ride: {
    id: number;
    price: number;
    seatsAvailable: number;
    departureTime: string;
    from?: { name: string };
    to?: { name: string };
    bookings?: Array<{
      id: number;
      status: string;
      seatsBooked: number;
      seatIds?: number[];
    }>;
  };
  onClick?: () => void;
  rightElement?: React.ReactNode;
  dimmed?: boolean;
}

export function TripListItem({ ride, onClick, rightElement, dimmed = false }: TripListItemProps) {
  const pendingCount = ride.bookings?.filter((b) => b.status === BOOKING_STATUS.PENDING).length || 0;
  const approvedCount = ride.bookings?.filter((b) => b.status === BOOKING_STATUS.APPROVED).length || 0;
  const totalSeatsBooked = ride.bookings
    ?.filter((b) => b.status === BOOKING_STATUS.APPROVED)
    .reduce((sum, b) => sum + b.seatsBooked, 0) || 0;

  return (
    <Card
      mode="shadow"
      style={{ marginBottom: 12, cursor: onClick ? 'pointer' : 'default', opacity: dimmed ? 0.6 : 1 }}
      onClick={onClick}
    >
      <Div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Title level="3" style={{ color: 'var(--vkui-color-text-accent)' }}>
                {formatPrice(ride.price)}
              </Title>
            </div>
            <Text style={{ marginBottom: 4 }}>
              {ride.from?.name} → {ride.to?.name}
            </Text>
            <Text style={{ color: 'var(--vkui-color-text-secondary)', fontSize: 13 }}>
              {formatRideDateTime(ride.departureTime)}
            </Text>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {pendingCount > 0 && (
              <div style={{
                background: 'var(--vkui-color-background-warning, #ffb74d)',
                borderRadius: 12,
                padding: '4px 8px',
                marginBottom: 4,
              }}>
                <Text style={{ fontSize: 12, fontWeight: 600 }}>
                  {pendingCount} заяв.
                </Text>
              </div>
            )}
            <Text style={{ color: 'var(--vkui-color-text-secondary)', fontSize: 12 }}>
              {totalSeatsBooked}/{ride.seatsAvailable} мест
            </Text>
          </div>
        </div>
        {rightElement && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            {rightElement}
          </div>
        )}
      </Div>
    </Card>
  );
}
