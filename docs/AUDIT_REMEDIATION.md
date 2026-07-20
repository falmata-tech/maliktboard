# Audit Remediation Summary

The rebuild addresses the earlier audit blockers as follows:

- Browser `localStorage` operational state was replaced with a shared server database.
- Public `/app` and `/admin` access was replaced with authenticated sessions and protected server layouts.
- Client-side tenant filtering was replaced with company-scoped SQL, composite same-company foreign keys, server permissions, and location scope.
- Plaintext public Delivery PIN exposure was removed. PINs are hashed, owner links are private, and failed attempts are durable and rate-limited.
- Quote, activation, shipment, journey, batch, and delivery state changes now execute in transactions with idempotency and transition validation.
- One request is enforced as one shipment through both code and a unique database constraint.
- Batch movement skips blocked shipment states and closure rejects unresolved continuing shipments.
- Real package and delivery evidence uploads replaced the fake file-string field.
- Customer quote acceptance uses a private customer route rather than a company-side demo button.
- The camera shell was replaced for launch by an installable authenticated scanner PWA with QR resolution, location scope, bulk actions, pairing, and offline action queuing.
- Unicode SVG/print labels replaced WinAnsi PDF generation, supporting Ethiopic and Latin scripts without exposing full phone numbers.
- Email and in-app notification records are deduplicated; a worker sends queued email through Resend.
- Regression tests cover the reproduced audit failures.
