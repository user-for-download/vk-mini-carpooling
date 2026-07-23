import { useMemo } from 'react';
import { Tappable, Text } from '@vkontakte/vkui';

interface Seat {
  id: number;
  label: string;
  position: 'driver' | 'front-passenger' | 'rear-left' | 'rear-center' | 'rear-right';
}

interface Booking {
  id: number;
  passengerId: string;
  passenger?: { firstName: string; lastName: string };
  seatsBooked: number;
  seatIds: number[];
  status: string;
  passengerNote?: string | null;
}

interface CarSeatMapProps {
  seats: Seat[];
  selectedSeats: number[];
  occupiedSeats: { seatId: number; booking: Booking }[];
  offeredSeats?: number[];
  onSelectSeat?: (seatId: number) => void;
  mode?: 'select' | 'view' | 'create';
}

type SeatStatus = 'available' | 'selected' | 'occupied' | 'unoffered' | 'driver';

// --- Mapping statuses to VKUI design tokens ---
function getSeatStyles(st: SeatStatus) {
  switch (st) {
    case 'selected':
      return {
        bg: 'var(--vkui--color_background_accent)',
        border: '2px solid var(--vkui--color_background_accent)',
        text: 'var(--vkui--color_text_contrast_themed, #fff)',
        opacity: 1,
      };
    case 'occupied':
      return {
        bg: 'var(--vkui--color_background_tertiary)',
        border: '2px solid transparent',
        text: 'var(--vkui--color_text_tertiary)',
        opacity: 1,
      };
    case 'available':
      return {
        bg: 'var(--vkui--color_background_secondary)',
        border: '2px solid transparent',
        text: 'var(--vkui--color_text_primary)',
        opacity: 1,
      };
    case 'unoffered':
      return {
        bg: 'transparent',
        border: '2px dashed var(--vkui--color_separator_primary)',
        text: 'var(--vkui--color_text_tertiary)',
        opacity: 0.4,
      };
    case 'driver':
      return {
        bg: 'transparent',
        border: '2px dashed var(--vkui--color_icon_tertiary)',
        text: 'var(--vkui--color_text_tertiary)',
        opacity: 1,
      };
    default:
      return { bg: 'transparent', border: 'none', text: 'inherit', opacity: 1 };
  }
}

export function CarSeatMap({
  seats,
  selectedSeats,
  occupiedSeats,
  offeredSeats,
  onSelectSeat,
  mode = 'select',
}: CarSeatMapProps) {
  const occupiedSet = useMemo(() => {
    const s = new Set<number>();
    occupiedSeats.forEach((o) => s.add(o.seatId));
    return s;
  }, [occupiedSeats]);

  function getSeatStatus(seatId: number): SeatStatus {
    const seat = seats.find((s) => s.id === seatId);
    if (seat?.position === 'driver') return 'driver';
    if (mode !== 'create' && offeredSeats && !offeredSeats.includes(seatId)) return 'unoffered';
    if (occupiedSet.has(seatId)) return 'occupied';
    if (selectedSeats.includes(seatId)) return 'selected';
    return 'available';
  }

  function handleClick(seatId: number) {
    const st = getSeatStatus(seatId);
    if (mode === 'view' || st === 'driver' || st === 'unoffered' || st === 'occupied') return;
    onSelectSeat?.(seatId);
  }

  function renderSeat(position: Seat['position']) {
    const seat = seats.find((s) => s.position === position);
    if (!seat) return <div style={{ width: 48, height: 48 }} />; // Placeholder if seat doesn't exist

    const st = getSeatStatus(seat.id);
    const styles = getSeatStyles(st);
    const isInteractive = mode !== 'view' && st !== 'driver' && st !== 'unoffered' && st !== 'occupied';

    return (
      <Tappable
        key={seat.id}
        onClick={() => handleClick(seat.id)}
        hoverMode={isInteractive ? 'opacity' : 'none'}
        activeMode={isInteractive ? 'opacity' : 'none'}
        aria-label={`Место ${seat.label} — ${getAriaStatus(st)}`}
        role={mode === 'select' ? 'checkbox' : undefined}
        aria-checked={mode === 'select' ? st === 'selected' : undefined}
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: styles.bg,
          border: styles.border,
          opacity: styles.opacity,
          cursor: isInteractive ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          boxSizing: 'border-box',
        }}
      >
        <Text weight="2" style={{ color: styles.text }}>
          {seat.label}
        </Text>
      </Tappable>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0' }}>

      {/* --- Car Body (Styled for VKUI) --- */}
      <div
        style={{
          width: 220,
          background: 'var(--vkui--color_background_content)',
          border: '2px solid var(--vkui--color_separator_primary)',
          borderRadius: '40px 40px 24px 24px',
          padding: '28px 20px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Mock Windshield (Minimalist) */}
        <div style={{
          position: 'absolute',
          top: 10,
          left: 40,
          right: 40,
          height: 8,
          background: 'var(--vkui--color_background_secondary)',
          borderRadius: '4px 4px 2px 2px',
        }} />

        {/* First Row (Driver and Front Passenger) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          {renderSeat('driver')}
          {renderSeat('front-passenger')}
        </div>

        {/* Second Row (Rear Seats) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          {renderSeat('rear-left')}
          {renderSeat('rear-center')}
          {renderSeat('rear-right')}
        </div>

        {/* Mock Rear Window */}
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: 50,
          right: 50,
          height: 6,
          background: 'var(--vkui--color_background_secondary)',
          borderRadius: '2px 2px 4px 4px',
        }} />
      </div>

      {/* --- Legend --- */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px 20px',
        justifyContent: 'center',
        marginTop: 24,
        maxWidth: 280,
      }}>
        <LegendItem status="available" text="Доступно" />
        {mode === 'select' && <LegendItem status="selected" text="Выбрано" />}
        <LegendItem status="driver" text="Водитель" />
      </div>

      {/* --- Selection Status (Only for Select/Create modes) --- */}
      {mode !== 'view' && (
        <div style={{
          marginTop: 24,
          padding: '12px 20px',
          background: 'var(--vkui--color_background_secondary)',
          borderRadius: 12,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: selectedSeats.length > 0
              ? 'var(--vkui--color_background_accent)'
              : 'var(--vkui--color_icon_tertiary)'
          }} />
          <Text weight="2" style={{ color: 'var(--vkui--color_text_primary)' }}>
            Места: {selectedSeats.length > 0
              ? selectedSeats.map((id) => seats.find(s => s.id === id)?.label).join(', ')
              : 'не выбраны'}
          </Text>
        </div>
      )}
    </div>
  );
}

function getAriaStatus(st: SeatStatus): string {
  switch (st) {
    case 'available': return 'свободно';
    case 'selected': return 'выбрано';
    case 'occupied': return 'занято';
    case 'unoffered': return 'недоступно';
    case 'driver': return 'водитель';
  }
}

// Hoisted helper component for legend items (H13 — prevents remount on every render)
function LegendItem({ status, text }: { status: SeatStatus; text: string }) {
  const styles = getSeatStyles(status);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: styles.bg,
        border: styles.border !== 'none' ? styles.border : '1px solid var(--vkui--color_separator_primary)',
        opacity: styles.opacity,
        boxSizing: 'border-box'
      }} />
      <Text style={{ fontSize: 13, color: 'var(--vkui--color_text_secondary)' }}>
        {text}
      </Text>
    </div>
  );
}
