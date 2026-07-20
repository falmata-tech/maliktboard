# MaliktBoard Launch MVP — Build Validation

Validation date: 2026-07-19

## Release classification

This package is suitable for a controlled first pilot on a single application node after production environment setup, HTTPS, email-provider configuration, backup verification, privacy review, and a complete test shipment using non-sensitive data.

It is not designed for horizontal multi-node deployment. Migrate the persistence layer to managed PostgreSQL before high-volume use or multiple web replicas.

## Validation completed

### Installation and dependency integrity

- `npm ci` completed successfully from the committed lockfile.
- `npm audit --omit=dev --audit-level=high` returned **0 vulnerabilities**.
- The project requires Node.js 22.5 or newer.

### Static and production build checks

- `npm run typecheck` passed.
- `npm run build` passed for the production Next.js application.
- Protected, public, customer, scanner, label, evidence, notification-worker, and health routes compiled successfully.

### Automated workflow tests

`npm test` passed the domain and server workflow suites, including regression coverage for the defects found in the previous audit:

- An unaccepted quote cannot be activated.
- One request cannot create duplicate shipments.
- Shipment receipt is idempotent.
- Same-location collection becomes ready at receipt.
- A non-owner shipment participant cannot retrieve the initiating owner's Delivery PIN authorization link.
- Cancelled shipments are skipped during Dispatch Batch arrival.
- Delivery is rejected before the final stage.
- Failed Delivery PIN attempts persist and are rate-limited.
- Repeated delivery completion is rejected.
- Tenant and route compatibility rules are enforced by server operations.

### HTTP smoke checks

The production server was exercised for the following paths and behaviors:

- Branded public company page returned successfully.
- Public shipment-request flow returned successfully.
- Private quote-review page returned successfully.
- Secure tracking page returned successfully.
- Owner authorization page returned successfully.
- Anonymous access to the company workspace redirected to login.
- Valid owner and Team Member sign-in succeeded.
- Location-scoped Team Members were redirected away from privileged company-wide pages.
- Company workspace, shipment, Dispatch Batch, scanner, and label routes returned successfully for authorized users.
- The Unicode label endpoint produced valid SVG output.
- Public tracking output did not contain the Delivery PIN, owner token, or customer phone number.
- Staff shipment pages did not expose the owner access token.

### Production bootstrap checks

- `npm run setup:production -- https://your-domain.example` generated strong random secrets and a platform-administrator password in a permissions-restricted environment file.
- The generated environment file was removed before packaging and is not included in this ZIP.
- A clean production bootstrap with `SEED_DEMO=false` created one configured platform administrator and zero demo companies.
- Database and upload backup creation was tested.

## Security controls validated

- HttpOnly authenticated sessions.
- Scrypt password and Delivery PIN hashing.
- AES-256-GCM encryption for retrievable private tokens.
- Opaque QR, tracking, quote, and owner-access tokens.
- Server-side tenant, role, and location-scope authorization.
- Composite same-company database constraints.
- One active Dispatch Batch membership per shipment.
- Transactional, idempotent shipment and batch operations.
- Durable failed Delivery PIN attempts and attempt throttling.
- Private evidence storage with customer-visible and staff-restricted classifications.
- Public tracking privacy separation.
- Supervisor-only override actions with mandatory reasons and audit events.

## Known deployment limitations

1. **Single-node persistence:** This release uses Node's built-in SQLite engine with WAL mode. Run only one web application replica against a database file. Use managed PostgreSQL before horizontal scaling.
2. **Android delivery:** The launch field application is an installable scanner PWA used through Android Chrome. A native Play Store package is not included.
3. **Offline scope:** Receipt, shipment-to-batch pairing, and batch actions can queue after network failure. Evidence-file uploads require an active connection.
4. **Email configuration:** Email delivery requires a verified Resend account, API key, and sender domain. Without it, notifications remain queued and visible in application records.
5. **Docker validation:** Docker configuration is included, but the Docker engine was unavailable in the validation environment, so the container image itself was not built here. The non-containerized production build and server were validated.
6. **Node warning:** Node 22 may print an experimental warning for `node:sqlite`. The application build and tests pass with this engine.
7. **Operational/legal review:** The delivery company must define retention, consent, government-ID handling, access, and deletion policies appropriate for its jurisdiction before collecting real identity evidence.

## Required pre-launch acceptance test

Before entering real customer data, complete one full test shipment on the production domain:

1. Submit one package request with a test photograph.
2. Issue a quote and accept it from the private customer link.
3. Activate the shipment once and confirm a journey is generated.
4. Print the shipment and Dispatch Batch labels.
5. Receive and add the shipment to a compatible batch.
6. Seal, dispatch, and arrive the batch.
7. Transfer continuing shipments or move the test shipment to final delivery/collection.
8. Complete delivery using the owner-provided PIN and proof photograph.
9. Confirm public tracking shows approved evidence but no private ID image or PIN.
10. Run and verify a database/upload backup.

## Commands used by the release operator

```bash
npm ci
npm run typecheck
npm test
npm run build
npm audit --omit=dev --audit-level=high
```
