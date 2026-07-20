# Architecture Decision Record Index

Decisions are append-only. Superseded decisions remain linked.

## ADR-001 — Production platform and mobile architecture

- Status: proposed
- Date: 2026-07-20
- Source: MP-05, MP-34, current implementation
- Decision owner: product owner

The master prompt mandates Supabase/PostgreSQL/RLS/Storage and Expo/React Native. The current pilot uses SQLite, custom sessions/local storage, and a scanner PWA. Before architecture-dependent feature work, choose one:

1. Restore the mandated architecture.
2. Accept the pilot architecture for a time-bounded phase with explicit migration triggers.
3. Amend the product baseline permanently with documented security/scaling consequences.

No option is accepted yet. Existing implementation is not implicit approval.

## ADR template

Record status, context, considered options, decision, consequences, security/data impact, migration, rollback, validation evidence, owner, and date.
