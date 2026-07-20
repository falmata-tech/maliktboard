# Architecture

## Required shape

Use a pragmatic ports-and-adapters architecture:

```text
UI / route handlers / workers
        -> application services
        -> domain rules and invariants
        -> ports
        -> database, storage, email, QR and other adapters
```

The domain must not import UI, framework, database, storage, or provider code. Application services own use-case orchestration, authorization context, transactions, and idempotency. Adapters translate external concerns without redefining domain behavior.

## Current implementation

- Next.js App Router web application and scanner PWA
- Reusable TypeScript domain package
- SQLite persistence, custom database sessions, local private uploads
- Resend-compatible notification worker

The master prompt instead mandates Supabase Authentication, PostgreSQL/RLS, Supabase Storage, and Expo/React Native. `ADR-001` accepts the current stack only for local validation and a controlled single-node pilot with mandatory migration triggers. It does not redefine implementation compliance with the master prompt.

## Design rules

- Prefer cohesive modules and explicit contracts over framework-coupled logic.
- Use value objects when validated values have meaningful behavior or invariants; avoid wrapper types with no benefit.
- Use entities for concepts with identity and lifecycle. Do not force every database row into a class.
- Keep write workflows transactional and idempotent where required by MP-50.
- No dependency, abstraction, or pattern is added without a current use case.
- Architectural changes require an ADR with consequences, migration, rollback, and security impact.
