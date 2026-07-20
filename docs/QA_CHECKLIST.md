# QA Checklist

## Definition of Ready

- [ ] Stable spec ID, owner, risk tier, status `accepted`
- [ ] Problem, users, scope, non-goals, assumptions, and source requirement
- [ ] GIVEN/WHEN/THEN happy, failure, permission, and boundary scenarios
- [ ] FE/BE/DEP contracts cross-linked where affected
- [ ] Data, security, accessibility, observability, rollout, rollback, and migration addressed or marked N/A with reason
- [ ] Test plan maps to every acceptance criterion
- [ ] Human has resolved open product/architecture decisions

## Definition of Done

- [ ] No behavior outside accepted scope
- [ ] Acceptance criteria mapped to automated or human evidence
- [ ] Focused and regression tests pass; no unjustified skips
- [ ] Typecheck/build/lint/security checks required by tier pass
- [ ] Authorization and tenant-negative tests pass when applicable
- [ ] Keyboard, responsive, error, empty, loading, and localization states checked for UI work
- [ ] Logs/metrics/audit and support runbook updated when applicable
- [ ] Migration, backup, rollback, and deployment rehearsal completed when applicable
- [ ] Traceability, decisions, progress, and docs updated
- [ ] Human browser acceptance recorded for visible behavior
- [ ] Human review confirms the feature is usable, not merely technically functional

A waiver must name the failed gate, risk, owner, expiry/remediation spec, and human approver.
