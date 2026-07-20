---
id: XX-000
title: Replace with a user outcome
status: proposed
owner: product-owner
risk: tier-1
source: MP-00
related: []
---

# Problem and outcome

Describe the observed problem, affected users, and measurable outcome. Do not prescribe implementation here.

## Scope

- In scope:
- Non-goals:
- Assumptions/open questions:

## Behavior

### Scenario AC-01 — descriptive name

```gherkin
GIVEN an explicit starting state and authorized actor
WHEN the actor performs one observable action
THEN the observable result is unambiguous
AND security, events, and failure behavior are stated where relevant
```

Include happy, validation, boundary, permission, tenant, concurrency/retry, error/recovery, accessibility, localization, and offline scenarios when applicable.

## Contracts

Define UI states, API/service inputs and outputs, domain invariants, errors, data changes, compatibility, and ports/adapters. Name class contracts only when the architecture requires a class; specify behavior and dependencies rather than internal implementation.

## Quality and operations

- Security/privacy:
- Accessibility/localization:
- Performance limits:
- Logs/metrics/audit:
- Migration/backfill:
- Rollout/rollback:

## Verification matrix

| Criterion | Test level | Evidence |
|---|---|---|
| AC-01 | unit/integration/e2e/human | pending |

## Approval

- Product acceptance:
- Architecture/security acceptance:
- Deployment acceptance:
- Waivers: none
