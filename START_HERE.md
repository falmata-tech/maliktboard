# Start Here

## Test the product immediately

```bash
npm ci
npm run seed:reset
npm run dev
```

Open `http://localhost:3000`.

### Demo credentials

| Role | Login | Password |
|---|---|---|
| Platform administrator | `admin@maliktboard.local` | `Admin123!` |
| Company owner | `owner@bluenile.local` | `Owner123!` |
| Supervisor | `supervisor@bluenile.local` | `Supervisor123!` |
| Location-scoped Team Member | `team@bluenile.local` | `Team123!` |
| Read-only viewer | `viewer@bluenile.local` | `Viewer123!` |
| Customer | `customer@example.com` | `Customer123!` |

Tracking demonstration:

- Tracking number: `MB-104829`
- Matching phone: `+251911300400`
- Tracking token path: `/t/demo-track-blue-nile`
- Owner authorization path: `/owner/demo-owner-blue-nile`
- Delivery PIN: `482913`
- Shipment QR identifier: `demo-shipment-qr`
- Dispatch Batch QR identifier: `demo-batch-qr`

## Android field use

1. Sign in from Android Chrome.
2. Open `/mobile`.
3. Choose **Add to Home screen** or **Install app**.
4. Allow camera access.
5. Scan QR labels or use the human-readable identifier if camera scanning is unavailable.

The scanner queues receipt, pairing, and batch actions when a network request fails. Proof-of-delivery uploads require a live connection in this release.

## Before a live pilot

1. Generate `.env.production` with `npm run setup:production -- https://your-domain`.
2. Add a verified Resend API key and sender domain.
3. Deploy behind HTTPS.
4. Log in with the generated platform-admin account and immediately change its password at `/account`.
5. Create the delivery company, owner, locations, Route Legs, and team assignments.
6. Test one complete shipment with non-sensitive test data.
7. Configure daily backups and test restoration.
8. Review `/api/health`; no development-secret or demo-data warning may remain.
