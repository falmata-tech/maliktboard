# MaliktBoard Agent Operating Contract

This repository uses spec-driven development. These rules apply to every coding agent and every change.

## Source authority

When sources conflict, use this order and stop rather than silently choosing:

1. The user's current explicit instruction.
2. Accepted feature specs and accepted ADRs.
3. `MaliktBoard_Complete_MVP_Master_Build_Prompt.md`.
4. Base specs in `specs/base/`.
5. Existing implementation and older documentation.

Implementation is evidence, not a requirement. A mismatch must be recorded in `docs/TRACEABILITY.md` or an ADR.

## Mandatory workflow

1. Classify the change using `docs/CHANGE_CONTROL.md`.
2. Confirm a ready, accepted spec exists before changing product behavior.
3. Work only on acceptance criteria listed in the active spec.
4. Add or update tests that prove each applicable criterion.
5. Run `npm run spec:check` and the risk-tier verification commands.
6. Record evidence and update traceability/progress before declaring completion.
7. Require human browser acceptance for user-visible behavior.

Agents must not invent adjacent features, silently alter requirements, weaken security to make tests pass, perform unrelated refactors, or mark work done with failing/skipped required checks.

## Architecture guardrails

- Domain rules remain independent of React, transport, persistence, and vendors.
- Dependencies point inward: UI/adapters -> application services -> domain.
- Use ports/adapters at volatile or security-sensitive boundaries, not for ceremony.
- Keep invariants and transactions in the service/domain layer, never only in UI code.
- Prefer simple functions and modules. Introduce classes only when identity, lifecycle, polymorphism, or a framework contract makes them useful.
- Apply SOLID as review heuristics, not as a quota for abstractions.
- Cross-tenant and authorization checks are server-side and deny by default.
- Any architecture exception requires an accepted ADR.

## Efficient context use

Read `docs/PROGRESS.md`, the active spec, its linked base sections/ADRs, and affected code. Do not repeatedly ingest the full master prompt when requirement IDs and links provide sufficient context. Use the smallest risk tier that is honest; do not split one behavioral change into fake micro-changes to avoid review.

## Git safety

- Start from a named issue/spec ID and use a focused branch.
- Never combine unrelated behavior in one commit or PR.
- Do not rewrite shared history, force-push, bypass protected checks, commit secrets, or commit generated runtime data.
- Human review owns acceptance, architecture decisions, destructive migrations, production rollout, and rollback authorization.
