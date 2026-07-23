# Architecture

## Layout

```
vk-mini-app/
├── packages/contracts/      Zod schemas + constants — single source of truth
├── backend/
│   ├── prisma/              Schema, migrations, seed scripts
│   ├── prisma.config.ts     Prisma 7 CLI config (datasource URL)
│   ├── generated/           Prisma Client (auto-generated, do not edit)
│   ├── Dockerfile           Multi-stage Docker build
│   └── src/
│       ├── index.ts         Hono app entry, mounts routes, exports AppType
│       ├── runtime.ts       Env parsing, Prisma client, CORS config
│       ├── middleware/       vkAuth (HMAC), errorHandler (ZodError, P2034)
│       ├── routes/          Thin route handlers with @hono/zod-validator
│       └── services/        Business logic (rides, bookings, users, locations)
├── webapp/
│   ├── public/              Static assets (favicon.svg)
│   └── src/
│       ├── components/      Reusable UI (CarSeatMap, TripCard, TripListItem)
│       ├── panels/          Screen panels (PassengerPanel, DriverPanel, etc.)
│       ├── hooks/           Custom hooks (useLocations)
│       ├── api/             Axios API client functions
│       └── utils/           Shared utilities (formatRideDateTime, constants)
├── docker-compose.yml       Backend + PostgreSQL services
└── docs/
```

## Features

### Passenger Flow
1. **Role Selection** — choose between Passenger and Driver
2. **My Bookings** — collapsible list at top, active bookings always visible
3. **Search** — find rides by From/To locations with optional date filter
4. **Seat Selection** — visual car seat map (В/ПП/ЗЛ/ЗЦ/ЗП seats)
5. **Booking** — reserve seats with validation, edit pending bookings
6. **History** — expandable section for rejected/cancelled bookings

### Driver Flow
1. **Active Trips** — panel list of active rides, tap to view details
2. **Create Ride** — publish rides with location, time, price, offered seats
3. **Manage Bookings** — approve/reject passenger requests with names
4. **Trip Details** — full TripCard with seat map and passenger list
5. **Cancel Ride** — cancel active rides (cascades to bookings)

### Validation Rules
- **Max bookings per passenger** — only counts future/active rides
- **Time conflict prevention** — 4-hour window for both passengers and drivers
- **Seat validation** — cannot book taken/pending seats, driver seat excluded
- **Unique seats** — no duplicate seat IDs in arrays
- **Booking states** — PENDING → APPROVED/REJECTED, CANCELLED soft-delete

## Seat Management

### Seat IDs
- **1** (В) — Driver seat, never offered to passengers
- **2** (ПП) — Front passenger
- **3** (ЗЛ) — Rear left
- **4** (ЗЦ) — Rear center
- **5** (ЗП) — Rear right

### Data Flow
- `Ride.offeredSeats` — Array of passenger seat IDs (e.g., [2, 3, 4, 5])
- `Ride.seatsAvailable` — Counter, decremented on APPROVAL only
- `Booking.seatIds` — Specific seats requested by passenger
- `Booking.status` — PENDING → APPROVED/REJECTED/CANCELLED

### Invariants
- Driver seat (1) never in `offeredSeats` or `Booking.seatIds`
- `seatsAvailable` only decremented on APPROVAL, not PENDING
- Soft-delete for CANCELLED bookings (history preserved)

## Contracts Flow

`packages/contracts` holds:
- Zod schemas (`CreateRideSchema`, `RideDTOSchema`, `BookingDTOSchema`, etc.)
- Status constants (`RIDE_STATUS`, `BOOKING_STATUS`) — derived from Zod schemas
- Shared constants (`MAX_BOOKING_COUNT`)

Both `backend` and `webapp` import from `@local-blablacar/contracts` — one definition of truth.

DTO schemas include optional relation fields (`from`, `to`, `driver`, `bookings`, `ride`) so the frontend gets typed responses from the API.

## Backend Request Flow

```
route (thin, zValidator) -> vkAuthMiddleware -> service -> Prisma -> typed DTO
```

### Middleware
- `vkAuthMiddleware` — HMAC-SHA256 verification of VK launch params (or mock bypass)
- `errorHandler` — catches ZodError → 400, P2034 → 409, P2003/P2025 → 404, generic → 500

### Services
- `rides.service.ts` — CRUD for rides, search, cancel, driver conflict check
- `bookings.service.ts` — CRUD for bookings with seat management, re-booking support
- `users.service.ts` — user registration/init with profile updates
- `locations.service.ts` — list pickup points

### Auth Modes
1. **Production** — HMAC-SHA256 verification of VK launch params (raw string parsing)
2. **Development** — `VK_AUTH_MOCK_ENABLED=true` auto-authenticates all requests

## Frontend Components

### CarSeatMap
Top-down car schematic with 5 seats:
- **В** (Водитель) — driver seat (always locked)
- **ПП** (Передний пассажир) — front passenger
- **ЗЛ/ЗЦ/ЗП** — rear row (left/center/right)
- Modes: `select` (passenger booking), `view` (driver/readonly), `create` (driver offering)

### TripCard
Combined trip information card:
- Car seat map visualization
- Route, price, date
- Driver/passenger info with notes
- Action buttons (Book/Cancel/Approve/Reject/Edit)

### TripListItem
Unified list item for both passenger and driver views:
- Price, route, departure time
- Pending bookings badge
- Seats ratio (booked/available)
- Optional right element (buttons)
- Dimmed style for history items

## State Management

### Passenger Panel
- Search state persisted in `sessionStorage`
- Restored on navigation back from ride details
- Collapsible bookings section with history toggle

### Driver Panel
- Active trips as clickable panel list
- Detail view with full TripCard
- Decision loading states for approve/reject buttons

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `VK_APP_SECRET` | — | VK app secret for HMAC verification |
| `PORT` | `3000` | Backend server port |
| `MAX_BOOKING_COUNT` | `5` | Max active bookings per passenger (future rides only) |
| `VK_AUTH_MOCK_ENABLED` | `false` | Enable mock auth for development |
| `CORS_ORIGINS` | `vk.com,vk.ru` | Allowed CORS origins |
| `NODE_ENV` | `production` | Environment mode (set `development` for Docker testing) |
