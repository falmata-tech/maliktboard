# Traceability Matrix

This is the single index from intent to evidence. Feature rows are added before implementation and completed before done.

| Capability/change | Source | FE spec | BE spec | DEP spec | ADR | Code | Tests/evidence | Status |
|---|---|---|---|---|---|---|---|---|
| Baseline MVP | MP-01..MP-50 | TBD | TBD | TBD | ADR-001 accepted pilot exception | Existing repository | `docs/MASTER_PROMPT_COMPLIANCE.md`; browser evidence pending | audited-partial |
| Spec workflow | User request, SpecDevs guide | N/A | N/A | N/A | N/A | `AGENTS.md`, `scripts/check-specs.mjs`, `.github/workflows/spec-guard.yml` | `npm run spec:check`; human accepted 2026-07-20 | done |
| Portable PR quality gate | MP-05, MP-46, MP-49 | N/A | N/A | DEP-001 | N/A | `.github/workflows/quality.yml`, portable `package-lock.json` | Local immutable install/full gate and negative spec check passed; hosted run pending | verifying |
| Codespaces Server Actions compatibility | Defect report 2026-07-20 | N/A | N/A | DEP-002 | N/A | `apps/web/next.config.ts` | Proxy HTTP 303, tests/typecheck/build; browser retest pending | human-acceptance |
| Agent-owned browser testing | Product-owner instruction 2026-07-20 | FE_BASE | N/A | DEP-003 | N/A | Not implemented | Local pending; Browserbase blocked/unavailable | accepted |

Allowed statuses: `proposed`, `clarified`, `ready`, `accepted`, `implementing`, `verifying`, `human-acceptance`, `done`, `blocked`, `deferred`.
