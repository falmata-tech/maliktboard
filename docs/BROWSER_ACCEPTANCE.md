# Browser Acceptance Ledger

## Run BA-2026-07-20-01

- Environment: GitHub Codespaces development server, port 3000
- Forwarded URL: `https://upgraded-guide-6rjxrwg4vv7c4pjr-3000.app.github.dev`
- Data: seeded demonstration data only
- Agent evidence: DEP-003 local Chromium suite passed 6/6 desktop/mobile scenarios; Browserbase unavailable
- Human focus: subjective clarity, trust, visual quality, real-device behavior, and final acceptance—not repetition of deterministic checks
- Human owner: product owner
- Overall status: pending

### Agent rerun after BE-002

- Non-destructive live-server Chromium subset: 5/5 passed (tracking privacy, owner/scanner resolution, role destinations/redirects, mobile public accessibility/localization, and mobile login/scanner layout).
- Destructive public-request scenario: intentionally excluded to preserve the product owner's active demo data; previously passed in the isolated 6/6 suite.
- Browserbase: unavailable in the current environment; not simulated.
- Human acceptance remains required for the scenarios below.

### Agent rerun after FE-001

- Isolated Chromium suite: 6/6 passed against a fresh synthetic database.
- Public request file upload reached the quote page; React emitted no form-encoding warning.
- Production build, typecheck, 20/20 unit/integration tests, and spec guard passed.
- Human focus: submit a synthetic request photo and report any visible error or `Invalid Server Actions request` message.

Do not use real customer, identity, payment, or evidence data in this run. Record each result as `pass`, `fail`, or `blocked`; include route, role, browser/device, action, expected result, actual result, and screenshot when useful.

## Required scenarios

| ID | Area and role | Human acceptance action | Result |
|---|---|---|---|
| BA-01 | Public, anonymous | Open `/c/bluenile`; inspect desktop/mobile layout, language links, locations, contact, tracking and request CTAs. | pending |
| BA-02 | Public request | Submit one non-sensitive package request with a test image; confirm useful validation and success behavior. | pending |
| BA-03 | Tracking fallback | At `/track`, use `MB-104829` and `+251911300400`; confirm the correct private tracking destination. | pending |
| BA-04 | Secure tracking/owner | Compare `/t/demo-track-blue-nile` with `/owner/demo-owner-blue-nile`; confirm public tracking exposes no PIN/private ID/phone and owner page shows authorization appropriately. | pending |
| BA-05 | Authentication | Sign in and out with the documented Owner account; confirm no `Invalid Server Actions request` error. | pending |
| BA-06 | Owner workspace | Inspect dashboard, requests, shipments, batches, network, team, customers, settings and analytics; record dead controls, confusing wording, layout or missing states. | pending |
| BA-07 | Supervisor | Sign in as Supervisor; confirm operational actions work while owner-only controls remain unavailable. | pending |
| BA-08 | Team Member scope | Sign in as Team Member; confirm only assigned-location work is visible and privileged pages/actions are inaccessible. | pending |
| BA-09 | Viewer | Sign in as Viewer; confirm authorized records are readable and mutations are unavailable/rejected. | pending |
| BA-10 | Customer | Sign in as Customer; confirm connected shipments and owner-vs-participant privacy are understandable and correct. | pending |
| BA-11 | Platform admin | Sign in as Platform Administrator; inspect company creation/status/usage/contract views and confirm company workspace membership is not implied. | pending |
| BA-12 | Labels | As authorized staff, open shipment and batch 4x6 labels; inspect Unicode, privacy, route clarity and print preview. | pending |
| BA-13 | Scanner | On Android Chrome if available, open `/mobile`, resolve `demo-shipment-qr` and `demo-batch-qr`, inspect camera/manual paths, install prompt and offline messaging without changing production data. | pending |
| BA-14 | Cross-cutting UX | Check keyboard navigation, visible focus, zoom, narrow viewport, loading/error/empty states, English/Amharic/Afaan Oromo text, and plain-language recovery. | pending |

## Demo accounts

| Role | Login | Password |
|---|---|---|
| Platform administrator | `admin@maliktboard.local` | `Admin123!` |
| Company owner | `owner@bluenile.local` | `Owner123!` |
| Supervisor | `supervisor@bluenile.local` | `Supervisor123!` |
| Team Member | `team@bluenile.local` | `Team123!` |
| Viewer | `viewer@bluenile.local` | `Viewer123!` |
| Customer | `customer@example.com` | `Customer123!` |

## Exit rule

Browser baseline completes only when every scenario has a human result and each failure has a proposed FE/BE/DEP defect spec with severity and reproduction. A failed scenario does not authorize an immediate code change.
