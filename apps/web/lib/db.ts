import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { env, projectRoot } from "./env";
import { encryptSecret, hashPassword, hashPin, id, sha256 } from "./crypto";

type Sqlite = DatabaseSync & { transaction<T>(fn: () => T): () => T };

declare global {
  // eslint-disable-next-line no-var
  var __maliktboardDb: Sqlite | undefined;
}

function initialize(db: Sqlite): void {
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA journal_mode = WAL;");
  const schema = fs.readFileSync(path.join(projectRoot, "apps/web/db/schema.sql"), "utf8");
  db.exec(schema);
}

function addAccessToken(db: Sqlite, companyId: string, entityType: string, entityId: string, raw: string, expiresAt: string | null = null): void {
  db.prepare(`INSERT INTO access_tokens (id, company_id, entity_type, entity_id, token_hash, token_cipher, expires_at, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id("tok"), companyId, entityType, entityId, sha256(raw), encryptSecret(raw), expiresAt, new Date().toISOString());
}

function bootstrapAdmin(db: Sqlite): void {
  const count = db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
  if (count.count > 0) return;
  if (!env.bootstrapAdminEmail || !env.bootstrapAdminPassword) {
    throw new Error("The database is empty. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD, or enable SEED_DEMO for a demonstration installation.");
  }
  const createdAt = new Date().toISOString();
  db.prepare(`INSERT INTO users (id,email,name,password_hash,platform_role,locale,created_at) VALUES (?,?,?,?, 'ADMIN','en',?)`)
    .run(id("usr"), env.bootstrapAdminEmail.toLowerCase(), env.bootstrapAdminName, hashPassword(env.bootstrapAdminPassword), createdAt);
}

function seed(db: Sqlite): void {
  const count = db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
  if (count.count > 0) return;
  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    const users = [
      ["usr_platform", "admin@maliktboard.local", null, "MaliktBoard Admin", "Admin123!", "ADMIN", "en"],
      ["usr_owner", "owner@bluenile.local", "+251911000101", "Mekdes Alemu", "Owner123!", "NONE", "en"],
      ["usr_supervisor", "supervisor@bluenile.local", "+251911000102", "Dawit Bekele", "Supervisor123!", "NONE", "am"],
      ["usr_team", "team@bluenile.local", "+251911000103", "Hana Girma", "Team123!", "NONE", "am"],
      ["usr_viewer", "viewer@bluenile.local", "+251911000104", "Noah Tadesse", "Viewer123!", "NONE", "en"],
      ["usr_customer", "customer@example.com", "+251911300400", "Amina Mohammed", "Customer123!", "NONE", "om"],
      ["usr_owner2", "owner@oromiya.local", "+251922000101", "Bontu Fikadu", "Owner123!", "NONE", "om"]
    ];
    const insertUser = db.prepare(`INSERT INTO users (id,email,phone,name,password_hash,platform_role,locale,created_at) VALUES (?,?,?,?,?,?,?,?)`);
    for (const [userId,email,phone,name,password,platformRole,locale] of users) insertUser.run(userId,email,phone,name,hashPassword(String(password)),platformRole,locale,now);

    const insertCompany = db.prepare(`INSERT INTO companies (id,handle,name,tagline,story,email,phone,status,default_locale,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`);
    insertCompany.run("cmp_blue", "bluenile", "Blue Nile Delivery", "Every package, clearly handed forward.", "Blue Nile Delivery connects neighborhood shipping stores, transfer hubs, and motorcycle delivery teams across Ethiopia. Customers get a clear request, quote, and tracking experience while the operations team moves every package through a planned route.", "hello@bluenile.local", "+251911222333", "ACTIVE", "en", now);
    insertCompany.run("cmp_oromia", "oromiyaexpress", "Oromiya Express", "From your town to their hands.", "Oromiya Express provides reliable domestic delivery through a growing branch network and clear handoff controls.", "hello@oromiya.local", "+251922333444", "ACTIVE", "om", now);

    const insertBrand = db.prepare(`INSERT INTO company_branding (company_id,logo_mark,primary_color,secondary_color,accent_color,hero_style,contact_cta,request_cta,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`);
    insertBrand.run("cmp_blue","BN","#135c67","#102c32","#f2a65a","split","Contact Blue Nile","Request a shipment",now);
    insertBrand.run("cmp_oromia","OE","#285c3a","#183827","#e1ad52","editorial","Nu qunnamaa","Ergaa gaafadhu",now);

    const insertMember = db.prepare(`INSERT INTO company_members (id,company_id,user_id,role,active,created_at) VALUES (?,?,?,?,1,?)`);
    insertMember.run("mem_owner","cmp_blue","usr_owner","OWNER",now);
    insertMember.run("mem_supervisor","cmp_blue","usr_supervisor","SUPERVISOR",now);
    insertMember.run("mem_team","cmp_blue","usr_team","TEAM_MEMBER",now);
    insertMember.run("mem_viewer","cmp_blue","usr_viewer","VIEWER",now);
    insertMember.run("mem_owner2","cmp_oromia","usr_owner2","OWNER",now);

    const insertLocation = db.prepare(`INSERT INTO locations (id,company_id,name,code,city,area,phone,capabilities_json,active,public_visible,created_at) VALUES (?,?,?,?,?,?,?,?,1,1,?)`);
    insertLocation.run("loc_bole","cmp_blue","Bole Shipping Store","BOL-ST","Addis Ababa","Near Bole Medhanialem","+251911220001",JSON.stringify(["DROP_OFF","PICKUP","DISPATCH_BATCH","STORAGE"]),now);
    insertLocation.run("loc_addis","cmp_blue","Addis Main Hub","ADD-HUB","Addis Ababa","Kality logistics area","+251911220002",JSON.stringify(["RECEIVE_BATCH","DISPATCH_BATCH","TRANSFER","STORAGE","EXCEPTIONS"]),now);
    insertLocation.run("loc_hawassa","cmp_blue","Hawassa Transfer Hub","HWS-HUB","Hawassa","Industrial area","+251911220003",JSON.stringify(["RECEIVE_BATCH","DISPATCH_BATCH","TRANSFER","STORAGE","FINAL_DELIVERY"]),now);
    insertLocation.run("loc_hawassa_store","cmp_blue","Hawassa Receiving Store","HWS-RS","Hawassa","Piazza landmark","+251911220004",JSON.stringify(["RECEIVE_BATCH","CUSTOMER_COLLECTION","FINAL_DELIVERY"]),now);
    insertLocation.run("loc_adama","cmp_oromia","Adama Main Branch","ADA-MB","Adama","Near post office","+251922330001",JSON.stringify(["DROP_OFF","PICKUP","RECEIVE_BATCH","DISPATCH_BATCH","TRANSFER"]),now);
    insertLocation.run("loc_jimma","cmp_oromia","Jimma Receiving Store","JIM-RS","Jimma","Central market","+251922330002",JSON.stringify(["RECEIVE_BATCH","CUSTOMER_COLLECTION","FINAL_DELIVERY"]),now);

    const insertMemberLoc = db.prepare(`INSERT INTO member_locations (company_id,member_id,location_id) VALUES (?,?,?)`);
    for (const loc of ["loc_bole","loc_addis","loc_hawassa","loc_hawassa_store"]) insertMemberLoc.run("cmp_blue","mem_owner",loc);
    for (const loc of ["loc_addis","loc_hawassa"]) insertMemberLoc.run("cmp_blue","mem_supervisor",loc);
    insertMemberLoc.run("cmp_blue","mem_team","loc_hawassa");
    insertMemberLoc.run("cmp_blue","mem_viewer","loc_addis");
    for (const loc of ["loc_adama","loc_jimma"]) insertMemberLoc.run("cmp_oromia","mem_owner2",loc);

    const insertLeg = db.prepare(`INSERT INTO route_legs (id,company_id,name,code,origin_location_id,destination_location_id,estimated_hours,priority,departure_label,arrival_label,active,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,1,?)`);
    insertLeg.run("leg_bole_addis","cmp_blue","Bole Store to Addis Hub","BOL-ADD","loc_bole","loc_addis",2,10,"Departed Bole Shipping Store","Arrived at Addis Main Hub",now);
    insertLeg.run("leg_addis_hawassa","cmp_blue","Addis to Hawassa","ADD-HWS","loc_addis","loc_hawassa",6,10,"Departed Addis Main Hub","Arrived at Hawassa Transfer Hub",now);
    insertLeg.run("leg_hawassa_store","cmp_blue","Hawassa Hub to Receiving Store","HWS-RS","loc_hawassa","loc_hawassa_store",1,10,"Departed Hawassa Transfer Hub","Arrived at Hawassa Receiving Store",now);
    insertLeg.run("leg_adama_jimma","cmp_oromia","Adama to Jimma","ADA-JIM","loc_adama","loc_jimma",7,10,"Adama irraa ka'e","Jimmaa ga'e",now);

    const insertCustomer = db.prepare(`INSERT INTO customers (id,company_id,user_id,name,phone,email,created_at) VALUES (?,?,?,?,?,?,?)`);
    insertCustomer.run("cus_amira","cmp_blue","usr_customer","Amina Mohammed","+251911300400","customer@example.com",now);
    insertCustomer.run("cus_guest","cmp_blue",null,"Kedir Ahmed","+251911300401","kedir@example.com",now);

    const insertRequest = db.prepare(`INSERT INTO shipment_requests (id,company_id,owner_customer_id,owner_role,sender_name,sender_phone,receiver_name,receiver_phone,origin_mode,origin_location_id,pickup_area,destination_mode,destination_location_id,delivery_area,contents,description,estimated_weight_kg,fragile,photo_path,state,submitted_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    insertRequest.run("req_pending","cmp_blue","cus_guest","SENDER","Kedir Ahmed","+251911300401","Rahma Ali","+251911300402","DROP_OFF","loc_bole",null,"COLLECTION","loc_hawassa_store",null,"Clothing","One sealed clothing package",2.5,0,null,"SUBMITTED",now,now);
    insertRequest.run("req_active","cmp_blue","cus_amira","SENDER","Amina Mohammed","+251911300400","Samira Yusuf","+251911300500","DROP_OFF","loc_bole",null,"DELIVERY","loc_hawassa_store","Tabor area, call on arrival","Documents","Protected document envelope",0.8,0,null,"COMPANY_CONFIRMED",now,now);

    const tomorrow = new Date(Date.now()+86400000).toISOString().slice(0,10);
    db.prepare(`INSERT INTO quotes (id,company_id,request_id,amount,currency,expires_at,expected_delivery_date,notes,status,issued_by,issued_at,accepted_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run("quo_active","cmp_blue","req_active",750,"ETB",new Date(Date.now()+3*86400000).toISOString(),tomorrow,"Final amount may change after inspection.","ACCEPTED","usr_supervisor",now,now);

    const pin = "482913";
    db.prepare(`INSERT INTO shipments (id,company_id,request_id,tracking_number,qr_identifier_hash,owner_customer_id,sender_name,sender_phone,receiver_name,receiver_phone,contents,description,origin_label,destination_label,origin_location_id,destination_location_id,destination_mode,state,payment_status,preliminary_amount,currency,estimated_delivery_date,current_location_id,current_step_index,delivery_pin_hash,delivery_pin_cipher,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run("shp_demo","cmp_blue","req_active","MB-104829",sha256("demo-shipment-qr"),"cus_amira","Amina Mohammed","+251911300400","Samira Yusuf","+251911300500","Documents","Protected document envelope","Bole Shipping Store","Tabor area, Hawassa","loc_bole","loc_hawassa_store","DELIVERY","RECEIVED_BY_COMPANY","UNPAID",750,"ETB",tomorrow,"loc_bole",0,hashPin(pin),encryptSecret(pin),now,now);

    const insertStep = db.prepare(`INSERT INTO journey_steps (id,company_id,shipment_id,sequence,step_type,route_leg_id,origin_label,destination_label,state) VALUES (?,?,?,?,?,?,?,?,?)`);
    insertStep.run("step_1","cmp_blue","shp_demo",1,"ROUTE_LEG","leg_bole_addis","Bole Shipping Store","Addis Main Hub","READY");
    insertStep.run("step_2","cmp_blue","shp_demo",2,"ROUTE_LEG","leg_addis_hawassa","Addis Main Hub","Hawassa Transfer Hub","PENDING");
    insertStep.run("step_3","cmp_blue","shp_demo",3,"ROUTE_LEG","leg_hawassa_store","Hawassa Transfer Hub","Hawassa Receiving Store","PENDING");
    insertStep.run("step_4","cmp_blue","shp_demo",4,"FINAL_DELIVERY",null,"Hawassa Receiving Store","Tabor area, Hawassa","PENDING");

    db.prepare(`INSERT INTO shipment_events (id,company_id,shipment_id,event_type,title,description,location_id,customer_visible,actor_user_id,occurred_at,idempotency_key) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run("evt_confirmed","cmp_blue","shp_demo","SHIPMENT_CONFIRMED","Shipment confirmed","Blue Nile Delivery confirmed the shipment and created its journey.","loc_bole",1,"usr_supervisor",now,"seed-confirmed");
    db.prepare(`INSERT INTO shipment_events (id,company_id,shipment_id,event_type,title,description,location_id,customer_visible,actor_user_id,occurred_at,idempotency_key) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run("evt_received","cmp_blue","shp_demo","SHIPMENT_RECEIVED","Shipment received","The package was received by Blue Nile Delivery.","loc_bole",1,"usr_team",now,"seed-received");

    addAccessToken(db,"cmp_blue","TRACKING","shp_demo","demo-track-blue-nile");
    addAccessToken(db,"cmp_blue","OWNER_ACCESS","shp_demo","demo-owner-blue-nile");
    addAccessToken(db,"cmp_blue","QR_SHIPMENT","shp_demo","demo-shipment-qr");
    addAccessToken(db,"cmp_blue","REQUEST_QUOTE","req_pending","demo-quote-pending",new Date(Date.now()+3*86400000).toISOString());

    db.prepare(`INSERT INTO dispatch_batches (id,company_id,batch_number,qr_identifier_hash,route_leg_id,state,expected_departure,expected_arrival,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run("bat_demo","cmp_blue","BATCH-BOL-ADD-0048",sha256("demo-batch-qr"),"leg_bole_addis","OPEN",new Date(Date.now()+3600000).toISOString(),new Date(Date.now()+10800000).toISOString(),"usr_supervisor",now,now);
    addAccessToken(db,"cmp_blue","QR_BATCH","bat_demo","demo-batch-qr");

    db.prepare(`INSERT INTO company_contracts (id,company_id,model,amount,currency,billing_frequency,notes,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run("ctr_blue","cmp_blue","CUSTOM",0,"ETB","MONTHLY","Pilot contract; review shipment and team activity monthly.",1,now,now);
    db.prepare(`INSERT INTO company_contracts (id,company_id,model,amount,currency,billing_frequency,notes,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run("ctr_oromia","cmp_oromia","FLAT",0,"ETB","MONTHLY","Demo tenant.",1,now,now);
  });
  tx();
}

export function openDatabase(filename: string, withSeed = false): Sqlite {
  if (filename !== ":memory:") fs.mkdirSync(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename) as Sqlite;
  db.transaction = <T>(fn: () => T) => () => {
    db.exec("BEGIN IMMEDIATE;");
    try { const result = fn(); db.exec("COMMIT;"); return result; }
    catch (error) { db.exec("ROLLBACK;"); throw error; }
  };
  initialize(db);
  if (withSeed) seed(db);
  else bootstrapAdmin(db);
  return db;
}

export function getDb(): Sqlite {
  if (!global.__maliktboardDb) global.__maliktboardDb = openDatabase(env.databasePath, env.seedDemo);
  return global.__maliktboardDb;
}
