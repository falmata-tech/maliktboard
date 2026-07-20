# Contributing to MaliktBoard

## Branch and commit workflow

1. Start with an accepted spec ID.
2. Branch as `feat/FE-001-short-name`, `fix/BE-001-short-name`, or `chore/TIER0-short-name`.
3. Keep commits reviewable and reference the spec: `BE-001: enforce batch eligibility`.
4. Rebase/update before review; never force-push shared protected branches.
5. Open a PR using the repository template. Required checks and human review must pass.
6. Prefer squash merge for one coherent change; retain ADR/migration commits when their history is operationally valuable.

Direct pushes to `main`, self-approval, skipped checks, secret commits, generated database/uploads, and unrelated refactors are prohibited. Configure GitHub branch protection to require pull requests, one human approval, conversation resolution, current branch, spec guard, tests, typecheck, build, and security/dependency checks.

Emergency changes still need an incident ID, smallest possible patch, rollback plan, approval, and a retrospective spec within one business day.
