---
id: BE-002
title: Enforce authorization inside application services
status: human-acceptance
owner: product-owner
risk: tier-3
source: BE-001 security inspection finding 2026-07-20; docs/ARCHITECTURE.md
related: [BE-001, BE_BASE]
---

# Problem and outcome

Mutation route handlers request the appropriate permission before calling application services, but exported service functions trust a caller-supplied member context and do not consistently enforce role capabilities themselves. The unscoped `getEvidenceRecord` accessor also returns evidence by identifier without actor or tenant context. This violates the architecture rule that application services own authorization and leaves future or alternate adapters vulnerable to confused-deputy access.

## Scope

- In scope: define and enforce required capabilities at every protected service entry point; require actor, tenant, role, and location context for evidence access; keep route checks as defense in depth; add direct-service negative tests and audit assertions.
- Non-goals: changing the role matrix, adding roles, redesigning authentication, migrating persistence, changing intended UI access, or weakening existing tenant/location checks.
- Assumptions/open questions: map each service to one existing domain permission before implementation. Read accessors return `null` for missing, foreign, or unauthorized records where identifier enumeration is possible; mutation services throw the existing generic permission error before protected state access.

## Behavior

### Scenario AC-01 — service mutations deny insufficient roles

```gherkin
GIVEN a valid member context whose role lacks a mutation's required permission
WHEN any adapter calls that application service directly
THEN the service denies before reading or changing protected state
AND no success audit or domain event is created
```

### Scenario AC-02 — evidence lookup requires complete authority

```gherkin
GIVEN an evidence identifier and an anonymous, foreign-tenant, out-of-scope, or insufficient-role actor
WHEN evidence metadata or content is requested
THEN no storage path or protected metadata is returned
AND sensitive access is limited to roles with EVIDENCE_VIEW_SENSITIVE
```

## Contracts

Protected application services must validate permission from the server-resolved `MemberContext`; callers cannot opt out. Evidence lookup accepts authority and requested access mode, never a bare identifier alone. Route-handler authorization remains a redundant boundary.

## Quality and operations

- Security/privacy: deny before mutation or storage resolution; prevent identifier enumeration; assert no unauthorized audit success.
- Accessibility/localization: not applicable.
- Performance limits: authorization checks add no unbounded query work.
- Logs/metrics/audit: denied operations may emit security telemetry without sensitive values; they never emit success events.
- Migration/backfill: none expected; confirm during clarification.
- Rollout/rollback: ship behind the existing test/CI gate; rollback only to the last authorization-safe implementation.

## Verification matrix

| Criterion | Test level | Evidence |
|---|---|---|
| AC-01 | direct service integration and adapter regression | passing: insufficient role, fabricated role, platform-admin impersonation, unchanged state/audit, and full workflow regression tests |
| AC-02 | service/API/browser privacy | passing: tenant, Team scope, Viewer-sensitive, privileged-sensitive, invalid token, private evidence, and live-browser privacy scenarios |

## Approval

- Product acceptance: explicitly approved by product owner on 2026-07-20 after plain-language scope explanation
- Architecture/security acceptance: automated gates pass; authoritative membership/location resolution and centralized evidence authorization verified
- Deployment acceptance: no schema migration; automated deployment gates pass, production rollout and human browser acceptance remain pending
- Waivers: none
