# Architecture Decision Record Index

Decisions are append-only. Superseded decisions remain linked.

## ADR-001 — Time-bounded pilot platform architecture

- Status: accepted
- Date: 2026-07-20
- Source: MP-05, MP-34, current implementation
- Decision owner: product owner

### Context

The master prompt mandates Supabase/PostgreSQL/RLS/Storage and Expo/React Native. The current pilot uses SQLite, custom sessions/local file storage, and a scanner PWA. Immediate migration would delay validation and increase cost before the core workflows and field UX have human acceptance.

### Decision

Accept the current architecture only for local validation and a controlled, single-node pilot. This is an explicit exception to MP-05, MP-07, and MP-34, not evidence that those requirements were implemented.

- Run one application replica against one durable local SQLite database.
- Do not add architecture-dependent product features beyond accepted defect, security, operability, and migration-enabling work.
- Do not claim PostgreSQL RLS, Supabase, native Android, horizontal scaling, or general production readiness.
- Keep service/domain contracts separable from persistence, auth, storage, and UI adapters.
- Evaluate scanner PWA fitness through Android field testing. Expo/native delivery requires a separate ADR only if accepted requirements or field evidence justify it.

### Mandatory migration triggers

Migrate persistence/auth/storage to the accepted managed PostgreSQL architecture before any of:

- more than one web replica or shared-database node;
- broad production availability beyond the controlled pilot;
- concurrency, reliability, recovery, audit, or tenant-isolation needs that SQLite cannot evidence;
- contractual or regulatory requirements for database-enforced RLS/managed storage;
- architecture-dependent feature expansion that would materially increase migration cost.

### Consequences and controls

The pilot is cheaper and faster to validate, but carries single-node availability, scaling, operational, and defense-in-depth limits. Server authorization, composite tenant constraints, backups, restore tests, private evidence storage, HTTPS, production secrets, monitoring, and tenant-negative tests remain mandatory. Real sensitive data requires the launch security/privacy gates; this ADR is not a security waiver.

### Migration and rollback

Migration work requires a Tier 3 DEP/BE spec covering schema conversion, auth/session transition, storage transfer, RLS policies, dual-read/write or maintenance window, reconciliation, backup, rollback, and production-like rehearsal. If the controlled pilot cannot meet its acceptance or safety gates, stop the pilot rather than broadening this exception.

### Approval

Accepted explicitly by the product owner on 2026-07-20. Revisit at every migration trigger and before pilot launch approval.

## ADR template

Record status, context, considered options, decision, consequences, security/data impact, migration, rollback, validation evidence, owner, and date.
