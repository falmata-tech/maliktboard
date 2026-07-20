---
id: DEP_BASE
title: Deployment base specification
status: accepted
owner: product-owner
related: [FE_BASE, BE_BASE]
---

# Deployment Base

Deployment is a product layer, not an afterthought. Specs cover environments, secret/config ownership, build provenance, CI gates, migrations, storage durability, backups/restores, health/readiness, logs/metrics/alerts, capacity, security headers/TLS, staged rollout, rollback, incident response, and post-deploy verification.

Production changes are Tier 3. They require human authorization, a reversible plan, evidence from a production-like environment, and explicit ownership. The current supported topology remains defined in `docs/DEPLOYMENT.md` until ADR-001 is accepted.
