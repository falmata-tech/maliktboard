# Security Model

`docs/SECURITY.md` describes current controls. This document defines change-time requirements.

- Deny by default; authorize server-side using actor, tenant, role, and operational scope.
- Treat all client input, IDs, files, QR values, forwarded headers, and offline actions as untrusted.
- Do not expose whether a cross-tenant identifier exists.
- Hash authentication/PIN lookup secrets; encrypt only retrievable secrets with managed rotation.
- Keep sensitive evidence private and log privileged access.
- Protect mutations against CSRF, replay, duplicate execution, and confused-deputy behavior.
- Validate file type, size, ownership, storage path, and download authorization.
- Threat-model every Tier 3 change and any auth, tenancy, evidence, token, payment, or deployment change.
- Never reduce a control merely to satisfy a test or development proxy; document scoped exceptions.

Security acceptance must include positive access, forbidden access, cross-tenant attempts, malformed input, and audit evidence.
