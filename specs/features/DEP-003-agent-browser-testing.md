---
id: DEP-003
title: Agent-owned local and remote browser testing
status: accepted
owner: product-owner
risk: tier-2
source: Product-owner instruction 2026-07-20
related: [FE_BASE, DEP_BASE]
---

# Problem and outcome

Human testing is currently carrying too much of the verification burden, while HTTP smoke checks miss browser-only failures such as forwarded Server Actions. The agent must run repeatable local browser tests and Browserbase sessions before asking the product owner for subjective usability and final acceptance.

## Scope

- In scope: Playwright-based local browser tests, isolated demo data, desktop/mobile projects, screenshots/traces on failure, critical public/auth/role/privacy workflows, CI command, evidence reporting, and a Browserbase execution contract.
- Non-goals: replacing human usability acceptance, testing production with destructive data, recording secrets in artifacts, exhaustive visual snapshots, or pretending Browserbase ran when it is unavailable.
- Assumptions: Chromium automation may be installed as a development dependency; Browserbase requires a separately connected integration and credentials.

## Behavior

### Scenario AC-01 — local browser suite owns functional verification

```gherkin
GIVEN a clean seeded test environment and local application server
WHEN the agent runs the browser test command
THEN critical anonymous and authenticated journeys execute in a real Chromium browser
AND failures retain actionable traces or screenshots
AND the suite exits non-zero on an unmet expectation
```

### Scenario AC-02 — responsive and role evidence

```gherkin
GIVEN desktop and mobile browser profiles
WHEN the suite visits public, customer, staff, and scanner experiences
THEN essential controls and privacy/authorization outcomes are asserted
AND test data remains isolated from production
```

### Scenario AC-03 — remote Browserbase evidence is honest

```gherkin
GIVEN Browserbase is connected and authorized for the test environment
WHEN a remote acceptance run is requested
THEN the agent runs the selected scenarios remotely
AND records the session evidence and environment
BUT WHEN Browserbase is unavailable
THEN the criterion is reported blocked rather than passed or simulated
```

### Scenario AC-04 — human remains in the loop

```gherkin
GIVEN automated local and remote results are available
WHEN a user-visible change reaches human acceptance
THEN the product owner receives a short evidence summary and focused usability questions
AND is not asked to repeat deterministic checks already owned by automation
```

## Contracts

Use stable role-oriented locators and outcomes rather than implementation selectors. Start/reset only demo test data, never production. Store artifacts under ignored test-output directories. Browserbase credentials must come from environment/secret storage and never enter source, logs, screenshots, or traces.

## Quality and operations

- Security/privacy: synthetic data only; redact credentials/tokens from artifacts; test forbidden access and public privacy.
- Accessibility/localization: include keyboard/focus and representative localized-layout checks; retain human judgment for quality.
- Performance limits: a small critical suite runs in CI; broader matrices run on demand.
- Logs/metrics/audit: command result, browser/project, trace/screenshot path, remote session reference when available.
- Migration/backfill: add Playwright dependency/config/scripts and portable browser installation in CI.
- Rollout/rollback: local suite first, then CI; remove the gate if infrastructure is unstable but never waive feature acceptance silently.

## Verification matrix

| Criterion | Test level | Evidence |
|---|---|---|
| AC-01 | local browser integration | pending |
| AC-02 | desktop/mobile browser projects | pending |
| AC-03 | Browserbase remote integration | blocked: integration unavailable in current session |
| AC-04 | process review | workflow update pending |

## Approval

- Product acceptance: explicitly approved 2026-07-20
- Architecture/security acceptance: pending implementation review
- Deployment acceptance: local-first approved; hosted/Browserbase evidence pending
- Waivers: none
