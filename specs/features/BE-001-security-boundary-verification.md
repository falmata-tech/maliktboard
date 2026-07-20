---
id: BE-001
title: Verify authorization and tenant security boundaries
status: verifying
owner: product-owner
risk: tier-3
source: Product-owner instruction 2026-07-20; MP-06, MP-07, MP-13, MP-35, MP-47, MP-49
related: [BE_BASE, DEP-001, DEP-003]
---

# Problem and outcome

The MVP has positive workflow coverage, but critical authorization boundaries need explicit negative verification. A passing result must demonstrate that tenant identifiers, roles, location scope, QR tokens, tracking tokens, and evidence visibility cannot be confused to disclose data or authorize mutations.

## Scope

- In scope: automated negative tests at domain/service and browser/API boundaries for tenant isolation, role capability checks, Team location scope, QR-token isolation, tracking-token binding/revocation/expiry, evidence privacy, and cross-tenant mutations.
- Non-goals: changing product behavior, adding roles or features, migrating the accepted pilot stack, weakening an assertion to match implementation, or repairing a defect discovered by this verification.
- Assumptions/open questions: current seeded synthetic fixtures may be extended only when necessary to express a boundary. Any failed security criterion blocks completion and creates a separately proposed repair spec.

## Threat model

- Assets: tenant operational data, customer-visible shipment data, private and sensitive evidence, mutation authority, audit integrity, and opaque access tokens.
- Actors: anonymous visitor, customer holding a tracking token, authenticated Viewer, Team member, Supervisor, Admin, Owner, and an authenticated member of another tenant.
- Trust boundaries: browser to Next.js handler, handler to application service, service to database/storage adapters, and opaque token to tenant-scoped record.
- Principal threats: identifier substitution (IDOR), forged or replayed tokens, cross-tenant confused deputy calls, privilege escalation, location-scope bypass, sensitive-evidence disclosure, and unauthorized state mutation.
- Required posture: server-side deny by default; UI hiding is never authorization; identifiers alone grant no access; every mutation preserves tenant and actor context.

## Behavior

### Scenario AC-01 — tenant identifiers do not cross boundaries

```gherkin
GIVEN an authenticated member of one company and valid identifiers belonging to another company
WHEN the member attempts supported reads or mutations using those identifiers
THEN no foreign record or sensitive existence detail is returned
AND no foreign state or audit history changes
```

### Scenario AC-02 — role and location scope constrain authority

```gherkin
GIVEN Viewer and Team actors with known role and location assignments
WHEN they attempt privileged mutations or access outside their assigned locations
THEN the server denies the operation regardless of client navigation or submitted identifiers
AND authorized in-scope reads remain available
```

### Scenario AC-03 — opaque tokens are bound and fail closed

```gherkin
GIVEN valid, invalid, revoked, expired, and cross-entity tracking or QR tokens
WHEN a public or authenticated token workflow resolves them
THEN only a valid token bound to the intended tenant and entity grants its specified access
AND every other token state fails without disclosing protected data
```

### Scenario AC-04 — evidence visibility is enforced server-side

```gherkin
GIVEN public, customer-visible, private, and sensitive evidence records
WHEN anonymous, customer, scoped staff, privileged staff, or foreign-tenant actors request them
THEN each actor receives only evidence permitted by tenant, request, visibility, sensitivity, role, and location scope
AND denied requests do not expose storage paths or file contents
```

### Scenario AC-05 — findings cannot silently expand implementation scope

```gherkin
GIVEN a verification test demonstrates a mismatch with an accepted security requirement
WHEN the finding is recorded
THEN this spec remains blocked or verifying with reproducible evidence
AND a linked repair spec is proposed for human acceptance before production code changes
```

## Contracts

Application-service entry points receive authenticated actor and company context and must enforce applicable capability and scope rules. Database identifiers are references, not authority. Public access uses hashed opaque tokens with explicit entity binding and lifecycle checks. Evidence delivery must authorize before resolving or streaming private storage. Denials may be expressed as not-found where required to avoid enumeration.

## Quality and operations

- Security/privacy: synthetic fixtures only; assert absence of state changes and protected response content as well as error status.
- Accessibility/localization: not applicable to service-level denials; browser assertions use stable semantic controls where a UI boundary is exercised.
- Performance limits: focused security suite remains suitable for the portable CI gate.
- Logs/metrics/audit: unauthorized attempts must not create success-domain audit events; test output must not print raw tokens or secrets.
- Migration/backfill: not applicable; this verification task changes no schema or runtime data.
- Rollout/rollback: tests enter the existing quality gate. A flaky or invalid test may be reverted; a valid failing security assertion may not be waived to ship.

## Verification matrix

| Criterion | Test level | Evidence |
|---|---|---|
| AC-01 | service integration and mutation-negative | passing: foreign shipment/request/batch reads denied; receive mutation left state, events, and foreign audit unchanged |
| AC-02 | domain/service integration and browser authorization | partial: role matrix and Team location scope pass; direct service capability enforcement gap recorded in BE-002 |
| AC-03 | service/API integration | passing: invalid, expired, revoked, and foreign-tenant QR/tracking-token cases fail closed |
| AC-04 | service/API/browser privacy | partial: public evidence visibility/sensitivity filters and prior browser privacy pass; unscoped evidence accessor recorded in BE-002 |
| AC-05 | process/traceability review | passing: BE-002 proposed before any production repair |

## Approval

- Product acceptance: approved by product owner on 2026-07-20 (“go with your recommended task and orders”)
- Architecture/security acceptance: verification finding open in BE-002; BE-001 cannot complete until repaired or explicitly deferred with rationale
- Deployment acceptance: tests-only CI-gate change; no runtime deployment or migration
- Waivers: none
