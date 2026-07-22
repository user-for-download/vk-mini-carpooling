import { Text, Title } from '@vkontakte/vkui';

interface Seat {
  id: number;
  label: string;
  position: 'front' | 'back-left' | 'back-right';
}

interface Booking {
  id: number;
  passengerId: string;
  passenger?: {
    firstName: string;
    lastName: string;
  };
  seatsBooked: number;
  status: string;
}

interface CarSeatMapProps {
  seats: Seat[];
  selectedSeats: number[];
  occupiedSeats: { seatId: number; booking: Booking }[];
  maxSeats?: number;
  onSelectSeat?: (seatId: number) => void;
  mode?: 'select' | 'view';
}

export function CarSeatMap({
  seats,
  selectedSeats,
  occupiedSeats,
  maxSeats = 3,
  onSelectSeat,
  mode = 'select',
}: CarSeatMapProps) {
  const frontSeat = seats.find((s) => s.position === 'front');
  const backLeftSeat = seats.find((s) => s.position === 'back-left');
  const backRightSeat = seats.find((s) => s.position === 'back-right');

  function getSeatStatus(seatId: number) {
    const isSelected = selectedSeats.includes(seatId);
    const occupied = occupiedSeats.find((o) => o.seatId === seatId);
    if (occupied) return 'occupied';
    if (isSelected) return 'selected';
    return 'empty';
  }

  function getSeatColor(status: string) {
    switch (status) {
      case 'occupied':
        return '#E64646';
      case 'selected':
        return '#4BB34B';
      default:
        return '#D7D8DB';
    }
  }

  function getSeatTextColor(status: string) {
    return status === 'empty' ? '#818C99' : '#FFFFFF';
  }

  function handleSeatClick(seatId: number) {
    if (mode === 'select' && onSelectSeat) {
      onSelectSeat(seatId);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Car body */}
      <div style={{
        position: 'relative',
        width: 200,
        height: 280,
        background: '#F2F3F5',
        borderRadius: '40px 40px 20px 20px',
        border: '2px solid #D7D8DB',
        padding: 20,
      }}>
        {/* Front seat */}
        {frontSeat && (
          <div
            onClick={() => handleSeatClick(frontSeat.id)}
            style={{
              position: 'absolute',
              top: 30,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: getSeatColor(getSeatStatus(frontSeat.id)),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: mode === 'select' ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              boxShadow: getSeatStatus(frontSeat.id) !== 'empty' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            <Text style={{ color: getSeatTextColor(getSeatStatus(frontSeat.id)), fontWeight: 600 }}>
              {frontSeat.label}
            </Text>
          </div>
        )}

        {/* Back left seat */}
        {backLeftSeat && (
          <div
            onClick={() => handleSeatClick(backLeftSeat.id)}
            style={{
              position: 'absolute',
              bottom: 40,
              left: 30,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: getSeatColor(getSeatStatus(backLeftSeat.id)),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: mode === 'select' ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              boxShadow: getSeatStatus(backLeftSeat.id) !== 'empty' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            <Text style={{ color: getSeatTextColor(getSeatStatus(backLeftSeat.id)), fontWeight: 600 }}>
              {backLeftSeat.label}
            </Text>
          </div>
        )}

        {/* Back right seat */}
        {backRightSeat && (
          <div
            onClick={() => handleSeatClick(backRightSeat.id)}
            style={{
              position: 'absolute',
              bottom: 40,
              right: 30,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: getSeatColor(getSeatStatus(backRightSeat.id)),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: mode === 'select' ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              boxShadow: getSeatStatus(backRightSeat.id) !== 'empty' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            <Text style={{ color: getSeatTextColor(getSeatStatus(backRightSeat.id)), fontWeight: 600 }}>
              {backRightSeat.label}
            </Text>
          </div>
        )}

        {/* Steering wheel indicator */}
        <div style={{
          position: 'absolute',
          top: 10,
          left: 25,
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: '2px solid #818C99',
        }} />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#D7D8DB' }} />
          <Text style={{ fontSize: 12, color: '#818C99' }}>Свободно</Text>
        </div>
        {mode === 'select' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#4BB34B' }} />
            <Text style={{ fontSize: 12, color: '#818C99' }}>Выбрано</Text>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#E64646' }} />
          <Text style={{ fontSize: 12, color: '#818C99' }}>Занято</Text>
        </div>
      </div>

      {/* Selected seats count */}
      {mode === 'select' && (
        <Text style={{ marginTop: 8, color: '#818C99' }}>
          Выбрано мест: {selectedSeats.length} / {maxSeats}
        </Text>
      )}
    </div>
  );
}
