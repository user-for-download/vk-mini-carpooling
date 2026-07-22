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

# Start servers
bun run dev:backend   # http://localhost:3000
bun run dev:webapp    # http://localhost:5173
```

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
| `MAX_BOOKING_COUNT` | `5` | Max active bookings per passenger |
| `VK_AUTH_MOCK_ENABLED` | `false` | Enable mock auth (dev only) |
| `CORS_ORIGINS` | `vk.com,vk.ru` | Allowed CORS origins |

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
bun run prisma:deploy

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
```

**Security:**
- `VK_AUTH_MOCK_ENABLED` must be `false` in production (server refuses to boot if true)
- `VK_APP_SECRET` — never commit, rotate if leaked

## Trusted Domains

VK serves Mini Apps from both `vk.com` and `vk.ru`. Include all variants:

```
https://vk.com,https://m.vk.com,https://vk.ru,https://m.vk.ru
```

## VK Tunnel Status

As of writing, VK Tunnel is down for maintenance. Alternatives:
- Deploy to VK's static hosting for real URL testing
- Use ngrok/cloudflared pointed at local Vite dev server

## Mock Auth Mode

For local development without VK:

```env
VK_AUTH_MOCK_ENABLED=true
```

- All requests auto-authenticate without HMAC verification
- Use `?mock_user=driver` or `?mock_user=passenger` URL params
- **NEVER** enable in production (server throws fatal error)
