---
id: DEP-001
title: Portable pull-request quality gate
status: verifying
owner: product-owner
risk: tier-2
source: MP-05, MP-46, MP-49
related: []
---

# Problem and outcome

The lockfile contains environment-internal registry URLs, so a GitHub-hosted runner cannot reliably install dependencies. Pull requests therefore lack an enforceable full quality gate. The outcome is a reproducible, least-privilege CI workflow using portable dependency provenance.

## Scope

- In scope: portable lockfile, immutable install, spec check, typecheck, tests, production build, dependency/security reporting, cache policy, and branch-protection instructions.
- Non-goals: product behavior, deployment provider selection, automatic production deployment, dependency upgrades unrelated to portability.
- Assumption: public npm is the accepted package source unless the owner selects another trusted registry.

## Behavior

### Scenario AC-01 — clean pull request passes

```gherkin
GIVEN a clean GitHub-hosted runner and an unchanged accepted lockfile
WHEN the pull-request quality workflow runs
THEN dependencies install without private workspace credentials
AND the spec check, typecheck, tests, and production build pass
AND results are available as required status checks
```

### Scenario AC-02 — drift is blocked

```gherkin
GIVEN a pull request with a missing required spec, lockfile mismatch, failing test, type error, or build error
WHEN the quality workflow runs
THEN the relevant required check fails
AND the pull request cannot merge under branch protection
```

## Contracts

Use a pinned Node major compatible with `package.json`, `npm ci`, read-only default GitHub permissions, dependency caching keyed by the lockfile, explicit timeouts, and no repository secrets for ordinary validation. Registry and lockfile provenance changes must be visible in review.

## Quality and operations

- Security/privacy: least-privilege workflow permissions; no untrusted script receives secrets.
- Accessibility/localization: N/A—tooling only.
- Performance limits: target under ten minutes; cache must not weaken immutable installs.
- Logs/metrics/audit: retained GitHub check logs and dependency findings.
- Migration/backfill: regenerate or safely normalize the lockfile from the accepted registry.
- Rollout/rollback: prove on a branch, then require checks; rollback removes required status only with owner approval.

## Verification matrix

| Criterion | Test level | Evidence |
|---|---|---|
| AC-01 | CI integration | PR #1: hosted `validate-spec-system` passed in 8s and `verify` passed in 1m23s; immutable install, spec check, typecheck, 20 tests, Chromium, build, and audit covered |
| AC-02 | controlled failing PR | missing-spec failure verified locally; GitHub reports `main` is not protected, so required-check enforcement remains pending |

## Approval

- Product acceptance: accepted by product owner on 2026-07-20
- Architecture/security acceptance: least-privilege workflow, public-registry provenance, immutable install, and zero-vulnerability audit verified locally
- Deployment acceptance: accepted for implementation on 2026-07-20
- Waivers: none
