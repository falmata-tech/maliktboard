---
id: BE_BASE
title: Backend base specification
status: accepted
owner: product-owner
related: [FE_BASE, DEP_BASE]
---

# Backend Base

Backend changes use application services around domain invariants with ports for persistence, storage, notifications, and other volatile boundaries. Contracts define validated input, output, errors, authorization, tenant scope, transaction boundary, idempotency, concurrency, audit/event effects, privacy, and observability.

Feature specs use GIVEN/WHEN/THEN for behavior and separate contract tables for technical interfaces. Domain code remains framework-independent. Negative authorization and tenant-isolation scenarios are mandatory for protected resources.
