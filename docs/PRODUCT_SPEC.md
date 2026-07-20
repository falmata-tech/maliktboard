# Product Specification

## Authority and scope

The authoritative product baseline is `MaliktBoard_Complete_MVP_Master_Build_Prompt.md`. This document is its navigation layer, not a replacement. Product behavior may change only through an accepted feature spec and, when the baseline changes, explicit human approval recorded in an ADR.

## Product outcome

MaliktBoard is a strict multi-tenant domestic-delivery operations platform. One shipment represents one physical package. A shipment moves through a company-owned journey plan and compatible Dispatch Batches, with secure customer tracking, controlled evidence, delivery authorization, notifications, auditability, and field scanning.

## Immutable MVP boundaries

- No public company marketplace or company-to-company transfer.
- No Driver entity/role, fleet system, live GPS, online payment, SMS, international shipping, or multi-package request.
- Tenant records and customer evidence must never cross authorization boundaries.
- Customer-visible state stays simpler than internal operational state.

## Requirement identification

Master-prompt sections are baseline requirement groups (`MP-01` through `MP-50`). Implementable behavior is defined in linked FE/BE/DEP feature specs. `docs/TRACEABILITY.md` maps each active feature to source, code, tests, and evidence.

## Product acceptance

A feature is not accepted because a page renders or code compiles. It must satisfy its approved scenarios, security and accessibility criteria, required automated checks, observability/rollback needs, and human browser acceptance where applicable.
