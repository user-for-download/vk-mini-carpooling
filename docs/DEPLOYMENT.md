# Deployment

## Quick Start (Development)

```bash
# Install dependencies
bun install

# Start PostgreSQL
docker compose up -d postgres

# Configure environment
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

## Docker Deployment

### Full Stack (Backend + Database)

```bash
# Start both services
docker compose up -d

# Apply migrations
docker compose exec backend bunx prisma migrate deploy

# Seed data
docker compose exec backend bun run prisma:seed
docker compose exec backend bun run prisma:seed:test

# View logs
docker compose logs -f backend
```

### Docker Compose Services

- **postgres** — PostgreSQL 16 Alpine on port 54329
- **backend** — Bun/Hono API on port 3000

### Environment Variables (Docker)

The `docker-compose.yml` includes:
```yaml
environment:
  DATABASE_URL: postgres://local_blablacar:local_blablacar@postgres:5432/local_blablacar
  VK_APP_SECRET: testsecret
  VK_AUTH_MOCK_ENABLED: "true"
  NODE_ENV: "development"
```

For production, update these values or use a `.env` file.

## Environment Variables

### Required
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `VK_APP_SECRET` | VK app secret from admin panel |

### Optional
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Backend server port |
| `MAX_BOOKING_COUNT` | `5` | Max active bookings per passenger (future rides only) |
| `VK_AUTH_MOCK_ENABLED` | `false` | Enable mock auth (dev only) |
| `CORS_ORIGINS` | `vk.com,vk.ru` | Allowed CORS origins |
| `NODE_ENV` | `production` | Environment mode |

## Prisma 7 Setup

The project uses Prisma 7.9.0 with the `prisma-client` generator and `PrismaPg` driver adapter.

### Key files
- `backend/prisma/schema.prisma` — data model (no `url` in datasource block)
- `backend/prisma.config.ts` — CLI config with datasource URL
- `backend/generated/` — generated Prisma Client (import from here)
- `backend/src/runtime.ts` — instantiates `PrismaClient` with `PrismaPg` adapter

### Common commands
```bash
# Generate client after schema changes
cd backend && bunx prisma generate

# Create migration
cd backend && bunx prisma migrate dev --name <name>

# Apply migrations (prod)
cd backend && bunx prisma migrate deploy

# Check migration status
cd backend && bunx prisma migrate status
```

## Production Deployment

### 1. Frontend: VK Static Hosting

```bash
cd webapp
# Update vk-hosting-config.json with your app_id
bun run build
bun run deploy
```

### 2. Backend: Self-Hosted

The backend is a plain Bun/Hono process. Any Docker/Node-capable host works.

```bash
# Build
bun run --cwd backend build

# Run migrations
cd backend && bunx prisma migrate deploy

# Start (with NODE_ENV=production)
NODE_ENV=production bun run --cwd backend start
```

### 3. Environment Configuration

**Production `.env`:**
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
VK_APP_SECRET=your-real-secret
PORT=3000
MAX_BOOKING_COUNT=5
VK_AUTH_MOCK_ENABLED=false
CORS_ORIGINS=https://vk.com,https://m.vk.com,https://vk.ru,https://m.vk.ru
NODE_ENV=production
```

**Security:**
- `VK_AUTH_MOCK_ENABLED` must be `false` in production (server refuses to boot if true)
- `VK_APP_SECRET` — never commit, rotate if leaked
- `NODE_ENV=production` required for production safety checks

## Trusted Domains

VK serves Mini Apps from both `vk.com` and `vk.ru`. Include all variants:

```
https://vk.com,https://m.vk.com,https://vk.ru,https://m.vk.ru
```

For custom domains (e.g., Traefik proxy), add to `vite.config.ts`:
```typescript
server: {
  allowedHosts: ['vk.binetc.fun'],
}
```

## VK Tunnel Status

As of writing, VK Tunnel is down for maintenance. Alternatives:
- Deploy to VK's static hosting for real URL testing
- Use ngrok/cloudflared pointed at local Vite dev server
- Use Traefik/nginx reverse proxy with custom domain

## Mock Auth Mode

For local development without VK:

```env
VK_AUTH_MOCK_ENABLED=true
```

- All requests auto-authenticate without HMAC verification
- Use `?mock_user=driver` or `?mock_user=passenger` URL params
- **NEVER** enable in production (server throws fatal error)
