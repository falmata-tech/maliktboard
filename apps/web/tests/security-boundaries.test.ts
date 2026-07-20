import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { hasPermission } from "@maliktboard/domain";

test("authorization and tenant security boundaries", async (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "maliktboard-security-"));
  process.env.DATABASE_PATH = path.join(temp, "security.db");
  process.env.UPLOAD_DIR = path.join(temp, "uploads");
  process.env.SEED_DEMO = "true";
  process.env.PIN_ENCRYPTION_KEY = "security-boundary-test-key";

  const services = await import("../lib/services");
  const { getDb } = await import("../lib/db");
  const { encryptSecret, sha256 } = await import("../lib/crypto");
  const db = getDb();
  const actor = (input: {
    userId: string;
    memberId: string;
    companyId: string;
    companyName: string;
    handle: string;
    role: "OWNER" | "ADMIN" | "SUPERVISOR" | "TEAM_MEMBER" | "VIEWER";
    locations: string[];
  }): any => ({
    user: { id: input.userId, name: "Security test actor", email: null, phone: null, platformRole: "NONE", locale: "en" },
    memberId: input.memberId,
    companyId: input.companyId,
    companyName: input.companyName,
    companyHandle: input.handle,
    companyStatus: "ACTIVE",
    role: input.role,
    locationIds: input.locations,
  });
  const oromiaOwner = actor({
    userId: "usr_owner2", memberId: "mem_owner2", companyId: "cmp_oromia",
    companyName: "Oromiya Express", handle: "oromiyaexpress", role: "OWNER",
    locations: ["loc_adama", "loc_jimma"],
  });
  const hawassaTeam = actor({
    userId: "usr_team", memberId: "mem_team", companyId: "cmp_blue",
    companyName: "Blue Nile Delivery", handle: "bluenile", role: "TEAM_MEMBER",
    locations: ["loc_hawassa"],
  });

  await t.test("foreign tenant identifiers disclose nothing and cannot mutate", () => {
    const before = db.prepare(`SELECT state,version FROM shipments WHERE id='shp_demo'`).get();
    const eventCount = (db.prepare(`SELECT COUNT(*) count FROM shipment_events WHERE shipment_id='shp_demo'`).get() as any).count;

    assert.equal(services.getShipmentForMember(oromiaOwner, "shp_demo") == null, true);
    assert.equal(services.getBatchForMember(oromiaOwner, "bat_demo") == null, true);
    assert.equal(services.getEvidenceForRequest(oromiaOwner, "req_active") == null, true);
    assert.throws(() => services.receiveShipment(oromiaOwner, "shp_demo", "foreign-tenant-receive"), /not found/i);

    assert.deepEqual(db.prepare(`SELECT state,version FROM shipments WHERE id='shp_demo'`).get(), before);
    assert.equal((db.prepare(`SELECT COUNT(*) count FROM shipment_events WHERE shipment_id='shp_demo'`).get() as any).count, eventCount);
    assert.equal((db.prepare(`SELECT COUNT(*) count FROM audit_logs WHERE company_id='cmp_oromia' AND entity_id='shp_demo'`).get() as any).count, 0);
  });

  await t.test("team location scope denies an out-of-scope shipment and label", () => {
    assert.throws(() => services.getShipmentForMember(hawassaTeam, "shp_demo"), /outside your assigned location scope/i);
    assert.throws(() => services.getLabelData(hawassaTeam, "shipment", "shp_demo"), /outside your assigned location scope/i);
  });

  await t.test("role capability matrix denies viewer and limits team member mutations", () => {
    assert.equal(hasPermission("VIEWER", "READ_ONLY"), true);
    assert.equal(hasPermission("VIEWER", "SHIPMENT_UPDATE"), false);
    assert.equal(hasPermission("VIEWER", "PAYMENT_MANAGE"), false);
    assert.equal(hasPermission("TEAM_MEMBER", "SHIPMENT_UPDATE"), true);
    assert.equal(hasPermission("TEAM_MEMBER", "BATCH_UPDATE"), true);
    assert.equal(hasPermission("TEAM_MEMBER", "QUOTE_ISSUE"), false);
    assert.equal(hasPermission("TEAM_MEMBER", "EVIDENCE_VIEW_SENSITIVE"), false);
    assert.equal(hasPermission("SUPERVISOR", "EVIDENCE_VIEW_SENSITIVE"), true);
  });

  await t.test("QR identifiers are tenant-bound and revoked identifiers fail closed", () => {
    assert.equal(services.resolveQr(oromiaOwner, "demo-shipment-qr"), null);
    assert.equal(services.resolveQr(hawassaTeam, "not-a-real-qr-token"), null);
    assert.deepEqual(services.resolveQr(hawassaTeam, "demo-shipment-qr"), {
      type: "SHIPMENT", id: "shp_demo", label: "MB-104829",
    });
    db.prepare(`UPDATE access_tokens SET revoked_at=? WHERE entity_type='QR_SHIPMENT' AND entity_id='shp_demo'`).run(new Date().toISOString());
    assert.equal(services.resolveQr(hawassaTeam, "demo-shipment-qr"), null);
  });

  await t.test("tracking tokens reject invalid, expired, and revoked values", () => {
    assert.equal(services.publicTracking("invalid-tracking-token"), null);
    assert.equal(services.publicTracking("demo-track-blue-nile")?.id, "shp_demo");

    const expired = "expired-tracking-token";
    db.prepare(`INSERT INTO access_tokens (id,company_id,entity_type,entity_id,token_hash,token_cipher,expires_at,created_at) VALUES (?,?,?,?,?,?,?,?)`)
      .run("tok_expired_test", "cmp_blue", "TRACKING", "shp_demo", sha256(expired), encryptSecret(expired), new Date(Date.now() - 60_000).toISOString(), new Date().toISOString());
    assert.equal(services.publicTracking(expired), null);

    db.prepare(`UPDATE access_tokens SET revoked_at=? WHERE entity_type='TRACKING' AND entity_id='shp_demo' AND token_hash=?`)
      .run(new Date().toISOString(), sha256("demo-track-blue-nile"));
    assert.equal(services.publicTracking("demo-track-blue-nile"), null);
  });

  await t.test("public tracking exposes only customer-visible non-sensitive evidence", () => {
    const created = new Date().toISOString();
    const insert = db.prepare(`INSERT INTO evidence_files (id,company_id,shipment_id,event_id,category,storage_path,original_name,mime_type,customer_visible,sensitive,uploaded_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
    insert.run("evi_public_test", "cmp_blue", "shp_demo", "evt_received", "PROOF_OF_DELIVERY", "evidence/public.jpg", "public.jpg", "image/jpeg", 1, 0, "usr_supervisor", created);
    insert.run("evi_private_test", "cmp_blue", "shp_demo", "evt_received", "OTHER", "evidence/private.jpg", "private.jpg", "image/jpeg", 0, 0, "usr_supervisor", created);
    insert.run("evi_sensitive_test", "cmp_blue", "shp_demo", "evt_received", "RECEIVER_ID", "evidence/id.jpg", "id.jpg", "image/jpeg", 1, 1, "usr_supervisor", created);

    const raw = "fresh-tracking-token";
    db.prepare(`INSERT INTO access_tokens (id,company_id,entity_type,entity_id,token_hash,token_cipher,created_at) VALUES (?,?,?,?,?,?,?)`)
      .run("tok_fresh_test", "cmp_blue", "TRACKING", "shp_demo", sha256(raw), encryptSecret(raw), created);
    const result = services.publicTracking(raw);
    assert.deepEqual(result.evidence.map((item: any) => item.id), ["evi_public_test"]);
    assert.equal(JSON.stringify(result).includes("evidence/private.jpg"), false);
    assert.equal(JSON.stringify(result).includes("evidence/id.jpg"), false);
  });

  fs.rmSync(temp, { recursive: true, force: true });
});
