# MaliktBoard Launch MVP — Release Notes

## What changed from the audited prototype

This release replaces browser `localStorage` operations with authenticated server-side persistence and addresses the critical and high-severity findings documented in the prior audit.

Major corrections include:

- Protected platform, company, customer, and field-operation routes.
- Server-side multi-tenant, role, and location authorization.
- Secure quote acceptance by the customer rather than a staff-side demo action.
- One shipment per request and idempotent activation.
- Validated automatic journeys, including pickup and final stages.
- Transactional Dispatch Batch lifecycle and eligibility filtering.
- Secure Delivery PIN validation, failed-attempt persistence, rate limits, proof evidence, and repeat-delivery prevention.
- Real package and evidence uploads with sensitive-ID privacy separation.
- Secure public tracking and owner-only authorization.
- Unicode 4×6 shipment and Dispatch Batch labels.
- Installable Android scanner PWA with camera/manual entry and limited offline queue.
- Email/in-app notification queue and provider worker.
- Company, team, location, route, customer, payment, branding, and platform administration workflows.
- Production environment generator, health checks, backups, Docker deployment files, automated regression tests, and operating documentation.

## Release boundary

The package targets a first contracted pilot on one server. It deliberately uses SQLite to reduce launch complexity. PostgreSQL migration is required before multi-node scaling or substantially higher concurrent volume.
