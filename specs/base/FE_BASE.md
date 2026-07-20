---
id: FE_BASE
title: Frontend base specification
status: accepted
owner: product-owner
related: [BE_BASE, DEP_BASE]
---

# Frontend Base

The frontend exposes role-appropriate operational, customer, public, admin, and field experiences without owning business authorization or state transitions.

Feature specs must define routes, users, responsive behavior, accessibility, localization, loading/empty/error/offline states, form validation, analytics/telemetry, and browser acceptance. Never use hidden controls as the sole permission boundary. Mutations consume explicit backend contracts and show authoritative outcomes.

Required UI evidence for visible changes: desktop and mobile browser acceptance, keyboard path, error state, and screenshots when visual comparison matters.
