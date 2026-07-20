# MaliktBoard Launch MVP

MaliktBoard is a multi-tenant domestic-delivery operations platform. This release replaces the earlier browser-only prototype with server-side persistence, authentication, permission checks, secure customer links, transactional shipment and Dispatch Batch workflows, evidence storage, notifications, and an installable Android scanner PWA.

## Fast local demonstration

Requirements: Node.js 22.5 or newer.

```bash
npm ci
npm run seed:reset
npm run dev
```

Open `http://localhost:3000`.

Demo accounts are displayed on the login page while `SEED_DEMO=true`.

## Production setup

```bash
npm ci
npm run setup:production -- https://your-domain.example
# Add RESEND_API_KEY and set EMAIL_FROM in .env.production.
docker compose up -d --build
```

Open `/api/health` and resolve every warning before accepting real customer data. Put the service behind HTTPS through your hosting platform or reverse proxy.

## Core implemented workflow

1. A customer opens a branded company page and submits one package request with a photograph.
2. Authorized company staff issue a preliminary quote.
3. The customer accepts or abandons it through a private link.
4. Staff activate an accepted request once; the server generates the journey, secure QR identifiers, tracking link, owner-only Delivery PIN link, and 4×6 label.
5. Shipments enter compatible Dispatch Batches and inherit idempotent departure/arrival events.
6. At arrival, continuing shipments transfer into a compatible next batch; final shipments move to collection or delivery.
7. Final handoff requires the PIN and proof photograph. Receiver-ID evidence remains staff-restricted.
8. Customers receive a simplified timeline and approved evidence through secure tracking.

## Architecture

- Next.js App Router, React, strict TypeScript
- Node built-in SQLite with WAL and foreign-key enforcement
- HttpOnly database sessions
- Scrypt password and PIN hashing
- AES-256-GCM encryption for retrievable private tokens
- Local private upload storage
- Resend email provider adapter and notification worker
- Installable scanner PWA with camera/manual QR entry and an idempotent offline action queue

SQLite is appropriate for the first contracted pilot on one application node. Do not run multiple web replicas against the same local database. Migrate to managed PostgreSQL before horizontal scaling or high-volume operation.

See `START_HERE.md`, `docs/DEPLOYMENT.md`, `docs/SECURITY.md`, and `BUILD_VALIDATION.md`.
