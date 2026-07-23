import { Text } from '@vkontakte/vkui';

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

function PersonIcon({ color = '#FFFFFF', size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" fill={color} />
      <path
        d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill={color}
        opacity="0.8"
      />
    </svg>
  );
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
    return 'available';
  }

  function getSeatColors(status: string) {
    switch (status) {
      case 'occupied':
        return { bg: '#818C99', border: '#6B7280', text: '#FFFFFF' };
      case 'selected':
        return { bg: '#4BB34B', border: '#3D9B3D', text: '#FFFFFF' };
      case 'available':
        return { bg: '#D6E8FA', border: '#A8C8E8', text: '#3F7FBF' };
      default:
        return { bg: '#D6E8FA', border: '#A8C8E8', text: '#3F7FBF' };
    }
  }

  function handleSeatClick(seatId: number) {
    if (mode === 'select' && onSelectSeat) {
      onSelectSeat(seatId);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Car body - top-down view */}
      <div style={{
        position: 'relative',
        width: 220,
        height: 340,
        background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
        borderRadius: '60px 60px 30px 30px',
        border: '3px solid #CBD5E1',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}>
        {/* Windshield */}
        <div style={{
          position: 'absolute',
          top: 15,
          left: 30,
          right: 30,
          height: 40,
          background: 'linear-gradient(180deg, #E0F2FE 0%, #BAE6FD 100%)',
          borderRadius: '20px 20px 5px 5px',
          border: '2px solid #7DD3FC',
        }} />

        {/* Rear window */}
        <div style={{
          position: 'absolute',
          bottom: 15,
          left: 40,
          right: 40,
          height: 30,
          background: 'linear-gradient(180deg, #E0F2FE 0%, #BAE6FD 100%)',
          borderRadius: '5px 5px 15px 15px',
          border: '2px solid #7DD3FC',
        }} />

        {/* Side mirrors */}
        <div style={{
          position: 'absolute',
          top: 60,
          left: 8,
          width: 16,
          height: 24,
          background: '#94A3B8',
          borderRadius: '4px',
        }} />
        <div style={{
          position: 'absolute',
          top: 60,
          right: 8,
          width: 16,
          height: 24,
          background: '#94A3B8',
          borderRadius: '4px',
        }} />

        {/* Front seat - Driver (В) */}
        {frontSeat && (
          <div
            onClick={() => handleSeatClick(frontSeat.id)}
            style={{
              position: 'absolute',
              top: 70,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 70,
              height: 70,
              borderRadius: '50%',
              background: getSeatColors(getSeatStatus(frontSeat.id)).bg,
              border: `3px solid ${getSeatColors(getSeatStatus(frontSeat.id)).border}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: mode === 'select' ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              boxShadow: getSeatStatus(frontSeat.id) === 'selected'
                ? '0 0 0 4px rgba(75, 179, 75, 0.3)'
                : '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <PersonIcon
              color={getSeatColors(getSeatStatus(frontSeat.id)).text}
              size={28}
            />
            <Text style={{
              color: getSeatColors(getSeatStatus(frontSeat.id)).text,
              fontSize: 10,
              fontWeight: 600,
              marginTop: 2,
            }}>
              {frontSeat.label}
            </Text>
          </div>
        )}

        {/* Back left seat (Л) */}
        {backLeftSeat && (
          <div
            onClick={() => handleSeatClick(backLeftSeat.id)}
            style={{
              position: 'absolute',
              bottom: 60,
              left: 35,
              width: 65,
              height: 65,
              borderRadius: '50%',
              background: getSeatColors(getSeatStatus(backLeftSeat.id)).bg,
              border: `3px solid ${getSeatColors(getSeatStatus(backLeftSeat.id)).border}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: mode === 'select' ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              boxShadow: getSeatStatus(backLeftSeat.id) === 'selected'
                ? '0 0 0 4px rgba(75, 179, 75, 0.3)'
                : '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <PersonIcon
              color={getSeatColors(getSeatStatus(backLeftSeat.id)).text}
              size={26}
            />
            <Text style={{
              color: getSeatColors(getSeatStatus(backLeftSeat.id)).text,
              fontSize: 10,
              fontWeight: 600,
              marginTop: 2,
            }}>
              {backLeftSeat.label}
            </Text>
          </div>
        )}

        {/* Back right seat (П) */}
        {backRightSeat && (
          <div
            onClick={() => handleSeatClick(backRightSeat.id)}
            style={{
              position: 'absolute',
              bottom: 60,
              right: 35,
              width: 65,
              height: 65,
              borderRadius: '50%',
              background: getSeatColors(getSeatStatus(backRightSeat.id)).bg,
              border: `3px solid ${getSeatColors(getSeatStatus(backRightSeat.id)).border}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: mode === 'select' ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              boxShadow: getSeatStatus(backRightSeat.id) === 'selected'
                ? '0 0 0 4px rgba(75, 179, 75, 0.3)'
                : '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <PersonIcon
              color={getSeatColors(getSeatStatus(backRightSeat.id)).text}
              size={26}
            />
            <Text style={{
              color: getSeatColors(getSeatStatus(backRightSeat.id)).text,
              fontSize: 10,
              fontWeight: 600,
              marginTop: 2,
            }}>
              {backRightSeat.label}
            </Text>
          </div>
        )}

        {/* Steering wheel */}
        <div style={{
          position: 'absolute',
          top: 55,
          left: 50,
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: '3px solid #64748B',
          background: 'transparent',
        }} />

        {/* Headlights */}
        <div style={{
          position: 'absolute',
          top: 5,
          left: 25,
          width: 20,
          height: 12,
          background: '#FCD34D',
          borderRadius: '6px 6px 2px 2px',
          boxShadow: '0 0 8px rgba(252, 211, 77, 0.5)',
        }} />
        <div style={{
          position: 'absolute',
          top: 5,
          right: 25,
          width: 20,
          height: 12,
          background: '#FCD34D',
          borderRadius: '6px 6px 2px 2px',
          boxShadow: '0 0 8px rgba(252, 211, 77, 0.5)',
        }} />

        {/* Taillights */}
        <div style={{
          position: 'absolute',
          bottom: 5,
          left: 25,
          width: 18,
          height: 10,
          background: '#EF4444',
          borderRadius: '2px 2px 4px 4px',
        }} />
        <div style={{
          position: 'absolute',
          bottom: 5,
          right: 25,
          width: 18,
          height: 10,
          background: '#EF4444',
          borderRadius: '2px 2px 4px 4px',
        }} />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#D6E8FA', border: '2px solid #A8C8E8' }} />
          <Text style={{ fontSize: 12, color: '#64748B' }}>Свободно</Text>
        </div>
        {mode === 'select' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#4BB34B', border: '2px solid #3D9B3D' }} />
            <Text style={{ fontSize: 12, color: '#64748B' }}>Выбрано</Text>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#818C99', border: '2px solid #6B7280' }} />
          <Text style={{ fontSize: 12, color: '#64748B' }}>Занято</Text>
        </div>
      </div>

      {/* Selected seats count */}
      {mode === 'select' && (
        <Text style={{ marginTop: 8, color: '#64748B', fontSize: 13 }}>
          Выбрано мест: {selectedSeats.length} / {maxSeats}
        </Text>
      )}
    </div>
  );
}
