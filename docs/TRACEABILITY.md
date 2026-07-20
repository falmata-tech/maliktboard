# Traceability Matrix

This is the single index from intent to evidence. Feature rows are added before implementation and completed before done.

| Capability/change | Source | FE spec | BE spec | DEP spec | ADR | Code | Tests/evidence | Status |
|---|---|---|---|---|---|---|---|---|
| Baseline MVP | MP-01..MP-50 | TBD | TBD | TBD | ADR-001 accepted pilot exception | Existing repository | `docs/MASTER_PROMPT_COMPLIANCE.md`; browser evidence pending | audited-partial |
| Spec workflow | User request, SpecDevs guide | N/A | N/A | N/A | N/A | `AGENTS.md`, `scripts/check-specs.mjs`, `.github/workflows/spec-guard.yml` | `npm run spec:check`; human accepted 2026-07-20 | done |
| Portable PR quality gate | MP-05, MP-46, MP-49 | N/A | N/A | DEP-001 | N/A | `.github/workflows/quality.yml`, portable `package-lock.json` | Local immutable install/full gate and negative spec check passed; hosted run pending | verifying |
| Codespaces Server Actions compatibility | Defect report 2026-07-20 | N/A | N/A | DEP-002 | N/A | `apps/web/next.config.ts` | Proxy HTTP 303, tests/typecheck/build; browser retest pending | human-acceptance |
| Agent-owned browser testing | Product-owner instruction 2026-07-20 | FE_BASE | N/A | DEP-003 | N/A | `playwright.config.ts`, `apps/web/e2e`, CI quality workflow | 6/6 local desktop/mobile scenarios passed; Browserbase blocked/unavailable; hosted run pending | verifying |
| Authorization and tenant boundary verification | MP-06, MP-07, MP-13, MP-35, MP-47, MP-49; product-owner instruction | N/A | BE-001 | DEP-001, DEP-003 | ADR-001 | `apps/web/tests/security-boundaries.test.ts` | 6/6 focused security scenarios pass; 13/13 web tests pass; BE-002 finding open | verifying |
| Application-service authorization enforcement | BE-001 finding; architecture contract | N/A | BE-002 | DEP-001, DEP-003 | ADR-001 | Not implemented | Accepted threat/scope boundary; direct-service negative tests pending | accepted |
| Server Action upload-form warning | DEP-003 browser evidence | FE-001 | N/A | N/A | N/A | Not implemented | Warning reproduced in local Chromium run | proposed |

Allowed statuses: `proposed`, `clarified`, `ready`, `accepted`, `implementing`, `verifying`, `human-acceptance`, `done`, `blocked`, `deferred`.
