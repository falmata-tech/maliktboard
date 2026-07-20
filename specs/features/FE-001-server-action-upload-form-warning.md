---
id: FE-001
title: Remove redundant Server Action upload-form encoding attributes
status: accepted
owner: product-owner
risk: tier-1
source: DEP-003 local browser evidence 2026-07-20
related: []
---

# Problem and outcome

React emits a browser/server warning because upload forms with function-valued Server Actions manually specify `encType="multipart/form-data"`. React owns the method and encoding for these forms. The outcome is warning-free upload rendering without changing request or delivery behavior.

## Scope

- In scope: public shipment-request and delivery-completion upload forms; regression assertion that uploads still reach their Server Actions.
- Non-goals: form redesign, broader accessibility work, upload validation changes, or evidence-policy changes.
- Assumptions/open questions: none.

## Behavior

### Scenario AC-01 — React owns Server Action encoding

```gherkin
GIVEN a function-valued Server Action form containing file inputs
WHEN React renders and submits the form
THEN the form does not manually specify method or encoding attributes
AND no related React warning is emitted
AND the file submission behavior remains successful
```

## Contracts

Remove only redundant form attributes. Preserve action functions, field names, accepted MIME types, validation, redirects, authorization, and upload limits.

## Quality and operations

- Security/privacy: no upload or authorization behavior changes.
- Accessibility/localization: N/A for this contained warning repair.
- Performance limits: N/A.
- Logs/metrics/audit: browser console/server forwarding contains no encoding warning.
- Migration/backfill: none.
- Rollout/rollback: ordinary application deployment; revert attribute-only diff if regression occurs.

## Verification matrix

| Criterion | Test level | Evidence |
|---|---|---|
| AC-01 | Playwright upload flow and console capture | pending |

## Approval

- Product acceptance: explicitly approved by product owner on 2026-07-20
- Architecture/security acceptance: attribute-only repair; existing Server Action, authorization, and upload controls remain unchanged
- Deployment acceptance: N/A
- Waivers: none
