# Local BlaBlaCar — VK Mini App

A ride-sharing Mini App for VKontakte: drivers publish rides between local pickup points, passengers search and book seats.

## Features

### Passenger
- Search rides by From/To locations with optional date filter
- Visual seat selection (car seat map)
- Book up to 5 active rides (only future/upcoming)
- Edit pending bookings (change seats/note)
- Cancel bookings (soft-delete, history preserved)
- Time conflict prevention (4-hour window)
- Collapsible bookings list with history

### Driver
- Create rides with location, time, price, offered seats
- Approve/reject booking requests with passenger names
- View active trips as panel list, tap to see details
- Cancel rides (cascades to bookings)
- Driver time conflict prevention (4-hour window)
- Driver seat automatically excluded from offered seats

### Shared
- Unified TripListItem component for consistent UI
- VKUI theme adaptation (light/dark)
- Mock auth mode for development
- sessionStorage persistence for search state
- Docker support for local development
- Domain-driven frontend architecture
- Global state via React Context
- Custom data-fetching hooks

## Stack

- **`backend`** — Bun + Hono + Prisma 7 + PostgreSQL, HMAC auth, `@hono/zod-validator`
- **`webapp`** — React + Vite + VKUI + `vk-mini-apps-router`
- **`packages/contracts`** — shared Zod schemas + constants (single source of truth)

## Quick Start

```bash
# Install dependencies
bun install

# Start PostgreSQL
docker compose up -d postgres

# Configure backend
cp backend/.env.example backend/.env
# Edit backend/.env with your VK_APP_SECRET

# Run migrations and seed
bun run prisma:migrate
bun run prisma:seed
bun run prisma:seed:test

# Start servers
bun run dev:backend   # http://localhost:3000
bun run dev:webapp    # http://localhost:5173
```

## Testing Without VK

Enable mock auth in `backend/.env`:
```env
VK_AUTH_MOCK_ENABLED=true
```

Open in browser:
- **Passenger:** http://localhost:5173/?mock_user=passenger#/passenger
- **Driver:** http://localhost:5173/?mock_user=driver#/driver

See [`docs/TESTING.md`](docs/TESTING.md) for test data and user IDs.

## Docker

```bash
# Start both backend and database
docker compose up -d

# Apply migrations
docker compose exec backend bunx prisma migrate deploy

# Seed data
docker compose exec backend bun run prisma:seed
docker compose exec backend bun run prisma:seed:test
```

## Workspace Commands

| Command | Description |
|---------|-------------|
| `bun run dev:backend` | Start API with hot reload |
| `bun run dev:webapp` | Start Vite dev server |
| `bun run prisma:migrate` | Create/apply migration (dev) |
| `bun run prisma:deploy` | Apply migrations (prod) |
| `bun run prisma:seed` | Seed locations |
| `bun run prisma:seed:test` | Seed test users, rides, bookings |
| `bun run deploy:webapp` | Deploy to VK static hosting |
| `bun run typecheck` | Type-check all workspaces |

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design, components, env vars
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — production deployment guide
- [`docs/TESTING.md`](docs/TESTING.md) — test data, API endpoints, validation rules

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `VK_APP_SECRET` | — | VK app secret |
| `PORT` | `3000` | Backend port |
| `MAX_BOOKING_COUNT` | `5` | Max bookings per passenger (future rides only) |
| `VK_AUTH_MOCK_ENABLED` | `false` | Mock auth (dev only) |
| `CORS_ORIGINS` | `vk.com,vk.ru` | Allowed origins |
