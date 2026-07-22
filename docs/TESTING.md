# Testing

## Quick Test (No VK Required)

```bash
# Start dev servers
bun run dev:backend
bun run dev:webapp

# Open passenger view
open "http://localhost:5173/?mock_user=passenger#/passenger"

# Open driver view (separate browser/incognito)
open "http://localhost:5173/?mock_user=driver#/driver"
```

## Test User IDs

| User ID | Role | Name |
|---------|------|------|
| `111111111` | Driver | Alex Driver |
| `111111112` | Driver | Maria Petrova |
| `111111113` | Driver | Dmitry Sidorov |
| `111111114` | Driver | Elena Kozlova |
| `111111115` | Driver | Sergey Mikhailov |
| `222222221` | Passenger | Olga Passenger |
| `222222222` | Passenger | Ivan Smirnov |
| `222222223` | Passenger | Anna Volkova |
| ... | Passenger | ... |

## Seed Test Data

```bash
# Seed locations
bun run prisma:seed

# Seed test users, rides, and bookings
bun run --cwd backend prisma:seed:test
```

This creates:
- 13 users (5 drivers, 8 passengers)
- 40+ active rides
- 70+ bookings (mixed PENDING/APPROVED/REJECTED)

## Contracts Testing

```bash
bun test packages/contracts
```

Test Zod schemas: `CreateRideSchema`, `CreateBookingSchema`, etc.

## Backend Testing

```bash
docker compose up -d postgres
bun run prisma:migrate
bun test backend
```

Business logic in `src/services/*.service.ts` can be tested directly.

### Key Test Cases

1. **Booking creation** — check seat availability, max bookings, time conflicts
2. **Booking cancellation** — PENDING and APPROVED cancellations restore seats
3. **Ride cancellation** — only ACTIVE rides can be cancelled
4. **Concurrent approvals** — two APPROVED calls on same ride, second should fail

## Frontend Testing

### Manual Testing Flow

**Passenger:**
1. Open `?mock_user=passenger#/passenger`
2. Select From/To locations
3. Click seats on car diagram
4. Book ride
5. View in "Мои бронирования"
6. Cancel booking

**Driver:**
1. Open `?mock_user=driver#/driver`
2. Create new ride
3. View in "Все мои поездки"
4. Approve/reject bookings
5. Cancel ride

### Browser Testing

Use `agent-browser` for automated screenshots:

```bash
agent-browser open "http://localhost:5173/?mock_user=passenger#/passenger"
agent-browser screenshot passenger.png
```

## Validation Rules to Test

1. **Max bookings** — cannot exceed `MAX_BOOKING_COUNT` (default: 5)
2. **Time conflict** — cannot book overlapping rides
3. **Seat limits** — cannot book more seats than available
4. **Status transitions** — PENDING → APPROVED/REJECTED only
5. **Cancellation** — only booking owner can cancel
6. **Driver actions** — only ride owner can approve/reject

## API Endpoints

### Rides
- `GET /api/rides` — search rides
- `GET /api/rides/mine` — driver's rides
- `GET /api/rides/:id` — ride details
- `POST /api/rides` — create ride
- `DELETE /api/rides/:id` — cancel ride

### Bookings
- `GET /api/bookings/mine` — passenger's bookings
- `POST /api/bookings` — create booking
- `PATCH /api/bookings/:id/status` — approve/reject
- `DELETE /api/bookings/:id` — cancel booking

### Users
- `GET /api/users/me` — get current user
- `POST /api/users/init` — register/update user
