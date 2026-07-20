# Deployment

## Supported MVP topology

Use one persistent Node.js application instance and one notification worker. Mount `data/` on durable storage. The database and uploads must survive container replacement.

## Docker deployment

```bash
npm run setup:production -- https://deliveries.example.com
# Edit .env.production and add RESEND_API_KEY / EMAIL_FROM.
docker compose up -d --build
docker compose logs -f web
```

The first startup creates the database and bootstrap platform administrator from `.env.production`. The bootstrap variables are ignored after a user exists.

## HTTPS and domain

Terminate TLS through a managed container host, load balancer, Caddy, Nginx, or Cloudflare. `APP_URL` must be the final public HTTPS origin because secure quote links in email use it.

## Storage

- Database: `data/maliktboard.db`
- WAL files: `data/maliktboard.db-wal` and `data/maliktboard.db-shm`
- Uploads: `data/uploads/`

Never store these only in an ephemeral container layer.

## Email

Set `RESEND_API_KEY`, a verified `EMAIL_FROM`, and `CRON_SECRET`. The worker calls the private notification endpoint every 30 seconds. Notification idempotency prevents duplicate event emails.

## Backups

```bash
set -a; source .env.production; set +a
npm run backup
```

Copy the resulting timestamped directory in `backups/` to a separate encrypted location. To restore, stop both services, replace the database and upload directory, and start the services again. Test restoration before launch.

## Scaling boundary

SQLite is intentionally used for a single-node first pilot. Before multiple web replicas, migrate the schema and transactional services to PostgreSQL. Do not place the SQLite file on an unsupported shared network filesystem.
