import {
  assertBatchTransition,
  assertRequestTransition,
  assertShipmentTransition,
  blockedBatchShipmentStates,
  findBestRoute,
  type BatchState,
  type RequestState,
  type ShipmentState,
} from "@maliktboard/domain";
import { getDb } from "./db";
import { decryptSecret, encryptSecret, hashPin, id, randomPin, randomToken, sha256, verifyPin } from "./crypto";
import { env } from "./env";
import { ensureLocationScope, type MemberContext } from "./auth";
import { deleteUpload, saveUpload } from "./files";

type DB = ReturnType<typeof getDb>;
const now = () => new Date().toISOString();
const bool = (value: unknown) => Boolean(value);
const json = <T>(value: string | null | undefined, fallback: T): T => {
  try { return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
};

function sanitizeText(value: FormDataEntryValue | null, max = 500): string {
  return String(value ?? "").trim().slice(0, max);
}

function required(value: string, label: string): string {
  if (!value) throw new Error(`${label} is required.`);
  return value;
}

function insertToken(db: DB, companyId: string, entityType: string, entityId: string, raw: string, expiresAt: string | null = null): void {
  db.prepare(`INSERT INTO access_tokens (id,company_id,entity_type,entity_id,token_hash,token_cipher,expires_at,created_at) VALUES (?,?,?,?,?,?,?,?)`)
    .run(id("tok"), companyId, entityType, entityId, sha256(raw), encryptSecret(raw), expiresAt, now());
}

function tokenRow(raw: string, type: string): any {
  return getDb().prepare(`SELECT * FROM access_tokens WHERE token_hash=? AND entity_type=? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at>?)`).get(sha256(raw), type, now());
}

function audit(db: DB, ctx: Pick<MemberContext,"companyId"|"user"> | null, action: string, entityType: string, entityId: string | null, reason?: string, before?: unknown, after?: unknown): void {
  db.prepare(`INSERT INTO audit_logs (id,company_id,actor_user_id,action,entity_type,entity_id,reason,before_json,after_json,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(id("aud"), ctx?.companyId ?? null, ctx?.user.id ?? null, action, entityType, entityId, reason ?? null, before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null, now());
}

function queueNotification(db: DB, shipmentId: string, eventId: string, subject: string, body: string): void {
  const target = db.prepare(`SELECT s.company_id,c.user_id,c.email,u.locale FROM shipments s JOIN customers c ON c.id=s.owner_customer_id LEFT JOIN users u ON u.id=c.user_id WHERE s.id=?`).get(shipmentId) as any;
  if (!target) return;
  if (target.user_id) {
    db.prepare(`INSERT OR IGNORE INTO notifications (id,company_id,user_id,shipment_id,event_id,channel,locale,state,subject,body,idempotency_key,created_at,sent_at) VALUES (?,?,?,?,?,'IN_APP',?,'SENT',?,?,?,?,?)`)
      .run(id("not"), target.company_id, target.user_id, shipmentId, eventId, target.locale || "en", subject, body, `inapp:${eventId}:${target.user_id}`, now(), now());
  }
  if (target.email) {
    db.prepare(`INSERT OR IGNORE INTO notifications (id,company_id,shipment_id,event_id,recipient,channel,locale,state,subject,body,idempotency_key,created_at) VALUES (?,?,?,?,?,'EMAIL',?,'PENDING',?,?,?,?)`)
      .run(id("not"), target.company_id, shipmentId, eventId, target.email, target.locale || "en", subject, body, `email:${eventId}:${target.email}`, now());
  }
}

function shipmentEvent(db: DB, input: {
  companyId:string; shipmentId:string; batchId?:string|null; type:string; title:string; description:string;
  locationId?:string|null; customerVisible?:boolean; actorId?:string|null; idempotencyKey:string; metadata?:unknown;
}): string {
  const eventId = id("evt");
  const result = db.prepare(`INSERT OR IGNORE INTO shipment_events (id,company_id,shipment_id,batch_id,event_type,title,description,location_id,customer_visible,actor_user_id,occurred_at,idempotency_key,metadata_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(eventId,input.companyId,input.shipmentId,input.batchId??null,input.type,input.title,input.description,input.locationId??null,input.customerVisible?1:0,input.actorId??null,now(),input.idempotencyKey,JSON.stringify(input.metadata??{}));
  if (result.changes && input.customerVisible) queueNotification(db,input.shipmentId,eventId,input.title,input.description);
  return eventId;
}

export async function deliverPendingEmails(limit = 10): Promise<void> {
  if (!env.resendApiKey) return;
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM notifications WHERE channel='EMAIL' AND state='PENDING' ORDER BY created_at LIMIT ?`).all(limit) as any[];
  for (const item of rows) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method:"POST",
        headers:{Authorization:`Bearer ${env.resendApiKey}`,"Content-Type":"application/json"},
        body:JSON.stringify({from:env.emailFrom,to:[item.recipient],subject:item.subject,html:`<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>${escapeHtml(item.subject)}</h2><p>${emailBodyHtml(item.body)}</p><p><a href="${env.appUrl}">Open MaliktBoard</a></p></div>`}),
      });
      if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
      const payload = await response.json() as {id?:string};
      db.prepare(`UPDATE notifications SET state='SENT',provider_reference=?,sent_at=? WHERE id=?`).run(payload.id??null,now(),item.id);
    } catch (error) {
      db.prepare(`UPDATE notifications SET state='FAILED',failure_reason=? WHERE id=?`).run(error instanceof Error?error.message:"Unknown email error",item.id);
    }
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char] || char));
}

function emailBodyHtml(value: string): string {
  const escaped = escapeHtml(value).replace(/\n/g, "<br/>");
  return escaped.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">Open secure link</a>');
}

export function listCompaniesForAdmin(): any[] {
  return getDb().prepare(`SELECT c.*,b.primary_color,b.hero_style,ct.model contract_model,ct.amount contract_amount,ct.currency contract_currency,
    (SELECT COUNT(*) FROM shipments s WHERE s.company_id=c.id) shipment_count,
    (SELECT COUNT(*) FROM company_members m WHERE m.company_id=c.id AND m.active=1) member_count
    FROM companies c LEFT JOIN company_branding b ON b.company_id=c.id LEFT JOIN company_contracts ct ON ct.company_id=c.id ORDER BY c.created_at DESC`).all() as any[];
}

export function getPublicCompany(handle: string): any | null {
  const db = getDb();
  const company = db.prepare(`SELECT c.*,b.* FROM companies c JOIN company_branding b ON b.company_id=c.id WHERE c.handle=? AND c.status='ACTIVE'`).get(handle) as any;
  if (!company) return null;
  company.locations = db.prepare(`SELECT id,name,code,city,area,phone,capabilities_json FROM locations WHERE company_id=? AND active=1 AND public_visible=1 ORDER BY city,name`).all(company.id).map((row:any)=>({...row,capabilities:json(row.capabilities_json,[])}));
  return company;
}

export async function submitPublicRequest(handle: string, form: FormData): Promise<{requestId:string; quoteToken:string}> {
  const db = getDb();
  const company = db.prepare(`SELECT id FROM companies WHERE handle=? AND status='ACTIVE'`).get(handle) as any;
  if (!company) throw new Error("Delivery company not found.");
  const senderName = required(sanitizeText(form.get("senderName"),120),"Sender name");
  const senderPhone = required(sanitizeText(form.get("senderPhone"),40),"Sender phone");
  const receiverName = required(sanitizeText(form.get("receiverName"),120),"Receiver name");
  const receiverPhone = required(sanitizeText(form.get("receiverPhone"),40),"Receiver phone");
  const ownerRole = sanitizeText(form.get("ownerRole"),20) === "RECEIVER" ? "RECEIVER" : "SENDER";
  const ownerName = ownerRole === "SENDER" ? senderName : receiverName;
  const ownerPhone = ownerRole === "SENDER" ? senderPhone : receiverPhone;
  const ownerEmail = sanitizeText(form.get("ownerEmail"),180) || null;
  const originMode = sanitizeText(form.get("originMode"),20) === "PICKUP" ? "PICKUP" : "DROP_OFF";
  const destinationMode = sanitizeText(form.get("destinationMode"),20) === "DELIVERY" ? "DELIVERY" : "COLLECTION";
  const originLocationId = required(sanitizeText(form.get("originLocationId"),80),"Origin company location");
  const destinationLocationId = required(sanitizeText(form.get("destinationLocationId"),80),"Destination company location");
  const contents = required(sanitizeText(form.get("contents"),180),"Package contents");
  const description = required(sanitizeText(form.get("description"),1000),"Package description");
  const file = form.get("photo");
  let photoPath: string | null = null;
  if (file instanceof File && file.size > 0) photoPath = (await saveUpload(file,`requests/${company.id}`)).path;
  const requestId = id("req");
  const quoteToken = randomToken();
  const submittedAt = now();
  const tx = db.transaction(() => {
    let customer = db.prepare(`SELECT id FROM customers WHERE company_id=? AND phone=?`).get(company.id,ownerPhone) as any;
    if (!customer) {
      const customerId = id("cus");
      db.prepare(`INSERT INTO customers (id,company_id,name,phone,email,created_at) VALUES (?,?,?,?,?,?)`).run(customerId,company.id,ownerName,ownerPhone,ownerEmail,submittedAt);
      customer = {id:customerId};
    } else if (ownerEmail) {
      db.prepare(`UPDATE customers SET email=COALESCE(email,?) WHERE id=?`).run(ownerEmail,customer.id);
    }
    db.prepare(`INSERT INTO shipment_requests (id,company_id,owner_customer_id,owner_role,sender_name,sender_phone,receiver_name,receiver_phone,origin_mode,origin_location_id,pickup_area,destination_mode,destination_location_id,delivery_area,contents,description,estimated_weight_kg,fragile,photo_path,state,submitted_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(requestId,company.id,customer.id,ownerRole,senderName,senderPhone,receiverName,receiverPhone,originMode,originLocationId,sanitizeText(form.get("pickupArea"),300)||null,destinationMode,destinationLocationId,sanitizeText(form.get("deliveryArea"),300)||null,contents,description,Number(form.get("weight")||0)||null,form.get("fragile")?1:0,photoPath,"SUBMITTED",submittedAt,submittedAt);
    insertToken(db,company.id,"REQUEST_QUOTE",requestId,quoteToken,new Date(Date.now()+14*86400000).toISOString());
    audit(db,null,"REQUEST_SUBMITTED","SHIPMENT_REQUEST",requestId,undefined,undefined,{handle});
    const owners = db.prepare(`SELECT u.id,u.email,u.locale FROM company_members m JOIN users u ON u.id=m.user_id WHERE m.company_id=? AND m.role IN ('OWNER','ADMIN','SUPERVISOR') AND m.active=1`).all(company.id) as any[];
    for (const owner of owners) {
      db.prepare(`INSERT OR IGNORE INTO notifications (id,company_id,user_id,channel,locale,state,subject,body,idempotency_key,created_at,sent_at) VALUES (?,?,?,'IN_APP',?,'SENT',?,?,?,?,?)`)
        .run(id("not"),company.id,owner.id,owner.locale||"en","New shipment request",`${senderName} submitted a request for ${contents}.`,`request:${requestId}:${owner.id}`,submittedAt,submittedAt);
    }
  });
  tx();
  return {requestId,quoteToken};
}

export function getQuoteAccess(rawToken: string): any | null {
  const token = tokenRow(rawToken,"REQUEST_QUOTE");
  if (!token) return null;
  const row = getDb().prepare(`SELECT r.*,q.amount,q.currency,q.expires_at,q.expected_delivery_date,q.notes,q.status quote_status,c.name company_name,c.handle company_handle,b.primary_color,b.accent_color
    FROM shipment_requests r JOIN companies c ON c.id=r.company_id JOIN company_branding b ON b.company_id=c.id LEFT JOIN quotes q ON q.request_id=r.id WHERE r.id=?`).get(token.entity_id) as any;
  return row || null;
}

export async function issueQuote(ctx: MemberContext, requestId: string, amount: number, expectedDeliveryDate?: string, notes?: string): Promise<void> {
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Enter a valid quote amount.");
  const db = getDb();
  const tx = db.transaction(() => {
    const request = db.prepare(`SELECT * FROM shipment_requests WHERE id=? AND company_id=?`).get(requestId,ctx.companyId) as any;
    if (!request) throw new Error("Request not found.");
    if (request.state === "SUBMITTED") {
      assertRequestTransition("SUBMITTED","UNDER_REVIEW");
      db.prepare(`UPDATE shipment_requests SET state='UNDER_REVIEW',updated_at=? WHERE id=?`).run(now(),requestId);
      request.state = "UNDER_REVIEW";
    }
    assertRequestTransition(request.state as RequestState,"PRELIMINARY_QUOTE_ISSUED");
    const expiresAt = new Date(Date.now()+3*86400000).toISOString();
    db.prepare(`INSERT INTO quotes (id,company_id,request_id,amount,currency,expires_at,expected_delivery_date,notes,status,issued_by,issued_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(request_id) DO UPDATE SET amount=excluded.amount,expires_at=excluded.expires_at,expected_delivery_date=excluded.expected_delivery_date,notes=excluded.notes,status='ISSUED',issued_by=excluded.issued_by,issued_at=excluded.issued_at,accepted_at=NULL`)
      .run(id("quo"),ctx.companyId,requestId,amount,"ETB",expiresAt,expectedDeliveryDate||null,notes||"Final amount may change after physical inspection.","ISSUED",ctx.user.id,now());
    db.prepare(`UPDATE shipment_requests SET state='PRELIMINARY_QUOTE_ISSUED',updated_at=? WHERE id=?`).run(now(),requestId);
    const recipient = db.prepare(`SELECT c.user_id,c.email,u.locale,at.token_cipher FROM shipment_requests r JOIN customers c ON c.id=r.owner_customer_id LEFT JOIN users u ON u.id=c.user_id JOIN access_tokens at ON at.entity_id=r.id AND at.entity_type='REQUEST_QUOTE' AND at.revoked_at IS NULL WHERE r.id=?`).get(requestId) as any;
    if (recipient) {
      const rawToken = decryptSecret(recipient.token_cipher);
      const secureUrl = `${env.appUrl}/q/${rawToken}`;
      if (recipient.user_id) db.prepare(`INSERT OR IGNORE INTO notifications (id,company_id,user_id,channel,locale,state,subject,body,idempotency_key,created_at,sent_at) VALUES (?,?,?,'IN_APP',?,'SENT',?,?,?,?,?)`)
        .run(id("not"),ctx.companyId,recipient.user_id,recipient.locale||"en","Preliminary quote ready",`A preliminary quote of ETB ${amount.toFixed(2)} is ready.`, `quote-inapp:${requestId}`,now(),now());
      if (recipient.email) db.prepare(`INSERT OR IGNORE INTO notifications (id,company_id,recipient,channel,locale,state,subject,body,idempotency_key,created_at) VALUES (?,?,?,'EMAIL',?,'PENDING',?,?,?,?)`)
        .run(id("not"),ctx.companyId,recipient.email,recipient.locale||"en","Your shipment quote is ready",`Review and accept or abandon your preliminary quote here:
${secureUrl}`,`quote-email:${requestId}`,now());
    }
    audit(db,ctx,"QUOTE_ISSUED","SHIPMENT_REQUEST",requestId,undefined,undefined,{amount,expiresAt});
  });
  tx();
  await deliverPendingEmails();
}

export async function customerQuoteDecision(rawToken: string, decision: "ACCEPT"|"ABANDON"): Promise<void> {
  const token = tokenRow(rawToken,"REQUEST_QUOTE");
  if (!token) throw new Error("This quote link is invalid or expired.");
  const db = getDb();
  const current = db.prepare(`SELECT r.id request_id,r.state,q.id quote_id,q.status,q.expires_at FROM shipment_requests r LEFT JOIN quotes q ON q.request_id=r.id WHERE r.id=?`).get(token.entity_id) as any;
  if (!current?.quote_id) throw new Error("A quote has not been issued yet.");
  if (current.status === "ISSUED" && new Date(current.expires_at) <= new Date()) {
    const expire = db.transaction(() => {
      db.prepare(`UPDATE quotes SET status='EXPIRED' WHERE id=? AND status='ISSUED'`).run(current.quote_id);
      db.prepare(`UPDATE shipment_requests SET state='EXPIRED',updated_at=? WHERE id=? AND state='PRELIMINARY_QUOTE_ISSUED'`).run(now(),current.request_id);
    });
    expire();
    throw new Error("This quote has expired.");
  }
  const tx = db.transaction(() => {
    const request = db.prepare(`SELECT * FROM shipment_requests WHERE id=?`).get(token.entity_id) as any;
    const quote = db.prepare(`SELECT * FROM quotes WHERE request_id=?`).get(token.entity_id) as any;
    if (!request || !quote) throw new Error("A quote has not been issued yet.");
    if (quote.status !== "ISSUED" || request.state !== "PRELIMINARY_QUOTE_ISSUED") throw new Error("This quote is no longer awaiting a decision.");
    if (decision === "ACCEPT") {
      assertRequestTransition(request.state,"CUSTOMER_ACCEPTED");
      db.prepare(`UPDATE quotes SET status='ACCEPTED',accepted_at=? WHERE id=?`).run(now(),quote.id);
      db.prepare(`UPDATE shipment_requests SET state='CUSTOMER_ACCEPTED',updated_at=? WHERE id=?`).run(now(),request.id);
    } else {
      assertRequestTransition(request.state,"ABANDONED");
      db.prepare(`UPDATE quotes SET status='ABANDONED' WHERE id=?`).run(quote.id);
      db.prepare(`UPDATE shipment_requests SET state='ABANDONED',updated_at=? WHERE id=?`).run(now(),request.id);
    }
  });
  tx();
}

export async function activateShipment(ctx: MemberContext, requestId: string): Promise<{shipmentId:string;trackingToken:string;ownerToken:string}> {
  const db = getDb();
  let result!: {shipmentId:string;trackingToken:string;ownerToken:string};
  const tx = db.transaction(() => {
    const request = db.prepare(`SELECT * FROM shipment_requests WHERE id=? AND company_id=?`).get(requestId,ctx.companyId) as any;
    if (!request) throw new Error("Request not found.");
    if (request.state !== "CUSTOMER_ACCEPTED") throw new Error("The customer must accept the quote before activation.");
    const existing = db.prepare(`SELECT id FROM shipments WHERE request_id=?`).get(requestId) as any;
    if (existing) throw new Error("This request already has an active shipment.");
    const quote = db.prepare(`SELECT * FROM quotes WHERE request_id=? AND company_id=?`).get(requestId,ctx.companyId) as any;
    if (!quote || quote.status !== "ACCEPTED") throw new Error("An accepted quote is required.");
    if (new Date(quote.expires_at) <= new Date() && !quote.accepted_at) throw new Error("The quote expired before acceptance.");
    if (!request.origin_location_id || !request.destination_location_id) throw new Error("Origin and destination company locations are required.");
    const legs = db.prepare(`SELECT id,company_id companyId,origin_location_id originLocationId,destination_location_id destinationLocationId,estimated_hours estimatedHours,priority,active FROM route_legs WHERE company_id=?`).all(ctx.companyId) as any[];
    const plan = findBestRoute(ctx.companyId,request.origin_location_id,request.destination_location_id,legs);
    if (!plan) throw new Error("No valid route connects the selected company locations.");
    const locations = db.prepare(`SELECT id,name FROM locations WHERE company_id=?`).all(ctx.companyId) as Array<{id:string;name:string}>;
    const locName = (locationId:string) => locations.find((x)=>x.id===locationId)?.name || "Company location";
    const shipmentId = id("shp");
    const trackingNumber = `MB-${new Date().toISOString().slice(2,10).replaceAll("-","")}-${String((db.prepare(`SELECT COUNT(*) count FROM shipments WHERE company_id=?`).get(ctx.companyId) as any).count+1).padStart(4,"0")}`;
    const qrToken = randomToken();
    const trackingToken = randomToken();
    const ownerToken = randomToken();
    const pin = randomPin();
    const createdAt = now();
    const originLabel = request.pickup_area || locName(request.origin_location_id);
    const destinationLabel = request.delivery_area || locName(request.destination_location_id);
    db.prepare(`INSERT INTO shipments (id,company_id,request_id,tracking_number,qr_identifier_hash,owner_customer_id,sender_name,sender_phone,receiver_name,receiver_phone,contents,description,origin_label,destination_label,origin_location_id,destination_location_id,destination_mode,state,payment_status,preliminary_amount,currency,estimated_delivery_date,current_location_id,current_step_index,delivery_pin_hash,delivery_pin_cipher,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'AWAITING_COMPANY_RECEIPT','UNPAID',?,?,?,?,0,?,?,?,?)`)
      .run(shipmentId,ctx.companyId,requestId,trackingNumber,sha256(qrToken),request.owner_customer_id,request.sender_name,request.sender_phone,request.receiver_name,request.receiver_phone,request.contents,request.description,originLabel,destinationLabel,request.origin_location_id,request.destination_location_id,request.destination_mode,quote.amount,quote.currency,quote.expected_delivery_date,request.origin_location_id,hashPin(pin),encryptSecret(pin),createdAt,createdAt);
    let sequence = 1;
    const steps: Array<{type:string;legId:string|null;origin:string;destination:string}> = [];
    if (request.origin_mode === "PICKUP") steps.push({type:"PICKUP",legId:null,origin:request.pickup_area||"Sender pickup point",destination:locName(request.origin_location_id)});
    for (const leg of plan.legs) steps.push({type:"ROUTE_LEG",legId:leg.id,origin:locName(leg.originLocationId),destination:locName(leg.destinationLocationId)});
    steps.push({type:request.destination_mode === "DELIVERY"?"FINAL_DELIVERY":"COLLECTION",legId:null,origin:locName(request.destination_location_id),destination:request.destination_mode === "DELIVERY"?(request.delivery_area||"Receiver delivery point"):"Receiver collection"});
    if (!steps.length) throw new Error("The generated journey is empty.");
    const insertStep = db.prepare(`INSERT INTO journey_steps (id,company_id,shipment_id,sequence,step_type,route_leg_id,origin_label,destination_label,state) VALUES (?,?,?,?,?,?,?,?,?)`);
    for (const step of steps) insertStep.run(id("step"),ctx.companyId,shipmentId,sequence++,step.type,step.legId,step.origin,step.destination,sequence===2?"READY":"PENDING");
    insertToken(db,ctx.companyId,"QR_SHIPMENT",shipmentId,qrToken);
    insertToken(db,ctx.companyId,"TRACKING",shipmentId,trackingToken);
    insertToken(db,ctx.companyId,"OWNER_ACCESS",shipmentId,ownerToken);
    assertRequestTransition(request.state as RequestState,"COMPANY_CONFIRMED");
    db.prepare(`UPDATE shipment_requests SET state='COMPANY_CONFIRMED',updated_at=? WHERE id=?`).run(createdAt,requestId);
    shipmentEvent(db,{companyId:ctx.companyId,shipmentId,type:"SHIPMENT_CONFIRMED",title:"Shipment confirmed",description:"The delivery company confirmed the shipment and created its journey.",locationId:request.origin_location_id,customerVisible:true,actorId:ctx.user.id,idempotencyKey:`activation:${requestId}`});
    audit(db,ctx,"SHIPMENT_ACTIVATED","SHIPMENT",shipmentId,undefined,undefined,{requestId,trackingNumber});
    result={shipmentId,trackingToken,ownerToken};
  });
  tx();
  await deliverPendingEmails();
  return result;
}

export function getWorkspaceSnapshot(ctx: MemberContext): any {
  const db = getDb();
  const branding = db.prepare(`SELECT c.*,b.* FROM companies c JOIN company_branding b ON b.company_id=c.id WHERE c.id=?`).get(ctx.companyId) as any;
  const scoped = ctx.role === "TEAM_MEMBER" && ctx.locationIds.length > 0;
  const placeholders = ctx.locationIds.map(()=>"?").join(",") || "''";
  const shipmentWhere = scoped ? `AND (s.current_location_id IN (${placeholders}) OR EXISTS (SELECT 1 FROM journey_steps js JOIN route_legs rl ON rl.id=js.route_leg_id WHERE js.shipment_id=s.id AND js.sequence=s.current_step_index+1 AND (rl.origin_location_id IN (${placeholders}) OR rl.destination_location_id IN (${placeholders}))))` : "";
  const shipmentParams = scoped ? [ctx.companyId,...ctx.locationIds,...ctx.locationIds,...ctx.locationIds] : [ctx.companyId];
  const shipments = db.prepare(`SELECT s.*,(SELECT b.id FROM batch_memberships bm JOIN dispatch_batches b ON b.id=bm.batch_id WHERE bm.shipment_id=s.id AND bm.active=1 LIMIT 1) current_batch_id FROM shipments s WHERE s.company_id=? ${shipmentWhere} ORDER BY s.created_at DESC`).all(...shipmentParams) as any[];
  const managerView = ["OWNER","ADMIN","SUPERVISOR"].includes(ctx.role);
  const requests = managerView ? (db.prepare(`SELECT r.*,q.amount quote_amount,q.currency quote_currency,q.expires_at quote_expires_at,q.expected_delivery_date,q.status quote_status,at.token_cipher quote_token_cipher FROM shipment_requests r LEFT JOIN quotes q ON q.request_id=r.id LEFT JOIN access_tokens at ON at.entity_id=r.id AND at.entity_type='REQUEST_QUOTE' AND at.revoked_at IS NULL WHERE r.company_id=? ORDER BY r.submitted_at DESC`).all(ctx.companyId) as any[]).map((r)=>({...r,quoteToken:r.quote_token_cipher?decryptSecret(r.quote_token_cipher):null,quote_token_cipher:undefined})) : [];
  const batchScope = scoped ? `AND (rl.origin_location_id IN (${placeholders}) OR rl.destination_location_id IN (${placeholders}))` : "";
  const batchParams = scoped ? [ctx.companyId,...ctx.locationIds,...ctx.locationIds] : [ctx.companyId];
  return {
    company: branding,
    locations: db.prepare(`SELECT * FROM locations WHERE company_id=? ORDER BY city,name`).all(ctx.companyId).map((r:any)=>({...r,capabilities:json(r.capabilities_json,[])})),
    routeLegs: db.prepare(`SELECT rl.*,o.name origin_name,d.name destination_name FROM route_legs rl JOIN locations o ON o.id=rl.origin_location_id JOIN locations d ON d.id=rl.destination_location_id WHERE rl.company_id=? ORDER BY rl.name`).all(ctx.companyId),
    requests,
    shipments,
    batches: db.prepare(`SELECT b.*,rl.name route_name,o.name origin_name,d.name destination_name,(SELECT COUNT(*) FROM batch_memberships bm WHERE bm.batch_id=b.id AND bm.active=1) shipment_count FROM dispatch_batches b JOIN route_legs rl ON rl.id=b.route_leg_id JOIN locations o ON o.id=rl.origin_location_id JOIN locations d ON d.id=rl.destination_location_id WHERE b.company_id=? ${batchScope} ORDER BY b.created_at DESC`).all(...batchParams),
    members: managerView ? db.prepare(`SELECT m.id,m.role,m.active,u.name,u.email,u.phone,GROUP_CONCAT(l.name, ', ') locations FROM company_members m JOIN users u ON u.id=m.user_id LEFT JOIN member_locations ml ON ml.member_id=m.id LEFT JOIN locations l ON l.id=ml.location_id WHERE m.company_id=? GROUP BY m.id ORDER BY CASE m.role WHEN 'OWNER' THEN 1 WHEN 'ADMIN' THEN 2 WHEN 'SUPERVISOR' THEN 3 WHEN 'TEAM_MEMBER' THEN 4 ELSE 5 END,u.name`).all(ctx.companyId) : [],
    customers: managerView ? db.prepare(`SELECT c.*,(SELECT COUNT(*) FROM shipments s WHERE s.owner_customer_id=c.id) shipment_count FROM customers c WHERE c.company_id=? ORDER BY c.created_at DESC`).all(ctx.companyId) : [],
    notifications: db.prepare(`SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 20`).all(ctx.user.id),
  };
}

export function getShipmentForMember(ctx: MemberContext, shipmentId: string): any | null {
  const db=getDb();
  const shipment=db.prepare(`SELECT s.*,o.name origin_location_name,d.name destination_location_name,cl.name current_location_name,c.name company_name,c.handle company_handle FROM shipments s JOIN companies c ON c.id=s.company_id LEFT JOIN locations o ON o.id=s.origin_location_id LEFT JOIN locations d ON d.id=s.destination_location_id LEFT JOIN locations cl ON cl.id=s.current_location_id WHERE s.id=? AND s.company_id=?`).get(shipmentId,ctx.companyId) as any;
  if(!shipment) return null;
  ensureLocationScope(ctx,[shipment.current_location_id,shipment.origin_location_id,shipment.destination_location_id]);
  shipment.steps=db.prepare(`SELECT js.*,rl.code route_code FROM journey_steps js LEFT JOIN route_legs rl ON rl.id=js.route_leg_id WHERE js.shipment_id=? ORDER BY sequence`).all(shipmentId);
  shipment.events=db.prepare(`SELECT e.*,l.name location_name FROM shipment_events e LEFT JOIN locations l ON l.id=e.location_id WHERE e.shipment_id=? ORDER BY e.occurred_at DESC`).all(shipmentId);
  shipment.evidence=db.prepare(`SELECT id,category,original_name,mime_type,customer_visible,sensitive,created_at FROM evidence_files WHERE shipment_id=? ORDER BY created_at DESC`).all(shipmentId);
  const activeBatch=db.prepare(`SELECT b.*,rl.name route_name FROM batch_memberships bm JOIN dispatch_batches b ON b.id=bm.batch_id JOIN route_legs rl ON rl.id=b.route_leg_id WHERE bm.shipment_id=? AND bm.active=1`).get(shipmentId);
  shipment.activeBatch=activeBatch||null;
  const links=db.prepare(`SELECT entity_type,token_cipher FROM access_tokens WHERE entity_id=? AND revoked_at IS NULL AND entity_type IN ('TRACKING','QR_SHIPMENT')`).all(shipmentId) as any[];
  shipment.links=Object.fromEntries(links.map((x)=>[x.entity_type,decryptSecret(x.token_cipher)]));
  return shipment;
}

export function getBatchForMember(ctx: MemberContext,batchId:string):any|null{
  const db=getDb();
  const batch=db.prepare(`SELECT b.*,rl.name route_name,rl.origin_location_id,rl.destination_location_id,o.name origin_name,d.name destination_name FROM dispatch_batches b JOIN route_legs rl ON rl.id=b.route_leg_id JOIN locations o ON o.id=rl.origin_location_id JOIN locations d ON d.id=rl.destination_location_id WHERE b.id=? AND b.company_id=?`).get(batchId,ctx.companyId) as any;
  if(!batch)return null;
  ensureLocationScope(ctx,[batch.origin_location_id,batch.destination_location_id]);
  batch.shipments=db.prepare(`SELECT s.*,bm.id membership_id,js.step_type next_step_type,js.route_leg_id next_route_leg_id,js.destination_label next_destination FROM batch_memberships bm JOIN shipments s ON s.id=bm.shipment_id LEFT JOIN journey_steps js ON js.shipment_id=s.id AND js.sequence=s.current_step_index+1 WHERE bm.batch_id=? AND bm.active=1 ORDER BY bm.added_at`).all(batchId);
  batch.compatible=db.prepare(`SELECT s.* FROM shipments s JOIN journey_steps js ON js.shipment_id=s.id AND js.sequence=s.current_step_index+1 LEFT JOIN batch_memberships bm ON bm.shipment_id=s.id AND bm.active=1 LEFT JOIN dispatch_batches oldb ON oldb.id=bm.batch_id WHERE s.company_id=? AND js.route_leg_id=? AND js.state='READY' AND (bm.id IS NULL OR oldb.state='ARRIVED') AND s.state NOT IN ('DELIVERED','CANCELLED','ON_HOLD','DAMAGED','MISSING','RETURNING','RETURNED') ORDER BY s.created_at`).all(ctx.companyId,batch.route_leg_id);
  batch.nextBatches=db.prepare(`SELECT b.id,b.batch_number,b.route_leg_id,rl.name route_name FROM dispatch_batches b JOIN route_legs rl ON rl.id=b.route_leg_id WHERE b.company_id=? AND b.state='OPEN' AND b.id<>? ORDER BY b.created_at`).all(ctx.companyId,batchId);
  const qr=db.prepare(`SELECT token_cipher FROM access_tokens WHERE entity_type='QR_BATCH' AND entity_id=? AND revoked_at IS NULL`).get(batchId) as any;
  batch.qrToken=qr?decryptSecret(qr.token_cipher):null;
  return batch;
}

export function receiveShipment(ctx: MemberContext, shipmentId: string, idempotencyKey: string): void {
  const db=getDb();
  const tx=db.transaction(()=>{
    const shipment=db.prepare(`SELECT * FROM shipments WHERE id=? AND company_id=?`).get(shipmentId,ctx.companyId) as any;
    if(!shipment)throw new Error("Shipment not found.");
    ensureLocationScope(ctx,[shipment.current_location_id,shipment.origin_location_id]);
    const processed=db.prepare(`SELECT id FROM shipment_events WHERE company_id=? AND idempotency_key=?`).get(ctx.companyId,idempotencyKey);
    if(processed)return;
    if(shipment.state!=="AWAITING_COMPANY_RECEIPT")throw new Error("Only a shipment awaiting company receipt can be received.");
    const firstStep=db.prepare(`SELECT * FROM journey_steps WHERE shipment_id=? ORDER BY sequence LIMIT 1`).get(shipmentId) as any;
    let nextState:ShipmentState="RECEIVED_BY_COMPANY";
    let completedSteps=0;
    if(firstStep?.step_type==="PICKUP"){
      db.prepare(`UPDATE journey_steps SET state='COMPLETED',completed_at=? WHERE id=?`).run(now(),firstStep.id);
      completedSteps=1;
      const nextStep=db.prepare(`SELECT * FROM journey_steps WHERE shipment_id=? AND sequence=2`).get(shipmentId) as any;
      if(nextStep){
        db.prepare(`UPDATE journey_steps SET state='READY' WHERE id=?`).run(nextStep.id);
        if(nextStep.step_type==="COLLECTION")nextState="READY_FOR_COLLECTION";
        else if(nextStep.step_type==="FINAL_DELIVERY")nextState="AT_COMPANY_LOCATION";
      }
    }else if(firstStep){
      db.prepare(`UPDATE journey_steps SET state='READY' WHERE id=?`).run(firstStep.id);
      if(firstStep.step_type==="COLLECTION")nextState="READY_FOR_COLLECTION";
      else if(firstStep.step_type==="FINAL_DELIVERY")nextState="AT_COMPANY_LOCATION";
    }
    assertShipmentTransition(shipment.state as ShipmentState,"RECEIVED_BY_COMPANY");
    if(nextState==="AT_COMPANY_LOCATION")assertShipmentTransition("RECEIVED_BY_COMPANY","AT_COMPANY_LOCATION");
    if(nextState==="READY_FOR_COLLECTION"){
      assertShipmentTransition("RECEIVED_BY_COMPANY","AT_COMPANY_LOCATION");
      assertShipmentTransition("AT_COMPANY_LOCATION","READY_FOR_COLLECTION");
    }
    db.prepare(`UPDATE shipments SET state=?,current_step_index=?,updated_at=?,version=version+1 WHERE id=?`).run(nextState,completedSteps,now(),shipmentId);
    shipmentEvent(db,{companyId:ctx.companyId,shipmentId,type:"SHIPMENT_RECEIVED",title:"Shipment received",description:"The package was received by the delivery company.",locationId:shipment.origin_location_id,customerVisible:true,actorId:ctx.user.id,idempotencyKey});
    audit(db,ctx,"SHIPMENT_RECEIVED","SHIPMENT",shipmentId);
  });
  tx();
}

export function createBatch(ctx: MemberContext, routeLegId: string, expectedDeparture?:string, expectedArrival?:string): string {
  const db=getDb();
  const leg=db.prepare(`SELECT * FROM route_legs WHERE id=? AND company_id=? AND active=1`).get(routeLegId,ctx.companyId) as any;
  if(!leg)throw new Error("Active Route Leg not found.");
  ensureLocationScope(ctx,[leg.origin_location_id]);
  const batchId=id("bat");
  const qr=randomToken();
  const count=(db.prepare(`SELECT COUNT(*) count FROM dispatch_batches WHERE company_id=?`).get(ctx.companyId) as any).count+1;
  const batchNumber=`BATCH-${leg.code}-${String(count).padStart(4,"0")}`;
  const tx=db.transaction(()=>{
    db.prepare(`INSERT INTO dispatch_batches (id,company_id,batch_number,qr_identifier_hash,route_leg_id,state,expected_departure,expected_arrival,created_by,created_at,updated_at) VALUES (?,?,?,?,?,'DRAFT',?,?,?,?,?)`)
      .run(batchId,ctx.companyId,batchNumber,sha256(qr),routeLegId,expectedDeparture||null,expectedArrival||null,ctx.user.id,now(),now());
    insertToken(db,ctx.companyId,"QR_BATCH",batchId,qr);
    audit(db,ctx,"BATCH_CREATED","DISPATCH_BATCH",batchId,undefined,undefined,{batchNumber,routeLegId});
  });tx();
  return batchId;
}

export function addShipmentToBatch(ctx:MemberContext,shipmentId:string,batchId:string,idempotencyKey:string):void{
  const db=getDb();
  const tx=db.transaction(()=>{
    const batch=db.prepare(`SELECT b.*,rl.origin_location_id,rl.destination_location_id FROM dispatch_batches b JOIN route_legs rl ON rl.id=b.route_leg_id WHERE b.id=? AND b.company_id=?`).get(batchId,ctx.companyId) as any;
    const shipment=db.prepare(`SELECT * FROM shipments WHERE id=? AND company_id=?`).get(shipmentId,ctx.companyId) as any;
    if(!batch||!shipment)throw new Error("Shipment or batch not found.");
    ensureLocationScope(ctx,[batch.origin_location_id,shipment.current_location_id]);
    if(db.prepare(`SELECT id FROM shipment_events WHERE company_id=? AND idempotency_key=?`).get(ctx.companyId,idempotencyKey))return;
    if(batch.state!=="OPEN")throw new Error("Shipments can only be loaded into an open batch.");
    if(blockedBatchShipmentStates.has(shipment.state as ShipmentState))throw new Error(`Shipment cannot be batched while ${shipment.state.toLowerCase().replaceAll("_"," ")}.`);
    const existing=db.prepare(`SELECT id FROM batch_memberships WHERE shipment_id=? AND active=1`).get(shipmentId);
    if(existing)throw new Error("This shipment already belongs to an active Dispatch Batch.");
    const step=db.prepare(`SELECT * FROM journey_steps WHERE shipment_id=? AND sequence=?`).get(shipmentId,shipment.current_step_index+1) as any;
    if(!step||step.step_type!=="ROUTE_LEG"||step.route_leg_id!==batch.route_leg_id||step.state!=="READY")throw new Error("The shipment's next planned Route Leg does not match this batch.");
    db.prepare(`INSERT INTO batch_memberships (id,company_id,batch_id,shipment_id,active,added_at,added_by) VALUES (?,?,?,?,1,?,?)`).run(id("bm"),ctx.companyId,batchId,shipmentId,now(),ctx.user.id);
    shipmentEvent(db,{companyId:ctx.companyId,shipmentId,batchId,type:"ADDED_TO_BATCH",title:"Prepared for the next route",description:`Shipment added to ${batch.batch_number}.`,locationId:batch.origin_location_id,customerVisible:false,actorId:ctx.user.id,idempotencyKey});
  });tx();
}

export function removeShipmentFromBatch(ctx:MemberContext,shipmentId:string,batchId:string,reason:string):void{
  const db=getDb();
  const tx=db.transaction(()=>{
    const batch=db.prepare(`SELECT b.*,rl.origin_location_id FROM dispatch_batches b JOIN route_legs rl ON rl.id=b.route_leg_id WHERE b.id=? AND b.company_id=?`).get(batchId,ctx.companyId) as any;
    if(!batch)throw new Error("Batch not found.");
    ensureLocationScope(ctx,[batch.origin_location_id]);
    if(["DISPATCHED","ARRIVED","CLOSED"].includes(batch.state)&&!["OWNER","ADMIN","SUPERVISOR"].includes(ctx.role))throw new Error("A supervisor must remove a shipment after dispatch.");
    if(["DISPATCHED","ARRIVED","CLOSED"].includes(batch.state)&&!reason.trim())throw new Error("A reason is required for removal after dispatch.");
    const membership=db.prepare(`SELECT * FROM batch_memberships WHERE company_id=? AND batch_id=? AND shipment_id=? AND active=1`).get(ctx.companyId,batchId,shipmentId) as any;
    if(!membership)throw new Error("Shipment is not active in this batch.");
    db.prepare(`UPDATE batch_memberships SET active=0,removed_at=?,removed_by=?,removal_reason=? WHERE id=?`).run(now(),ctx.user.id,reason||"Removed before dispatch",membership.id);
    shipmentEvent(db,{companyId:ctx.companyId,shipmentId,batchId,type:"REMOVED_FROM_BATCH",title:"Removed from Dispatch Batch",description:reason||"Shipment removed before departure.",locationId:batch.origin_location_id,customerVisible:false,actorId:ctx.user.id,idempotencyKey:`remove:${membership.id}`});
    audit(db,ctx,"SHIPMENT_REMOVED_FROM_BATCH","SHIPMENT",shipmentId,reason);
  });tx();
}

export function transitionBatch(ctx:MemberContext,batchId:string,next:BatchState,reason?:string,idempotencyKey?:string):{updated:number;skipped:number}{
  const db=getDb();let summary={updated:0,skipped:0};
  const tx=db.transaction(()=>{
    const batch=db.prepare(`SELECT b.*,rl.origin_location_id,rl.destination_location_id,rl.departure_label,rl.arrival_label,o.name origin_name,d.name destination_name FROM dispatch_batches b JOIN route_legs rl ON rl.id=b.route_leg_id JOIN locations o ON o.id=rl.origin_location_id JOIN locations d ON d.id=rl.destination_location_id WHERE b.id=? AND b.company_id=?`).get(batchId,ctx.companyId) as any;
    if(!batch)throw new Error("Batch not found.");
    ensureLocationScope(ctx,[next==="ARRIVED"?batch.destination_location_id:batch.origin_location_id]);
    const reopening=batch.state==="SEALED"&&next==="OPEN";
    if(reopening&&!["OWNER","ADMIN","SUPERVISOR"].includes(ctx.role))throw new Error("Only a supervisor can reopen a sealed batch.");
    if(reopening&&!reason?.trim())throw new Error("A reason is required to reopen a sealed batch.");
    assertBatchTransition(batch.state as BatchState,next,reopening);
    const actionKey=idempotencyKey||`batch:${batchId}:${next}`;
    const already=db.prepare(`SELECT id FROM audit_logs WHERE action=? AND entity_id=? AND metadata_json LIKE ?`).get(`BATCH_${next}`,batchId,`%${actionKey}%`);
    if(already)return;
    if(next==="DISPATCHED"||next==="ARRIVED"){
      const rows=db.prepare(`SELECT s.*,bm.id membership_id,js.id step_id,js.state step_state,js.sequence,js.route_leg_id FROM batch_memberships bm JOIN shipments s ON s.id=bm.shipment_id JOIN journey_steps js ON js.shipment_id=s.id AND js.sequence=s.current_step_index+1 WHERE bm.batch_id=? AND bm.active=1`).all(batchId) as any[];
      for(const shipment of rows){
        if(blockedBatchShipmentStates.has(shipment.state as ShipmentState)||shipment.route_leg_id!==batch.route_leg_id){summary.skipped++;continue;}
        if(next==="DISPATCHED"){
          if(shipment.step_state!=="READY"||!["RECEIVED_BY_COMPANY","AT_COMPANY_LOCATION"].includes(shipment.state)){summary.skipped++;continue;}
          db.prepare(`UPDATE journey_steps SET state='DEPARTED' WHERE id=?`).run(shipment.step_id);
          db.prepare(`UPDATE shipments SET state='IN_TRANSIT',updated_at=?,version=version+1 WHERE id=?`).run(now(),shipment.id);
          shipmentEvent(db,{companyId:ctx.companyId,shipmentId:shipment.id,batchId,type:"LEG_DEPARTED",title:batch.departure_label,description:`Shipment departed ${batch.origin_name} for ${batch.destination_name}.`,locationId:batch.origin_location_id,customerVisible:true,actorId:ctx.user.id,idempotencyKey:`${actionKey}:${shipment.id}`});
        }else{
          if(shipment.step_state!=="DEPARTED"||shipment.state!=="IN_TRANSIT"){summary.skipped++;continue;}
          db.prepare(`UPDATE journey_steps SET state='COMPLETED',completed_at=? WHERE id=?`).run(now(),shipment.step_id);
          const nextIndex=shipment.current_step_index+1;
          const nextStep=db.prepare(`SELECT * FROM journey_steps WHERE shipment_id=? AND sequence=?`).get(shipment.id,nextIndex+1) as any;
          let state:ShipmentState="AT_COMPANY_LOCATION";
          if(nextStep){db.prepare(`UPDATE journey_steps SET state='READY' WHERE id=?`).run(nextStep.id);if(nextStep.step_type==="COLLECTION")state="READY_FOR_COLLECTION";}
          db.prepare(`UPDATE shipments SET state=?,current_location_id=?,current_step_index=?,updated_at=?,version=version+1 WHERE id=?`).run(state,batch.destination_location_id,nextIndex,now(),shipment.id);
          shipmentEvent(db,{companyId:ctx.companyId,shipmentId:shipment.id,batchId,type:"LEG_ARRIVED",title:batch.arrival_label,description:`Shipment arrived at ${batch.destination_name}.`,locationId:batch.destination_location_id,customerVisible:true,actorId:ctx.user.id,idempotencyKey:`${actionKey}:${shipment.id}`});
        }
        summary.updated++;
      }
    }
    if(next==="CLOSED"){
      const unresolved=db.prepare(`SELECT COUNT(*) count FROM batch_memberships bm JOIN shipments s ON s.id=bm.shipment_id JOIN journey_steps js ON js.shipment_id=s.id AND js.sequence=s.current_step_index+1 WHERE bm.batch_id=? AND bm.active=1 AND js.step_type='ROUTE_LEG'`).get(batchId) as any;
      if(unresolved.count>0)throw new Error("Transfer continuing shipments to their next Dispatch Batch before closing this batch.");
    }
    db.prepare(`UPDATE dispatch_batches SET state=?,updated_at=?,version=version+1 WHERE id=?`).run(next,now(),batchId);
    audit(db,ctx,`BATCH_${next}`,"DISPATCH_BATCH",batchId,reason,undefined,{idempotencyKey:actionKey,updated:summary.updated,skipped:summary.skipped});
  });tx();
  return summary;
}

export function transferShipment(ctx:MemberContext,shipmentId:string,destinationBatchId:string,idempotencyKey:string):void{
  const db=getDb();
  const tx=db.transaction(()=>{
    const shipment=db.prepare(`SELECT * FROM shipments WHERE id=? AND company_id=?`).get(shipmentId,ctx.companyId) as any;
    const dest=db.prepare(`SELECT b.*,rl.origin_location_id FROM dispatch_batches b JOIN route_legs rl ON rl.id=b.route_leg_id WHERE b.id=? AND b.company_id=?`).get(destinationBatchId,ctx.companyId) as any;
    if(!shipment||!dest)throw new Error("Shipment or destination batch not found.");
    ensureLocationScope(ctx,[shipment.current_location_id,dest.origin_location_id]);
    if(db.prepare(`SELECT id FROM shipment_events WHERE company_id=? AND idempotency_key=?`).get(ctx.companyId,idempotencyKey))return;
    if(dest.state!=="OPEN")throw new Error("Destination batch must be open.");
    const step=db.prepare(`SELECT * FROM journey_steps WHERE shipment_id=? AND sequence=?`).get(shipmentId,shipment.current_step_index+1) as any;
    if(!step||step.step_type!=="ROUTE_LEG"||step.route_leg_id!==dest.route_leg_id||step.state!=="READY")throw new Error("Destination batch does not match the shipment's next Route Leg.");
    const old=db.prepare(`SELECT bm.*,b.state batch_state FROM batch_memberships bm JOIN dispatch_batches b ON b.id=bm.batch_id WHERE bm.shipment_id=? AND bm.active=1`).get(shipmentId) as any;
    if(old){
      if(old.batch_state!=="ARRIVED")throw new Error("The current batch must arrive before transfer.");
      db.prepare(`UPDATE batch_memberships SET active=0,removed_at=?,removed_by=?,removal_reason='TRANSFERRED' WHERE id=?`).run(now(),ctx.user.id,old.id);
    }
    db.prepare(`INSERT INTO batch_memberships (id,company_id,batch_id,shipment_id,active,added_at,added_by) VALUES (?,?,?,?,1,?,?)`).run(id("bm"),ctx.companyId,destinationBatchId,shipmentId,now(),ctx.user.id);
    shipmentEvent(db,{companyId:ctx.companyId,shipmentId,batchId:destinationBatchId,type:"SHIPMENT_TRANSFERRED",title:"Prepared for the next route",description:`Shipment transferred to ${dest.batch_number}.`,locationId:dest.origin_location_id,customerVisible:false,actorId:ctx.user.id,idempotencyKey});
  });tx();
}

export function startFinalDelivery(ctx:MemberContext,shipmentId:string):void{
  const db=getDb();
  const tx=db.transaction(()=>{
    const shipment=db.prepare(`SELECT * FROM shipments WHERE id=? AND company_id=?`).get(shipmentId,ctx.companyId) as any;
    if(!shipment)throw new Error("Shipment not found.");
    ensureLocationScope(ctx,[shipment.current_location_id,shipment.destination_location_id]);
    const step=db.prepare(`SELECT * FROM journey_steps WHERE shipment_id=? AND sequence=?`).get(shipmentId,shipment.current_step_index+1) as any;
    if(!step||step.step_type!=="FINAL_DELIVERY"||step.state!=="READY")throw new Error("Shipment is not ready for final delivery.");
    if(shipment.state!=="AT_COMPANY_LOCATION")throw new Error("Shipment must be at the destination location before final delivery.");
    assertShipmentTransition(shipment.state,"OUT_FOR_DELIVERY");
    db.prepare(`UPDATE journey_steps SET state='DEPARTED' WHERE id=?`).run(step.id);
    db.prepare(`UPDATE shipments SET state='OUT_FOR_DELIVERY',updated_at=?,version=version+1 WHERE id=?`).run(now(),shipmentId);
    shipmentEvent(db,{companyId:ctx.companyId,shipmentId,type:"OUT_FOR_DELIVERY",title:"Out for delivery",description:"The shipment is on its final delivery step.",locationId:shipment.current_location_id,customerVisible:true,actorId:ctx.user.id,idempotencyKey:`out-for-delivery:${shipmentId}:${shipment.version}`});
  });tx();
}

export async function completeDelivery(ctx:MemberContext,shipmentId:string,pin:string,receiverName:string,proofFile:File,receiverIdFile?:File|null):Promise<void>{
  if(!/^\d{6}$/.test(pin))throw new Error("Enter the six-digit Delivery PIN.");
  if(!(proofFile instanceof File)||proofFile.size===0)throw new Error("A proof-of-delivery photo is required.");
  const db=getDb();
  const initial=db.prepare(`SELECT * FROM shipments WHERE id=? AND company_id=?`).get(shipmentId,ctx.companyId) as any;
  if(!initial)throw new Error("Shipment not found.");
  ensureLocationScope(ctx,[initial.current_location_id,initial.destination_location_id]);
  if(!["OUT_FOR_DELIVERY","READY_FOR_COLLECTION"].includes(initial.state))throw new Error("Shipment is not at an eligible customer handoff stage.");
  if(initial.delivered_at)throw new Error("Shipment has already been delivered.");
  const recent=(db.prepare(`SELECT COUNT(*) count FROM delivery_pin_attempts WHERE shipment_id=? AND successful=0 AND attempted_at>?`).get(shipmentId,new Date(Date.now()-15*60000).toISOString()) as any).count;
  if(recent>=5)throw new Error("Too many incorrect PIN attempts. Try again later or request a supervisor override.");
  if(!verifyPin(pin,initial.delivery_pin_hash)){
    db.prepare(`INSERT INTO delivery_pin_attempts (id,shipment_id,actor_user_id,successful,attempted_at) VALUES (?,?,?,?,?)`).run(id("pin"),shipmentId,ctx.user.id,0,now());
    throw new Error("The Delivery PIN is incorrect.");
  }
  const proof=await saveUpload(proofFile,`evidence/${ctx.companyId}/${shipmentId}`);
  const receiverId=receiverIdFile instanceof File&&receiverIdFile.size>0?await saveUpload(receiverIdFile,`evidence/${ctx.companyId}/${shipmentId}`):null;
  try {
    const tx=db.transaction(()=>{
      const shipment=db.prepare(`SELECT * FROM shipments WHERE id=? AND company_id=?`).get(shipmentId,ctx.companyId) as any;
      if(!shipment)throw new Error("Shipment not found.");
      ensureLocationScope(ctx,[shipment.current_location_id,shipment.destination_location_id]);
      if(!["OUT_FOR_DELIVERY","READY_FOR_COLLECTION"].includes(shipment.state))throw new Error("Shipment is not at an eligible customer handoff stage.");
      if(shipment.delivered_at)throw new Error("Shipment has already been delivered.");
      if(!verifyPin(pin,shipment.delivery_pin_hash))throw new Error("The Delivery PIN changed. Request a new authorization from the shipment owner.");
      const step=db.prepare(`SELECT * FROM journey_steps WHERE shipment_id=? AND sequence=?`).get(shipmentId,shipment.current_step_index+1) as any;
      if(!step||!["FINAL_DELIVERY","COLLECTION"].includes(step.step_type)||!["READY","DEPARTED"].includes(step.state))throw new Error("The final customer handoff step is not active.");
      db.prepare(`INSERT INTO delivery_pin_attempts (id,shipment_id,actor_user_id,successful,attempted_at) VALUES (?,?,?,?,?)`).run(id("pin"),shipmentId,ctx.user.id,1,now());
      const eventId=shipmentEvent(db,{companyId:ctx.companyId,shipmentId,type:"DELIVERED",title:"Delivered",description:`Shipment received by ${receiverName.trim()||shipment.receiver_name}.`,locationId:shipment.current_location_id,customerVisible:true,actorId:ctx.user.id,idempotencyKey:`delivery:${shipmentId}`});
      db.prepare(`INSERT INTO evidence_files (id,company_id,shipment_id,event_id,category,storage_path,original_name,mime_type,customer_visible,sensitive,uploaded_by,created_at) VALUES (?,?,?,?,?,?,?,?,1,0,?,?)`)
        .run(id("evi"),ctx.companyId,shipmentId,eventId,"PROOF_OF_DELIVERY",proof.path,proof.name,proof.mime,ctx.user.id,now());
      if(receiverId)db.prepare(`INSERT INTO evidence_files (id,company_id,shipment_id,event_id,category,storage_path,original_name,mime_type,customer_visible,sensitive,uploaded_by,created_at) VALUES (?,?,?,?,?,?,?,?,0,1,?,?)`)
        .run(id("evi"),ctx.companyId,shipmentId,eventId,"RECEIVER_ID",receiverId.path,receiverId.name,receiverId.mime,ctx.user.id,now());
      db.prepare(`UPDATE journey_steps SET state='COMPLETED',completed_at=? WHERE id=?`).run(now(),step.id);
      db.prepare(`UPDATE shipments SET state='DELIVERED',delivered_at=?,current_step_index=current_step_index+1,updated_at=?,version=version+1 WHERE id=?`).run(now(),now(),shipmentId);
      const membership=db.prepare(`SELECT id FROM batch_memberships WHERE shipment_id=? AND active=1`).get(shipmentId) as any;
      if(membership)db.prepare(`UPDATE batch_memberships SET active=0,removed_at=?,removed_by=?,removal_reason='FINAL_HANDOFF' WHERE id=?`).run(now(),ctx.user.id,membership.id);
      audit(db,ctx,"SHIPMENT_DELIVERED","SHIPMENT",shipmentId,undefined,undefined,{receiverName:receiverName.trim()||shipment.receiver_name});
    });
    tx();
  } catch (error) {
    await deleteUpload(proof.path);
    if(receiverId)await deleteUpload(receiverId.path);
    throw error;
  }
  await deliverPendingEmails();
}

export function recordPayment(ctx:MemberContext,shipmentId:string,amount:number,method:string,reference?:string,notes?:string):void{
  if(!Number.isFinite(amount)||amount<=0)throw new Error("Enter a valid payment amount.");
  const db=getDb();
  const tx=db.transaction(()=>{
    const shipment=db.prepare(`SELECT * FROM shipments WHERE id=? AND company_id=?`).get(shipmentId,ctx.companyId) as any;
    if(!shipment)throw new Error("Shipment not found.");
    db.prepare(`INSERT INTO payments (id,company_id,shipment_id,amount,currency,method,reference,notes,recorded_by,recorded_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(id("pay"),ctx.companyId,shipmentId,amount,shipment.currency,method,reference||null,notes||null,ctx.user.id,now());
    const paid=(db.prepare(`SELECT COALESCE(SUM(amount),0) total FROM payments WHERE shipment_id=?`).get(shipmentId) as any).total;
    const due=shipment.final_amount??shipment.preliminary_amount;
    const status=paid>=due?"PAID":"PARTIALLY_PAID";
    db.prepare(`UPDATE shipments SET payment_status=?,updated_at=? WHERE id=?`).run(status,now(),shipmentId);
    audit(db,ctx,"PAYMENT_RECORDED","SHIPMENT",shipmentId,notes,undefined,{amount,method,status});
  });tx();
}

export function publicTracking(rawToken:string):any|null{
  const token=tokenRow(rawToken,"TRACKING");if(!token)return null;
  const db=getDb();
  const shipment=db.prepare(`SELECT s.id,s.company_id,s.tracking_number,s.sender_name,s.receiver_name,s.contents,s.origin_label,s.destination_label,s.state,s.estimated_delivery_date,s.delivered_at,c.name company_name,c.handle company_handle,c.phone company_phone,c.email company_email,b.primary_color,b.secondary_color,b.accent_color,b.logo_mark FROM shipments s JOIN companies c ON c.id=s.company_id JOIN company_branding b ON b.company_id=c.id WHERE s.id=?`).get(token.entity_id) as any;
  if(!shipment)return null;
  shipment.events=db.prepare(`SELECT e.id,e.title,e.description,e.occurred_at,l.name location_name FROM shipment_events e LEFT JOIN locations l ON l.id=e.location_id WHERE e.shipment_id=? AND e.customer_visible=1 ORDER BY e.occurred_at`).all(shipment.id);
  shipment.evidence=db.prepare(`SELECT ef.id,ef.category,ef.original_name,ef.mime_type,ef.created_at FROM evidence_files ef WHERE ef.shipment_id=? AND ef.customer_visible=1 AND ef.sensitive=0`).all(shipment.id);
  return shipment;
}

export function trackingTokenByFallback(trackingNumber:string,phone:string):string|null{
  const row=getDb().prepare(`SELECT at.token_cipher FROM shipments s JOIN access_tokens at ON at.entity_id=s.id AND at.entity_type='TRACKING' AND at.revoked_at IS NULL WHERE upper(s.tracking_number)=upper(?) AND (s.sender_phone=? OR s.receiver_phone=?)`).get(trackingNumber.trim(),phone.trim(),phone.trim()) as any;
  return row?decryptSecret(row.token_cipher):null;
}

export function ownerAccess(rawToken:string):any|null{
  const token=tokenRow(rawToken,"OWNER_ACCESS");if(!token)return null;
  const row=getDb().prepare(`SELECT s.id,s.tracking_number,s.sender_name,s.receiver_name,s.state,s.delivery_pin_cipher,c.name company_name,c.handle company_handle,b.primary_color FROM shipments s JOIN companies c ON c.id=s.company_id JOIN company_branding b ON b.company_id=c.id WHERE s.id=?`).get(token.entity_id) as any;
  if(!row)return null;
  row.deliveryPin=decryptSecret(row.delivery_pin_cipher);delete row.delivery_pin_cipher;
  return row;
}

export function customerPortal(userId:string):any{
  const db=getDb();
  const shipments=db.prepare(`SELECT DISTINCT s.*,c.name company_name,c.handle company_handle,cu.user_id owner_user_id,at.token_cipher tracking_cipher,oa.token_cipher owner_cipher FROM shipments s JOIN companies c ON c.id=s.company_id LEFT JOIN customers cu ON cu.id=s.owner_customer_id LEFT JOIN access_tokens at ON at.entity_id=s.id AND at.entity_type='TRACKING' AND at.revoked_at IS NULL LEFT JOIN access_tokens oa ON oa.entity_id=s.id AND oa.entity_type='OWNER_ACCESS' AND oa.revoked_at IS NULL WHERE cu.user_id=? OR EXISTS (SELECT 1 FROM users u WHERE u.id=? AND (u.phone=s.sender_phone OR u.phone=s.receiver_phone)) ORDER BY s.created_at DESC`).all(userId,userId) as any[];
  return shipments.map((s)=>({...s,trackingToken:s.tracking_cipher?decryptSecret(s.tracking_cipher):null,ownerToken:s.owner_user_id===userId&&s.owner_cipher?decryptSecret(s.owner_cipher):null,tracking_cipher:undefined,owner_cipher:undefined}));
}

export function resolveQr(ctx:MemberContext,raw:string):{type:"SHIPMENT"|"BATCH";id:string;label:string}|null{
  const row=getDb().prepare(`SELECT at.entity_type,at.entity_id,CASE WHEN at.entity_type='QR_SHIPMENT' THEN (SELECT tracking_number FROM shipments WHERE id=at.entity_id) ELSE (SELECT batch_number FROM dispatch_batches WHERE id=at.entity_id) END label FROM access_tokens at WHERE at.company_id=? AND at.token_hash=? AND at.entity_type IN ('QR_SHIPMENT','QR_BATCH') AND at.revoked_at IS NULL`).get(ctx.companyId,sha256(raw)) as any;
  if(!row)return null;
  return {type:row.entity_type==="QR_SHIPMENT"?"SHIPMENT":"BATCH",id:row.entity_id,label:row.label};
}

export function getLabelData(ctx:MemberContext,type:"shipment"|"batch",entityId:string):any{
  const db=getDb();
  if(type==="shipment"){
    const row=db.prepare(`SELECT s.*,c.name company_name,b.logo_mark,at.token_cipher qr_cipher,o.code origin_code,d.code destination_code,js.destination_label next_destination,rl.code next_route_code FROM shipments s JOIN companies c ON c.id=s.company_id JOIN company_branding b ON b.company_id=c.id JOIN access_tokens at ON at.entity_id=s.id AND at.entity_type='QR_SHIPMENT' AND at.revoked_at IS NULL LEFT JOIN locations o ON o.id=s.origin_location_id LEFT JOIN locations d ON d.id=s.destination_location_id LEFT JOIN journey_steps js ON js.shipment_id=s.id AND js.sequence=s.current_step_index+1 LEFT JOIN route_legs rl ON rl.id=js.route_leg_id WHERE s.id=? AND s.company_id=?`).get(entityId,ctx.companyId) as any;
    if(!row)throw new Error("Shipment not found.");
    ensureLocationScope(ctx,[row.current_location_id,row.origin_location_id,row.destination_location_id]);
    return {...row,qrToken:decryptSecret(row.qr_cipher)};
  }
  const row=db.prepare(`SELECT b.*,c.name company_name,cb.logo_mark,rl.code route_code,o.name origin_name,d.name destination_name,at.token_cipher qr_cipher,(SELECT COUNT(*) FROM batch_memberships bm WHERE bm.batch_id=b.id AND bm.active=1) shipment_count FROM dispatch_batches b JOIN companies c ON c.id=b.company_id JOIN company_branding cb ON cb.company_id=c.id JOIN route_legs rl ON rl.id=b.route_leg_id JOIN locations o ON o.id=rl.origin_location_id JOIN locations d ON d.id=rl.destination_location_id JOIN access_tokens at ON at.entity_id=b.id AND at.entity_type='QR_BATCH' AND at.revoked_at IS NULL WHERE b.id=? AND b.company_id=?`).get(entityId,ctx.companyId) as any;
  if(!row)throw new Error("Batch not found.");
  const routeScope=db.prepare(`SELECT origin_location_id,destination_location_id FROM route_legs WHERE id=? AND company_id=?`).get(row.route_leg_id,ctx.companyId) as any;
  ensureLocationScope(ctx,[routeScope?.origin_location_id,routeScope?.destination_location_id]);
  return {...row,qrToken:decryptSecret(row.qr_cipher)};
}

export function createLocation(ctx:MemberContext,input:{name:string;code:string;city:string;area:string;phone?:string;capabilities:string[]}):string{
  const db=getDb();const locationId=id("loc");
  db.prepare(`INSERT INTO locations (id,company_id,name,code,city,area,phone,capabilities_json,active,public_visible,created_at) VALUES (?,?,?,?,?,?,?,?,1,1,?)`)
    .run(locationId,ctx.companyId,required(input.name.trim(),"Location name"),required(input.code.trim().toUpperCase(),"Location code"),required(input.city.trim(),"City"),required(input.area.trim(),"Area or landmark"),input.phone?.trim()||null,JSON.stringify(input.capabilities),now());
  audit(db,ctx,"LOCATION_CREATED","LOCATION",locationId,undefined,undefined,input);
  return locationId;
}

export function createRouteLeg(ctx:MemberContext,input:{name:string;code:string;originLocationId:string;destinationLocationId:string;estimatedHours:number;priority:number}):string{
  if(input.originLocationId===input.destinationLocationId)throw new Error("Origin and destination must be different.");
  const db=getDb();const routeId=id("leg");
  db.prepare(`INSERT INTO route_legs (id,company_id,name,code,origin_location_id,destination_location_id,estimated_hours,priority,departure_label,arrival_label,active,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,1,?)`)
    .run(routeId,ctx.companyId,required(input.name.trim(),"Route name"),required(input.code.trim().toUpperCase(),"Route code"),input.originLocationId,input.destinationLocationId,input.estimatedHours||1,input.priority||10,`Departed ${input.name.split(" to ")[0]||"origin"}`,`Arrived at destination`,now());
  audit(db,ctx,"ROUTE_LEG_CREATED","ROUTE_LEG",routeId,undefined,undefined,input);
  return routeId;
}

export function createTeamMember(ctx:MemberContext,input:{name:string;email:string;phone?:string;password:string;role:string;locationIds:string[]}):string{
  if(input.password.length<10)throw new Error("Temporary password must contain at least 10 characters.");
  const db=getDb();const userId=id("usr");const memberId=id("mem");
  const role=["ADMIN","SUPERVISOR","TEAM_MEMBER","VIEWER"].includes(input.role)?input.role:"TEAM_MEMBER";
  const tx=db.transaction(()=>{
    db.prepare(`INSERT INTO users (id,email,phone,name,password_hash,platform_role,locale,active,created_at) VALUES (?,?,?,?,?,'NONE','en',1,?)`)
      .run(userId,input.email.trim().toLowerCase(),input.phone?.trim()||null,required(input.name.trim(),"Name"),hashPin(required(input.password,"Temporary password")),now());
    db.prepare(`INSERT INTO company_members (id,company_id,user_id,role,active,created_at) VALUES (?,?,?,?,1,?)`).run(memberId,ctx.companyId,userId,role,now());
    const add=db.prepare(`INSERT INTO member_locations (company_id,member_id,location_id) VALUES (?,?,?)`);
    for(const locationId of input.locationIds)add.run(ctx.companyId,memberId,locationId);
    audit(db,ctx,"TEAM_MEMBER_CREATED","COMPANY_MEMBER",memberId,undefined,undefined,{...input,password:"[REDACTED]"});
  });tx();return memberId;
}

export function updateBranding(ctx:MemberContext,input:{tagline:string;story:string;phone:string;email?:string;primary:string;secondary:string;accent:string;heroStyle:string}):void{
  const db=getDb();
  const before=db.prepare(`SELECT c.tagline,c.story,c.phone,c.email,b.* FROM companies c JOIN company_branding b ON b.company_id=c.id WHERE c.id=?`).get(ctx.companyId);
  const tx=db.transaction(()=>{
    db.prepare(`UPDATE companies SET tagline=?,story=?,phone=?,email=? WHERE id=?`).run(input.tagline.trim(),input.story.trim(),input.phone.trim(),input.email?.trim()||null,ctx.companyId);
    db.prepare(`UPDATE company_branding SET primary_color=?,secondary_color=?,accent_color=?,hero_style=?,updated_at=? WHERE company_id=?`).run(input.primary,input.secondary,input.accent,["split","centered","editorial"].includes(input.heroStyle)?input.heroStyle:"split",now(),ctx.companyId);
    audit(db,ctx,"BRANDING_UPDATED","COMPANY",ctx.companyId,undefined,before,input);
  });tx();
}

export function createCompanyByAdmin(adminUserId:string,input:{name:string;handle:string;phone:string;email?:string;ownerName:string;ownerEmail:string;ownerPhone?:string;temporaryPassword:string}):string{
  if(input.temporaryPassword.length<10)throw new Error("Temporary owner password must contain at least 10 characters.");
  const db=getDb();const companyId=id("cmp");const userId=id("usr");const memberId=id("mem");const created=now();
  const handle=input.handle.trim().toLowerCase().replace(/[^a-z0-9-]/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");
  if(handle.length<3)throw new Error("Company handle must contain at least three letters or numbers.");
  const tx=db.transaction(()=>{
    db.prepare(`INSERT INTO companies (id,handle,name,tagline,story,email,phone,status,default_locale,created_at) VALUES (?,?,?,?,?,?,?,'ACTIVE','en',?)`)
      .run(companyId,handle,input.name.trim(),`${input.name.trim()} delivery services.`,`Tell customers how ${input.name.trim()} serves them.`,input.email?.trim()||null,input.phone.trim(),created);
    db.prepare(`INSERT INTO company_branding (company_id,logo_mark,primary_color,secondary_color,accent_color,hero_style,updated_at) VALUES (?,?,?,?,?,'split',?)`)
      .run(companyId,input.name.trim().split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase(),"#135c67","#102c32","#f2a65a",created);
    db.prepare(`INSERT INTO users (id,email,phone,name,password_hash,platform_role,locale,active,created_at) VALUES (?,?,?,?,?,'NONE','en',1,?)`)
      .run(userId,input.ownerEmail.trim().toLowerCase(),input.ownerPhone?.trim()||null,input.ownerName.trim(),hashPin(input.temporaryPassword),created);
    db.prepare(`INSERT INTO company_members (id,company_id,user_id,role,active,created_at) VALUES (?,?,?,'OWNER',1,?)`).run(memberId,companyId,userId,created);
    db.prepare(`INSERT INTO company_contracts (id,company_id,model,amount,currency,billing_frequency,notes,active,created_at,updated_at) VALUES (?,?,'CUSTOM',0,'ETB','MONTHLY','Contract not yet configured.',1,?,?)`).run(id("ctr"),companyId,created,created);
    db.prepare(`INSERT INTO audit_logs (id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES (?,?,?,?,?,?,?)`).run(id("aud"),adminUserId,"COMPANY_CREATED","COMPANY",companyId,JSON.stringify({handle,ownerEmail:input.ownerEmail}),created);
  });tx();return companyId;
}

export function setCompanyStatus(adminUserId:string,companyId:string,status:"ACTIVE"|"SUSPENDED",reason:string):void{
  const db=getDb();const before=db.prepare(`SELECT status FROM companies WHERE id=?`).get(companyId) as any;if(!before)throw new Error("Company not found.");
  db.prepare(`UPDATE companies SET status=? WHERE id=?`).run(status,companyId);
  db.prepare(`INSERT INTO audit_logs (id,company_id,actor_user_id,action,entity_type,entity_id,reason,before_json,after_json,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(id("aud"),companyId,adminUserId,`COMPANY_${status}`,"COMPANY",companyId,reason,JSON.stringify(before),JSON.stringify({status}),now());
}

export function getEvidenceForRequest(ctx:MemberContext,requestId:string):any|null{
  return getDb().prepare(`SELECT photo_path FROM shipment_requests WHERE id=? AND company_id=?`).get(requestId,ctx.companyId) as any;
}

export function getEvidenceRecord(evidenceId:string):any|null{
  return getDb().prepare(`SELECT * FROM evidence_files WHERE id=?`).get(evidenceId) as any;
}
