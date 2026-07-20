# Master Prompt Compliance Baseline

Audit date: 2026-07-20

Baseline: `MaliktBoard_Complete_MVP_Master_Build_Prompt.md`

Evidence reviewed: schema, domain package, services/actions, routes/components, tests, scripts, and current documentation.

This is a static compliance audit, not browser acceptance or production certification. `Conforms` means the section's material requirements have direct evidence. `Partial` means useful implementation exists but required behavior or proof is missing. `Nonconforming` means the implementation deliberately or materially contradicts the baseline. `Unverified` means runtime/human evidence is still required.

## Executive result

The repository is a substantial functional pilot, not the master-prompt-complete MVP. Core request, quote, shipment, journey, Dispatch Batch, tracking, PIN, evidence, notification, label, and scanner paths exist. The largest blockers are the unapproved platform/mobile architecture substitution, incomplete tenant-defense model relative to PostgreSQL RLS, incomplete configuration models, limited automated coverage, partial localization/offline behavior, missing manual journey editing, and absent browser acceptance.

## Section matrix

| ID | Requirement group | Status | Evidence and material gap |
|---|---|---|---|
| MP-01 | Product vision | Partial | Company workspaces and branded public paths exist; full production and browser acceptance do not. |
| MP-02 | Core product model | Conforms | Schema models company, request, shipment, journey steps, Route Legs, batches, and membership. |
| MP-03 | Terminology | Conforms | UI/domain consistently use Shipment, Route Leg, Journey Plan/Step, and Dispatch Batch. |
| MP-04 | MVP boundaries | Partial | Most included workflows exist and prohibited marketplace/driver/fleet/payment/GPS features are absent; several mandatory inclusions remain partial below. |
| MP-05 | Technology stack | Nonconforming | Uses SQLite/custom auth/local storage/scanner PWA instead of PostgreSQL/Supabase/RLS/Storage/Expo; decision pending in ADR-001. |
| MP-06 | Documentation before implementation | Partial | Required documents now exist, but were created after implementation; compliance and decision history are being reconstructed. |
| MP-07 | Multi-tenant security | Nonconforming | Composite company keys and service checks exist; mandated PostgreSQL RLS is absent and isolation coverage is insufficient. |
| MP-08 | Users and roles | Partial | Platform admin, five company roles, customer/guest flows exist; support impersonation and several granular assignments are absent. |
| MP-09 | Public pages and handles | Partial | Unique handles, colors, story, CTA, locations, and three hero styles exist; logo/favicon/cover, typography, social links, hours, section ordering and richer template controls are absent. |
| MP-10 | Company locations | Partial | Name/code/city/area/phone/capabilities/visibility exist; descriptions, region, coordinates, hours, and fuller capability administration are absent. |
| MP-11 | Team assignment | Partial | Location assignment and scoped reads exist; Route Leg, batch, and shipment assignment models are absent. |
| MP-12 | Route network | Partial | Tenant-safe origin/destination, duration, priority, labels, and active status exist; services, schedules, instructions, evidence rules, and assignments are absent. |
| MP-13 | First/final mile | Partial | Pickup/drop-off and collection/delivery with free-text areas exist; map pins/coordinates/instructions and richer dynamic endpoints are absent. |
| MP-14 | Automatic journey planning | Partial | Tenant-filtered shortest route plus pickup/final steps exists; priority/duration semantics and manual add/remove/reorder/replace/confirm UI are incomplete. |
| MP-15 | Shipment request workflow | Partial | Public one-package request/photo and staff quote/activation exist; all review/edit/reject/expiry paths need verification or UI completion. |
| MP-16 | Request/quote state machine | Partial | Explicit domain states and core acceptance/activation guards exist; expiry and every transition are not comprehensively automated or exposed. |
| MP-17 | Preliminary/final pricing | Partial | Quote and manual payment records exist; final-price adjustment/refund/waiver coverage and audit proof are incomplete. |
| MP-18 | Shipment record | Partial | Core parties, labels, pricing, status, journey, tokens, and timestamps exist; several assignment/service/address metadata fields are absent. |
| MP-19 | Shipment operational status | Conforms | Required operational states are represented in the domain/schema with guarded movement paths. |
| MP-20 | Journey step status | Conforms | Required step statuses and ordered step persistence exist. |
| MP-21 | Dispatch Batch lifecycle | Partial | Draft/open/sealed/dispatched/arrived/closed transitions exist; reopen/override edge behavior lacks complete proof. |
| MP-22 | Batch membership rules | Partial | Compatibility and one-active-batch constraint exist; every removal/exception/concurrency rule lacks coverage. |
| MP-23 | Batch bulk updates | Partial | Transactional departure/arrival bulk updates and idempotency exist; full mixed-state and failure matrix is untested. |
| MP-24 | Arrival sorting | Partial | Arrival advances eligible journey state and transfer exists; all final/continuing/exception outcomes need verification. |
| MP-25 | Internal events | Partial | Shipment/batch/audit events exist; required-event completeness and immutability guarantees need audit. |
| MP-26 | Customer timeline | Partial | Secure simplified events exist; mapping/localization for every event and exception is incomplete. |
| MP-27 | Evidence | Partial | Private files, categories, sensitivity and authorized download exist; retention/consent/deletion, full evidence rules, and adversarial tests are absent. |
| MP-28 | Delivery authorization | Partial | Hashed/encrypted PIN, owner access, throttling, proof and repeat prevention exist; override/support/recovery paths are incomplete. |
| MP-29 | Customer tracking | Partial | Token, number+phone fallback, owner/customer portal and privacy separation exist; browser/privacy matrix is not complete. |
| MP-30 | Notifications | Partial | Idempotent in-app/email records, worker and provider reference exist; preferences, full event coverage, retries/backoff and delivery monitoring are incomplete. |
| MP-31 | QR codes | Partial | Opaque hashed/encrypted shipment/batch identifiers and resolution exist; rotation/revocation and comprehensive QR tests are incomplete. |
| MP-32 | Shipment label | Partial | Printable 4x6 Unicode SVG route exists; required-field/layout/barcode/privacy validation is incomplete. |
| MP-33 | Batch label | Partial | Printable batch label route exists; required content and printer/browser validation are incomplete. |
| MP-34 | Android-first application | Nonconforming | Installable responsive scanner PWA exists instead of mandated Expo/React Native application; personal analytics are absent. |
| MP-35 | Mobile scanning modes | Partial | Single resolve, pairing/transfer and batch actions exist; rapid continuous mode and explicit mode UX are absent. |
| MP-36 | Offline support | Partial | Browser local queue and idempotency keys exist; automatic replay, auth expiry, ordering/conflicts, corruption/recovery and tests are absent. |
| MP-37 | Web application areas | Partial | Admin, operations, customer portal and public areas exist; breadth and human usability remain incomplete. |
| MP-38 | Company dashboard | Partial | Operational counts and lists exist; exceptions, assignments and actionable drill-down breadth are limited. |
| MP-39 | Platform billing and usage | Partial | Contracts and derived shipment/member totals exist; durable usage records, review workflow and contract management are incomplete. |
| MP-40 | Localization | Partial | Locale foundation and some public strings exist; most operational/customer copy remains hard-coded English and layout/content testing is absent. |
| MP-41 | Recommended data model | Partial | Most core tables exist; assignment, usage, configuration and required field breadth are incomplete, with an unapproved database substitution. |
| MP-42 | Audit requirements | Partial | Audit table and several sensitive actions exist; coverage, privileged evidence access, platform support access and append-only guarantees are incomplete. |
| MP-43 | Supervisor overrides | Partial | Permission concept, reasons and some audited restricted actions exist; reopen/reversal/exception workflows are incomplete. |
| MP-44 | Error handling | Partial | Service errors and flash notices exist; consistent codes, recovery UX, observability, retry semantics and full safe-error tests are absent. |
| MP-45 | Seed data | Conforms | Two companies, roles, locations, routes, requests, shipment, batch and secure demonstration tokens are seeded. |
| MP-46 | Automated tests | Nonconforming | Eleven useful tests pass, but most mandated tenant, batch, QR, offline, evidence, label and delivery scenarios are missing. |
| MP-47 | UX principles | Unverified | Responsive design system exists; keyboard, accessibility, device, localization and human browser acceptance are pending. |
| MP-48 | Implementation phases | Nonconforming | Implementation preceded the required specification/decision workflow and phase evidence was not maintained. |
| MP-49 | Definition of Done | Nonconforming | Build claims exceed available automated/browser/deployment evidence; the new workflow prevents future unsupported completion claims. |
| MP-50 | Engineering instructions | Partial | State machines, transactions and idempotency exist in key paths; completeness, architecture separation and proof remain insufficient. |

## Release blockers before feature prioritization

1. Human decision on ADR-001: mandated Supabase/PostgreSQL/Expo architecture versus a time-bounded pilot exception.
2. Human browser baseline across public, customer, company-role, admin, tracking, label and scanner experiences.
3. Security-focused tenant/permission/evidence test expansion.
4. Accepted specs for each repair; do not implement this matrix as one uncontrolled mega-change.
5. Hosted CI evidence and GitHub branch protection for DEP-001.

## How this matrix changes

Each repair receives FE/BE/DEP specs as applicable. A row moves toward `Conforms` only when traceability links accepted criteria to code, automated evidence, human acceptance, and deployment evidence where required. Scope reduction requires an accepted ADR/product-baseline amendment; current implementation alone cannot change a status.
