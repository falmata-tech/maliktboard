---
id: DEP-002
title: Codespaces Server Actions origin compatibility
status: human-acceptance
owner: product-owner
risk: tier-1
source: DEFECT-2026-07-20 invalid Server Actions request
related: []
---

# Problem and outcome

Forms loaded through a GitHub Codespaces forwarded URL failed with `Invalid Server Actions request` because the browser origin and forwarded host differed. Development forms must work through the Codespaces proxy without weakening production origin checks.

## Scope

- In scope: development-only allowed origins for localhost and GitHub Codespaces forwarded hosts.
- Non-goals: broad production origins, disabling CSRF protection, or changing application form behavior.
- Assumption: `*.app.github.dev` is the trusted development forwarding domain.

## Behavior

### Scenario AC-01 — proxied form succeeds in development

```gherkin
GIVEN the app runs in development behind a GitHub Codespaces forwarded host
WHEN a user submits a valid Server Action form from the local forwarded browser session
THEN Next.js accepts the origin
AND the action completes normally instead of returning HTTP 500
```

### Scenario AC-02 — production remains same-origin by default

```gherkin
GIVEN the app is built for production
WHEN Next.js loads the Server Actions configuration
THEN development-only additional origins are absent
AND default same-origin protection remains active
```

## Contracts

`experimental.serverActions.allowedOrigins` is added only when `NODE_ENV=development`. `bodySizeLimit` remains unchanged.

## Quality and operations

- Security/privacy: no CSRF control is disabled; allow-list is development-only.
- Accessibility/localization: N/A.
- Performance limits: N/A.
- Logs/metrics/audit: failed request is observable in development logs.
- Migration/backfill: none.
- Rollout/rollback: development server reload; revert the configuration if forwarding behavior changes.

## Verification matrix

| Criterion | Test level | Evidence |
|---|---|---|
| AC-01 | proxied HTTP integration | HTTP 303 to `/app`; no invalid-action response |
| AC-02 | production build | `npm run build` passed |

## Approval

- Product acceptance: browser retest pending
- Architecture/security acceptance: scoped configuration verified
- Deployment acceptance: development only
- Waivers: implemented before workflow installation; documented retroactively
