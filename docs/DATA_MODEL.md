# Data Model

The executable schema is `apps/web/db/schema.sql`. The master conceptual model is MP-02 and MP-41. Differences are tracked in `docs/TRACEABILITY.md` and resolved through ADRs/migrations.

## Core invariants

- Every company-owned operational record carries `company_id`.
- Cross-record company compatibility is enforced in persistence and services.
- One request creates at most one shipment.
- One shipment has one ordered journey and at most one active batch membership.
- Route Legs never cross companies or connect a location to itself.
- Public identifiers and tokens are opaque and non-sequential.
- Events and audit records are append-oriented; corrections create accountable records.
- Delivery, payment, evidence, and authorization data follow explicit privacy and retention rules.

Every schema-changing spec must include migration, backfill, compatibility, rollback, validation queries, privacy classification, and backup/restore consequences.
