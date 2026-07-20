import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

test("MaliktBoard server workflow regression suite", async (t) => {
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),"maliktboard-test-"));
  process.env.DATABASE_PATH=path.join(temp,"test.db");
  process.env.UPLOAD_DIR=path.join(temp,"uploads");
  process.env.SEED_DEMO="true";
  process.env.PIN_ENCRYPTION_KEY="test-key-for-encryption";
  const services=await import("../lib/services");
  const {getDb}=await import("../lib/db");
  const {decryptSecret}=await import("../lib/crypto");
  const db=getDb();
  const ctx:any={user:{id:"usr_supervisor",name:"Dawit",email:"supervisor@bluenile.local",phone:null,platformRole:"NONE",locale:"en"},memberId:"mem_supervisor",companyId:"cmp_blue",companyName:"Blue Nile Delivery",companyHandle:"bluenile",companyStatus:"ACTIVE",role:"SUPERVISOR",locationIds:["loc_bole","loc_addis","loc_hawassa","loc_hawassa_store"]};

  await t.test("activation is blocked until customer acceptance and is one-time",async()=>{
    await assert.rejects(()=>services.activateShipment(ctx,"req_pending"),/customer must accept/i);
    await services.issueQuote(ctx,"req_pending",900,"2026-07-25");
    await services.customerQuoteDecision("demo-quote-pending","ACCEPT");
    const result=await services.activateShipment(ctx,"req_pending");
    assert.ok(result.shipmentId);
    await assert.rejects(()=>services.activateShipment(ctx,"req_pending"),/accept|already/i);
    const count=(db.prepare(`SELECT COUNT(*) count FROM shipments WHERE request_id='req_pending'`).get() as any).count;
    assert.equal(count,1);
    services.receiveShipment(ctx,result.shipmentId,"receive-idempotent-test");
    services.receiveShipment(ctx,result.shipmentId,"receive-idempotent-test");
    const receivedEvents=(db.prepare(`SELECT COUNT(*) count FROM shipment_events WHERE shipment_id=? AND idempotency_key='receive-idempotent-test'`).get(result.shipmentId) as any).count;
    assert.equal(receivedEvents,1);
  });

  await t.test("same-location collection becomes ready immediately after receipt",async()=>{
    const created=new Date().toISOString();
    db.prepare(`INSERT INTO customers (id,company_id,name,phone,created_at) VALUES ('cus_same','cmp_blue','Same Location Customer','+251900000001',?)`).run(created);
    db.prepare(`INSERT INTO shipment_requests (id,company_id,owner_customer_id,owner_role,sender_name,sender_phone,receiver_name,receiver_phone,origin_mode,origin_location_id,destination_mode,destination_location_id,contents,description,state,submitted_at,updated_at) VALUES ('req_same','cmp_blue','cus_same','SENDER','Same Location Customer','+251900000001','Receiver','+251900000002','DROP_OFF','loc_hawassa_store','COLLECTION','loc_hawassa_store','Envelope','Same location package','CUSTOMER_ACCEPTED',?,?)`).run(created,created);
    db.prepare(`INSERT INTO quotes (id,company_id,request_id,amount,currency,expires_at,status,issued_by,issued_at,accepted_at) VALUES ('quo_same','cmp_blue','req_same',100,'ETB',?,'ACCEPTED','usr_supervisor',?,?)`).run(new Date(Date.now()+86400000).toISOString(),created,created);
    const result=await services.activateShipment(ctx,"req_same");
    services.receiveShipment(ctx,result.shipmentId,"same-location-receive");
    const shipment=db.prepare(`SELECT state FROM shipments WHERE id=?`).get(result.shipmentId) as any;
    assert.equal(shipment.state,"READY_FOR_COLLECTION");
  });

  await t.test("non-owner shipment participant cannot access owner Delivery PIN link",async()=>{
    const created=new Date().toISOString();
    const {hashPassword}=await import("../lib/crypto");
    db.prepare(`INSERT INTO users (id,email,phone,name,password_hash,platform_role,locale,created_at) VALUES ('usr_receiver_test','receiver@test.local','+251911300500','Receiver User',?,'NONE','en',?)`).run(hashPassword("ReceiverPassword123!"),created);
    const rows=services.customerPortal("usr_receiver_test");
    const shipment=rows.find((row:any)=>row.id==="shp_demo");
    assert.ok(shipment);
    assert.equal(shipment.ownerToken,null);
    assert.ok(shipment.trackingToken);
  });

  await t.test("batch arrival skips a shipment that became cancelled",()=>{
    services.addShipmentToBatch(ctx,"shp_demo","bat_demo","test-load-demo");
    services.transitionBatch(ctx,"bat_demo","SEALED",undefined,"test-seal-demo");
    const departure=services.transitionBatch(ctx,"bat_demo","DISPATCHED",undefined,"test-depart-demo");
    assert.equal(departure.updated,1);
    db.prepare(`UPDATE shipments SET state='CANCELLED' WHERE id='shp_demo'`).run();
    const arrival=services.transitionBatch(ctx,"bat_demo","ARRIVED",undefined,"test-arrive-demo");
    assert.equal(arrival.updated,0);
    assert.equal(arrival.skipped,1);
    assert.equal((db.prepare(`SELECT state FROM shipments WHERE id='shp_demo'`).get() as any).state,"CANCELLED");
  });

  await t.test("delivery requires final handoff state and cannot be repeated",async()=>{
    const shipmentId=(db.prepare(`SELECT id FROM shipments WHERE request_id='req_pending'`).get() as any).id;
    db.prepare(`UPDATE journey_steps SET state='COMPLETED' WHERE shipment_id=? AND step_type='ROUTE_LEG'`).run(shipmentId);
    const final=(db.prepare(`SELECT sequence FROM journey_steps WHERE shipment_id=? AND step_type='COLLECTION'`).get(shipmentId) as any).sequence;
    db.prepare(`UPDATE journey_steps SET state='READY' WHERE shipment_id=? AND sequence=?`).run(shipmentId,final);
    db.prepare(`UPDATE shipments SET state='READY_FOR_COLLECTION',current_step_index=? WHERE id=?`).run(final-1,shipmentId);
    const proof=new File([new Uint8Array([1,2,3])],"proof.jpg",{type:"image/jpeg"});
    await assert.rejects(()=>services.completeDelivery(ctx,shipmentId,"000000","Receiver",proof),/incorrect/i);
    const failedAttempts=(db.prepare(`SELECT COUNT(*) count FROM delivery_pin_attempts WHERE shipment_id=? AND successful=0`).get(shipmentId) as any).count;
    assert.equal(failedAttempts,1);
    const pin=decryptSecret((db.prepare(`SELECT delivery_pin_cipher FROM shipments WHERE id=?`).get(shipmentId) as any).delivery_pin_cipher);
    await services.completeDelivery(ctx,shipmentId,pin,"Receiver",proof);
    assert.equal((db.prepare(`SELECT state FROM shipments WHERE id=?`).get(shipmentId) as any).state,"DELIVERED");
    await assert.rejects(()=>services.completeDelivery(ctx,shipmentId,pin,"Receiver",proof),/eligible|already/i);
    const events=(db.prepare(`SELECT COUNT(*) count FROM shipment_events WHERE shipment_id=? AND event_type='DELIVERED'`).get(shipmentId) as any).count;
    assert.equal(events,1);
  });
  fs.rmSync(temp,{recursive:true,force:true});
});
