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

- [ ] Human acceptance for authorization and tenant security boundaries (`BE-001`; automated gates pass)
- [ ] Verify portable quality CI on GitHub and enable required checks (`DEP-001`; local gate passed)
- [ ] Codespaces proxy repair awaiting human browser acceptance (`DEP-002`)
- [ ] Human browser baseline run `BA-2026-07-20-01`
- [ ] Verify agent-owned browser suite in hosted CI/Browserbase (`DEP-003`; 6/6 local passed, Browserbase unavailable)

## Next, in order

- [ ] Complete `BE-001` negative security verification and record any repair specs
- [ ] Human acceptance for service-level authorization repair (`BE-002`; implementation and automated gates pass)
- [ ] Human browser baseline and defect capture
- [ ] Prioritized, accepted repair specs

## Active implementation

None. `BE-001` and `BE-002` are at human acceptance; no additional implementation is authorized.
