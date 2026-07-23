# Architecture

## Layout

```
vk-mini-app/
├── packages/contracts/      Zod schemas + constants — single source of truth
├── backend/
│   ├── prisma/              Schema, migrations, seed scripts
│   ├── prisma.config.ts     Prisma 7 CLI config (datasource URL)
│   ├── generated/           Prisma Client (auto-generated, do not edit)
│   └── src/
│       ├── index.ts         Hono app entry, mounts routes, exports AppType
│       ├── runtime.ts       Env parsing, Prisma client, CORS config
│       ├── middleware/       vkAuth (HMAC), errorHandler (ZodError)
│       ├── routes/          Thin route handlers with @hono/zod-validator
│       └── services/        Business logic (rides, bookings, users, locations)
├── webapp/
│   └── src/
│       ├── components/      Reusable UI (CarSeatMap, TripCard)
│       ├── panels/          Screen panels (PassengerPanel, DriverPanel, etc.)
│       ├── hooks/           Custom hooks (useLocations)
│       ├── api/             Axios API client functions
│       └── utils/           Shared utilities (formatRideDateTime, extractErrorMessage)
├── docker-compose.yml       local Postgres only
└── docs/
```

## Features

### Passenger Flow
1. **Role Selection** — choose between Passenger and Driver
2. **Search** — find rides by From/To locations
3. **Seat Selection** — visual car seat map (В/Л/П seats)
4. **Booking** — reserve seats with validation
5. **My Bookings** — view and cancel active bookings

### Driver Flow
1. **Create Ride** — publish rides with location, time, price
2. **Manage Bookings** — approve/reject passenger requests
3. **View All Rides** — see all active/completed/cancelled rides
4. **Cancel Ride** — cancel an active ride (restores seats)

### Validation Rules
- **Max bookings per passenger** — configurable via `MAX_BOOKING_COUNT` env (shared constant in contracts)
- **Time conflict prevention** — cannot book overlapping rides (2h buffer on each side)
- **Seat validation** — cannot exceed available seats
- **Booking cancellation** — passengers can cancel PENDING/APPROVED bookings
- **Driver rejection** — drivers can reject PENDING/APPROVED bookings (restores seats)

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
- `errorHandler` — catches ZodError → 400, generic errors → 500

### Services
- `rides.service.ts` — CRUD for rides, search, cancel (throws `RideError`)
- `bookings.service.ts` — CRUD for bookings with seat management (throws `BookingError`)
- `users.service.ts` — user registration/init
- `locations.service.ts` — list pickup points

### Auth Modes
1. **Production** — HMAC-SHA256 verification of VK launch params
2. **Development** — `VK_AUTH_MOCK_ENABLED=true` auto-authenticates all requests

## Frontend Components

### CarSeatMap
Top-down car schematic with 3 seats:
- **В** (Водитель) — front seat
- **Л** (Левый) — back-left seat
- **П** (Правый) — back-right seat
- Green = selected, Blue = available, Grey = occupied

### TripCard
Combined trip information card:
- Car seat map visualization
- Route, price, date
- Driver/passenger info
- Action buttons (Book/Cancel/Approve/Reject)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `VK_APP_SECRET` | — | VK app secret for HMAC verification |
| `PORT` | `3000` | Backend server port |
| `MAX_BOOKING_COUNT` | `5` | Max active bookings per passenger |
| `VK_AUTH_MOCK_ENABLED` | `false` | Enable mock auth for development |
| `CORS_ORIGINS` | `vk.com,vk.ru` | Allowed CORS origins |
