# Change Control and Risk Tiers

## No-spec exceptions

Tier 0 changes may proceed with a short change note instead of feature specs: spelling/docs-only edits, comment corrections, and formatting with no behavior change. Tests must still be proportionate.

## Tier 1 — contained

Small defect or UI adjustment with no contract, schema, auth, or deployment impact. Requires one feature spec in the affected FE/BE/DEP layer, acceptance scenarios, focused tests, traceability, and human UI acceptance when visible.

## Tier 2 — cross-layer

Feature or defect crossing layers, changing an API/contract, or altering a workflow. Requires linked layer specs, contract and failure cases, ADR check, regression tests, observability, rollout/rollback, and human acceptance.

## Tier 3 — critical

Auth, tenancy, evidence/privacy, payments, schema/data migration, offline sync semantics, infrastructure, destructive operations, or irreversible rollout. Requires linked specs, threat model, ADR, migration/rollback rehearsal, negative tests, deployment spec, independent human approval, and staged release evidence.

## Change request lifecycle

`proposed -> clarified -> ready -> accepted -> implementing -> verifying -> human-acceptance -> done`

Only the human product owner may move a spec to `accepted`, approve scope changes, waive a gate with written rationale, or authorize production rollout. Discovered adjacent work becomes a linked proposed spec; it does not expand the active change.
