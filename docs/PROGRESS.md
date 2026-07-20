# Progress Ledger

## Current phase

Phase 0: establish spec-driven control before product repair or feature work.

## Completed

- [x] Master prompt preserved as baseline authority
- [x] Existing implementation and documentation audited at a high level
- [x] Risk-tiered change control and acceptance gates defined
- [x] Time-bounded pilot architecture accepted in ADR-001
- [x] Human accepted the spec-driven workflow
- [x] Static master-prompt compliance matrix completed

## In progress

- [ ] Verify authorization and tenant security boundaries (`BE-001`; 6/6 focused scenarios pass, BE-002 finding open)
- [ ] Verify portable quality CI on GitHub and enable required checks (`DEP-001`; local gate passed)
- [ ] Codespaces proxy repair awaiting human browser acceptance (`DEP-002`)
- [ ] Human browser baseline run `BA-2026-07-20-01`
- [ ] Verify agent-owned browser suite in hosted CI/Browserbase (`DEP-003`; 6/6 local passed, Browserbase unavailable)

## Next, in order

- [ ] Complete `BE-001` negative security verification and record any repair specs
- [ ] Clarify and accept or defer service-level authorization repair (`BE-002`; proposed from BE-001 finding)
- [ ] Human browser baseline and defect capture
- [ ] Prioritized, accepted repair specs

## Active implementation

`BE-001` is accepted for tests and verification only. `BE-002` records the discovered service authorization gap but is not authorized for implementation.
