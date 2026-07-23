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
- 40+ active rides with proper seat mapping
- 70+ bookings (mixed PENDING/APPROVED/REJECTED/CANCELLED)

## Type Checking

```bash
# Check all workspaces
bun run typecheck

# Check individual packages
cd packages/contracts && bunx tsc --noEmit
cd backend && bunx tsc --noEmit
cd webapp && bunx tsc --noEmit
```

All three packages should compile with 0 errors.

## Backend Testing

```bash
docker compose up -d postgres
cd backend && bunx prisma migrate dev
bun test backend
```

Business logic in `src/services/*.service.ts` can be tested directly.

### Key Test Cases

1. **Booking creation** — check seat availability, max bookings, time conflicts
2. **Booking update** — modify pending bookings (change seats/note)
3. **Booking cancellation** — PENDING and APPROVED cancellations restore seats
4. **Ride cancellation** — cascades to bookings, only ACTIVE rides can be cancelled
5. **Concurrent approvals** — two APPROVED calls on same ride, second should fail
6. **Re-booking** — can re-book after cancellation (refreshes createdAt)

## Frontend Testing

### Manual Testing Flow

**Passenger:**
1. Open `?mock_user=passenger#/passenger`
2. View "Мои бронирования" section (collapsible)
3. Select From/To locations (required)
4. Optional: select date filter
5. Click "Найти поездки"
6. Tap ride to view details
7. Select seats on car diagram
8. Book ride with optional comment (VKUI Alert confirmation)
9. View in "Мои бронирования"
10. Edit pending booking (change seats/note)
11. Cancel booking (VKUI Alert confirmation)
12. View history (collapsed section)

**Driver:**
1. Open `?mock_user=driver#/driver`
2. View active trips as panel list
3. Tap trip to see details with bookings
4. Create new ride (From, To, Date, Seats, Price)
5. Approve/reject bookings with passenger names
6. Cancel ride (VKUI Alert confirmation, cascades to bookings)

### Browser Testing

Use `agent-browser` for automated screenshots:

```bash
agent-browser open "http://localhost:5173/?mock_user=passenger#/passenger"
agent-browser screenshot passenger.png
```

## Validation Rules to Test

1. **Max bookings** — only counts future/active rides
2. **Time conflict** — 4-hour window for passengers and drivers
3. **Seat limits** — cannot book taken/pending seats
4. **Driver seat** — seat 1 never offered to passengers
5. **Unique seats** — no duplicate seat IDs in arrays
6. **Status transitions** — PENDING → APPROVED/REJECTED/CANCELLED
7. **Cancellation** — only booking owner can cancel
8. **Driver actions** — only ride owner can approve/reject
9. **Both locations required** — From and To must be selected

## API Endpoints

### Rides
- `GET /api/rides` — search rides (validated with `SearchRidesSchema`)
- `GET /api/rides/mine` — driver's rides (includes pending/approved bookings)
- `GET /api/rides/:id` — ride details (includes approved bookings with passengers)
- `POST /api/rides` — create ride (validated with `CreateRideSchema`)
- `DELETE /api/rides/:id` — cancel ride (cascades to bookings)

### Bookings
- `GET /api/bookings/mine` — passenger's bookings (sorted by status, then date)
- `POST /api/bookings` — create booking (validated with `CreateBookingSchema`)
- `PATCH /api/bookings/:id` — update pending booking (validated with `UpdateBookingSchema`)
- `PATCH /api/bookings/:id/status` — approve/reject (validated with `UpdateBookingStatusSchema`)
- `DELETE /api/bookings/:id` — cancel booking (soft-delete to CANCELLED)

### Users
- `GET /api/users/me` — get current user
- `POST /api/users/init` — register/update user (validated with `InitUserSchema`)

## Error Handling

All routes return typed JSON errors:

```json
{ "error": "ERROR_CODE", "message": "Human-readable message" }
```

| Code | HTTP Status | Source |
|------|-------------|--------|
| `NOT_FOUND` | 404 | Ride/booking not found |
| `FORBIDDEN` | 403 | Not the owner / driver seat conflict |
| `NO_SEATS` | 409 | Not enough seats / seat taken |
| `MAX_BOOKINGS` | 409 | Exceeded booking limit |
| `TIME_CONFLICT` | 409 | Overlapping ride (4h window) |
| `ALREADY_PROCESSED` | 409 | Booking already approved/rejected/cancelled |
| `NOT_ACTIVE` | 409 | Ride is not active |
| `VALIDATION_ERROR` | 400 | Zod validation failed |
| `CONFLICT` | 409 | Prisma serialization anomaly (P2034) |

## Data Integrity

### Seat Management
- `Ride.offeredSeats` — passenger seat IDs only (driver seat excluded)
- `Ride.seatsAvailable` — decremented on APPROVAL, not PENDING
- `Booking.seatIds` — specific seats requested by passenger
- Soft-delete for CANCELLED bookings (history preserved)

### Sorting
- Active rides/bookings shown first (status ASC)
- Then by date (departureTime/createdAt DESC)

### State Persistence
- Passenger search state saved in `sessionStorage`
- Restored when navigating back from ride details

### Frontend Components
- `ConfirmPopout` — VKUI Alert dialog (replaces window.confirm)
- `ErrorSnackbar` — transient error notification with optional retry
- `NetworkError` — full-page error placeholder with retry button
- `DataContext` — global state (user, locations) via React Context
- Custom hooks: `useMyRides`, `useMyBookings`, `useRideDetails`
