# Implementation Plan

## Phase 0 — establish control

- Maintain the required documentation set and automated spec validation.
- Complete browser-based baseline testing and record reproducible defects.
- Build the MP-01..MP-50 compliance matrix.
- Resolve `ADR-001` before architecture-dependent feature planning.

## Per-change execution

1. Create and clarify specs from an observed problem or baseline requirement.
2. Review Definition of Ready; human changes status to `accepted`.
3. Add failing tests or a reproducible check for the accepted behavior.
4. Implement only the accepted criteria in the smallest coherent change.
5. Run focused checks, then required regression/security/spec checks.
6. Collect browser/API/deployment evidence as applicable.
7. Human accepts or returns the change; update traceability and progress.

No implementation phase may use a release note or existing code as proof that a master-prompt requirement was intentionally changed.
