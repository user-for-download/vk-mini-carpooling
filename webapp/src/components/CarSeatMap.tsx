import { useMemo } from 'react';

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
}

interface CarSeatMapProps {
  seats: Seat[];
  selectedSeats: number[];
  occupiedSeats: { seatId: number; booking: Booking }[];
  offeredSeats?: number[];
  maxSeats?: number;
  onSelectSeat?: (seatId: number) => void;
  mode?: 'select' | 'view' | 'create';
}

/* ── Design tokens (dark theme) ── */
const T = {
  asphalt: '#161C29',
  card: '#1E2636',
  panel: '#263149',
  lane: '#3A4560',
  paper: '#F2F5FA',
  muted: '#8A93A8',
  ion: '#4FD8C9',
  ionGlow: 'rgba(79,216,201,0.55)',
  ember: '#FFB454',
  danger: '#0E1420',
} as const;

type SeatStatus = 'available' | 'selected' | 'occupied' | 'unoffered' | 'driver';

/* ── Seat layout (percentages of car-wrap) ── */
const SEAT_POS: Record<string, { left: string; top: string; width: string }> = {
  driver:          { left: '39.3%', top: '41.3%', width: '18.7%' },
  'front-passenger': { left: '60.7%', top: '41.3%', width: '18.7%' },
  'rear-left':     { left: '34.7%', top: '60.9%', width: '15.3%' },
  'rear-center':   { left: '50%',   top: '60.9%', width: '13.3%' },
  'rear-right':    { left: '65.3%', top: '60.9%', width: '15.3%' },
};

function PersonSvg({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ width: '46%', height: '46%', position: 'relative', zIndex: 1 }}>
      <circle cx="12" cy="8" r="4" fill={color} />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" fill={color} />
    </svg>
  );
}

function SteeringWheelSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ width: '42%', height: '42%', opacity: 0.75 }}>
      <circle cx="12" cy="12" r="8" stroke="#55607A" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.2" fill="#55607A" />
      <path d="M12 4v4M6.2 15.5l3.4-2M17.8 15.5l-3.4-2" stroke="#55607A" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CarSeatMap({
  seats,
  selectedSeats,
  occupiedSeats,
  offeredSeats,
  maxSeats = 5,
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

  function seatBg(st: SeatStatus): string {
    switch (st) {
      case 'selected':
        return `radial-gradient(circle at 35% 30%, #7CEBDF, #34B8AA 75%)`;
      case 'occupied':
        return `radial-gradient(circle at 35% 30%, #4A5568, #2D3748 70%)`;
      case 'unoffered':
        return `radial-gradient(circle at 35% 30%, #313D5700, #1B2233 70%)`;
      default:
        return `radial-gradient(circle at 35% 30%, #313D57, #232B3E 70%)`;
    }
  }

  function seatShadow(st: SeatStatus): string {
    if (st === 'selected') {
      return `inset 0 0 0 1.5px #A6F1E7, 0 0 0 6px rgba(79,216,201,0.14), 0 0 22px 2px ${T.ionGlow}`;
    }
    if (st === 'driver') {
      return 'none';
    }
    return `inset 0 0 0 1.5px ${T.lane}, inset 0 2px 4px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.3)`;
  }

  function seatBorder(st: SeatStatus): string {
    if (st === 'driver') return `1.5px dashed ${T.lane}`;
    if (st === 'unoffered') return `1.5px dashed ${T.lane}`;
    return 'none';
  }

  function iconColor(st: SeatStatus): string {
    if (st === 'selected') return T.asphalt;
    if (st === 'driver' || st === 'unoffered') return '#55607A';
    return T.muted;
  }

  function tagColor(st: SeatStatus): string {
    if (st === 'selected') return T.asphalt;
    if (st === 'driver' || st === 'unoffered') return '#55607A';
    return '#6E7891';
  }

  function cursor(st: SeatStatus): string {
    if (mode === 'view' || st === 'driver' || st === 'unoffered' || st === 'occupied') return 'default';
    return 'pointer';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* ── Car wrapper ── */}
      <div style={{
        position: 'relative',
        width: '78%',
        maxWidth: 260,
        aspectRatio: '300 / 460',
      }}>
        {/* ── SVG car body ── */}
        <svg viewBox="0 0 300 460" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2E3A54" />
              <stop offset="100%" stopColor="#1E2738" />
            </linearGradient>
            <linearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0E1420" />
              <stop offset="100%" stopColor="#182238" />
            </linearGradient>
            <linearGradient id="roofGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#28334B" />
              <stop offset="100%" stopColor="#202A3E" />
            </linearGradient>
          </defs>

          {/* shadow */}
          <ellipse cx="150" cy="440" rx="95" ry="16" fill="#000" opacity="0.35" />

          {/* wheels */}
          <rect x="18" y="88" width="22" height="66" rx="9" fill="#0F1420" stroke="#333F5A" strokeWidth="2" />
          <rect x="260" y="88" width="22" height="66" rx="9" fill="#0F1420" stroke="#333F5A" strokeWidth="2" />
          <rect x="18" y="304" width="22" height="66" rx="9" fill="#0F1420" stroke="#333F5A" strokeWidth="2" />
          <rect x="260" y="304" width="22" height="66" rx="9" fill="#0F1420" stroke="#333F5A" strokeWidth="2" />

          {/* side mirrors */}
          <rect x="38" y="132" width="14" height="20" rx="5" fill="#28334B" stroke="#3A4560" strokeWidth="1.5" />
          <rect x="248" y="132" width="14" height="20" rx="5" fill="#28334B" stroke="#3A4560" strokeWidth="1.5" />

          {/* body */}
          <path d="M150,18 C194,18 224,34 235,68 L247,148 C251,170 251,290 247,312 L235,392 C224,426 194,442 150,442 C106,442 76,426 65,392 L53,312 C49,290 49,170 53,148 L65,68 C76,34 106,18 150,18Z"
            fill="url(#bodyGrad)" stroke="#333F5A" strokeWidth="2" />

          {/* windshield */}
          <path d="M104,52 L196,52 L222,148 L78,148Z" fill="url(#glassGrad)" opacity="0.9" />
          {/* rear window */}
          <path d="M78,312 L222,312 L198,404 L102,404Z" fill="url(#glassGrad)" opacity="0.9" />

          {/* roof / cabin panel */}
          <rect x="78" y="148" width="144" height="164" rx="18" fill="url(#roofGrad)" stroke="#333F5A" strokeWidth="1.5" />
          {/* front console divider */}
          <line x1="150" y1="165" x2="150" y2="215" stroke="#333F5A" strokeWidth="1.5" strokeDasharray="3 6" />
          {/* row divider */}
          <line x1="78" y1="235" x2="222" y2="235" stroke="#333F5A" strokeWidth="1.5" strokeDasharray="3 6" />

          {/* headlights */}
          <rect x="92" y="26" width="30" height="13" rx="6.5" fill="#FFC57A" />
          <rect x="178" y="26" width="30" height="13" rx="6.5" fill="#FFC57A" />
          {/* taillights */}
          <rect x="92" y="422" width="26" height="10" rx="5" fill="#E85C5C" />
          <rect x="182" y="422" width="26" height="10" rx="5" fill="#E85C5C" />
        </svg>

        {/* ── Seat buttons ── */}
        {seats.map((seat) => {
          const st = getSeatStatus(seat.id);
          const pos = SEAT_POS[seat.position];
          if (!pos) return null;
          const isDriver = st === 'driver';

          return (
            <div
              key={seat.id}
              onClick={() => handleClick(seat.id)}
              style={{
                position: 'absolute',
                left: pos.left,
                top: pos.top,
                width: pos.width,
                aspectRatio: '1',
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: seatBg(st),
                border: seatBorder(st),
                boxShadow: seatShadow(st),
                cursor: cursor(st),
                transition: 'box-shadow .25s ease, transform .15s ease, background .3s ease',
                opacity: st === 'unoffered' ? 0.4 : 1,
                padding: 0,
              }}
              onMouseEnter={(e) => {
                if (cursor(st) === 'pointer') {
                  (e.currentTarget as HTMLElement).style.transform = 'translate(-50%, -50%) scale(1.06)';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translate(-50%, -50%)';
              }}
            >
              {isDriver ? <SteeringWheelSvg /> : <PersonSvg color={iconColor(st)} />}
              <span style={{
                position: 'absolute',
                bottom: '-22%',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: '0.05em',
                color: tagColor(st),
                transition: 'color .3s ease',
              }}>
                {seat.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Legend ── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        rowGap: 6,
        columnGap: 14,
        marginTop: 16,
      }}>
        <LegendItem color={T.lane} label="В — водитель" />
        <LegendItem color={T.ion} label="ПП — переднее" />
        <LegendItem color={T.muted} label="ЗЛ — заднее слева" />
        <LegendItem color={T.muted} label="ЗЦ — заднее центр" />
        <LegendItem color={T.muted} label="ЗП — заднее справа" />
      </div>

      {/* ── Selection readout ── */}
      {mode !== 'view' && (
        <div style={{
          marginTop: 14,
          background: 'rgba(18,23,35,0.5)',
          border: `1px solid ${T.lane}`,
          borderRadius: 14,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          maxWidth: 260,
        }}>
          <div style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            flex: 'none',
            background: selectedSeats.length > 0 ? T.ion : T.lane,
            boxShadow: selectedSeats.length > 0 ? `0 0 10px 2px ${T.ionGlow}` : '0 0 0 3px rgba(255,255,255,0.03)',
            transition: 'all .3s ease',
          }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase' as const,
              color: '#5C6883',
            }}>
              Место
            </span>
            <span style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 14.5,
              fontWeight: 700,
              color: T.paper,
            }}>
              {selectedSeats.length > 0
                ? selectedSeats.map((id) => seats.find((s) => s.id === id)?.label).filter(Boolean).join(', ')
                : 'не выбрано'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span style={{
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: 11,
      fontWeight: 600,
      color: '#5C6883',
      letterSpacing: '0.03em',
    }}>
      <b style={{ color }}>{label.split(' — ')[0]}</b>
      {' — '}{label.split(' — ')[1]}
    </span>
  );
}
