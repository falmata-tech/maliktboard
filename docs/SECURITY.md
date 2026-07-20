# Security Model

- All operational records are stored server-side. The browser receives only records authorized for the current user and company.
- Sessions are opaque random values in Secure, HttpOnly, SameSite=Lax cookies; only hashes are used for lookup.
- Passwords and Delivery PINs use scrypt hashes.
- Retrievable QR, tracking, quote, and owner tokens are encrypted with AES-256-GCM and separately indexed by SHA-256 hashes.
- Delivery PINs never appear on public tracking. Only the private owner link and authenticated owner portal reveal the PIN.
- Failed PIN attempts persist outside failed delivery transactions and are rate-limited.
- Login failures are rate-limited by normalized identifier.
- Cross-company foreign keys use composite keys for locations, routes, customers, shipments, and batches.
- Role and location scope are checked in server-side services. Team Members receive only relevant operational records.
- Government-ID evidence is private and limited to Owner, Admin, and Supervisor roles. Public tracking can retrieve only approved, non-sensitive evidence.
- Customer-visible events and notifications use idempotency keys.
- Supervisor-only overrides require reasons and produce audit records.

## Launch requirements

- Replace every generated secret only through a controlled rotation process.
- Use HTTPS.
- Disable demo seeding.
- Use unique staff accounts; do not share passwords.
- Change temporary passwords immediately.
- Restrict host and data-volume access.
- Back up and encrypt the database and evidence files.
- Follow applicable privacy, retention, identity-document, and delivery regulations in the launch country.

This MVP does not claim formal compliance certification. Obtain a local legal/privacy review before storing government identification at scale.
