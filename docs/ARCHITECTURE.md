# Architecture

## Layout

```
vk-mini-app/
├── packages/contracts/      Zod schemas + constants — single source of truth
├── backend/                 Bun + Hono + Prisma API
├── webapp/                  React + Vite + VKUI Mini App
│   └── src/
│       ├── components/      Reusable UI components (CarSeatMap, TripCard)
│       └── panels/          Screen panels (PassengerPanel, DriverPanel, etc.)
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
- **Max bookings per passenger** — configurable via `MAX_BOOKING_COUNT` env
- **Time conflict prevention** — cannot book overlapping rides
- **Seat validation** — cannot exceed available seats
- **Booking cancellation** — passengers can cancel PENDING/APPROVED bookings
- **Driver rejection** — drivers can reject PENDING/APPROVED bookings (restores seats)

## Contracts Flow

`packages/contracts` holds:
- Zod schemas (`CreateRideSchema`, `RideDTOSchema`, etc.)
- Status constants (`RIDE_STATUS`, `BOOKING_STATUS`)

Both `backend` and `webapp` import from `@local-blablacar/contracts` — one definition of truth.

## Backend Request Flow

```
route (thin) -> Zod validation -> vkAuthMiddleware -> service -> Prisma -> DTO
```

### Services
- `rides.service.ts` — CRUD for rides, search, cancel
- `bookings.service.ts` — CRUD for bookings with seat management
- `users.service.ts` — user registration/init

### Auth Modes
1. **Production** — HMAC-SHA256 verification of VK launch params
2. **Development** — `VK_AUTH_MOCK_ENABLED=true` auto-authenticates all requests

## Frontend Components

### CarSeatMap
Top-down car schematic with 3 seats:
- **В** (Водитель) — front seat
- **Л** (Левый) — back-left seat
- **П** (Правый) — back-right seat
- Green = selected, Red = occupied, Grey = empty

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
