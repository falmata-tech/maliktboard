PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  platform_role TEXT NOT NULL DEFAULT 'NONE' CHECK(platform_role IN ('NONE','ADMIN')),
  locale TEXT NOT NULL DEFAULT 'en' CHECK(locale IN ('en','am','om')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  token_cipher TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  story TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','SUSPENDED')),
  default_locale TEXT NOT NULL DEFAULT 'en' CHECK(default_locale IN ('en','am','om')),
  created_at TEXT NOT NULL,
  UNIQUE(id, id)
);

CREATE TABLE IF NOT EXISTS company_branding (
  company_id TEXT PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  logo_mark TEXT NOT NULL DEFAULT 'M',
  primary_color TEXT NOT NULL DEFAULT '#135c67',
  secondary_color TEXT NOT NULL DEFAULT '#102c32',
  accent_color TEXT NOT NULL DEFAULT '#f2a65a',
  hero_style TEXT NOT NULL DEFAULT 'split' CHECK(hero_style IN ('split','centered','editorial')),
  contact_cta TEXT NOT NULL DEFAULT 'Contact us',
  request_cta TEXT NOT NULL DEFAULT 'Request a shipment',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS company_members (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('OWNER','ADMIN','SUPERVISOR','TEAM_MEMBER','VIEWER')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE(company_id, user_id),
  UNIQUE(company_id, id)
);

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  phone TEXT,
  capabilities_json TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1,
  public_visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE(company_id, code),
  UNIQUE(company_id, id)
);

CREATE TABLE IF NOT EXISTS member_locations (
  company_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  PRIMARY KEY(member_id, location_id),
  FOREIGN KEY(company_id, member_id) REFERENCES company_members(company_id, id) ON DELETE CASCADE,
  FOREIGN KEY(company_id, location_id) REFERENCES locations(company_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS route_legs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  origin_location_id TEXT NOT NULL,
  destination_location_id TEXT NOT NULL,
  estimated_hours REAL NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 10,
  departure_label TEXT NOT NULL DEFAULT 'Departed',
  arrival_label TEXT NOT NULL DEFAULT 'Arrived',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  CHECK(origin_location_id <> destination_location_id),
  UNIQUE(company_id, code),
  UNIQUE(company_id, id),
  FOREIGN KEY(company_id, origin_location_id) REFERENCES locations(company_id, id),
  FOREIGN KEY(company_id, destination_location_id) REFERENCES locations(company_id, id)
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(company_id, phone),
  UNIQUE(company_id, id)
);

CREATE TABLE IF NOT EXISTS shipment_requests (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  owner_customer_id TEXT NOT NULL,
  owner_role TEXT NOT NULL CHECK(owner_role IN ('SENDER','RECEIVER')),
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
  origin_mode TEXT NOT NULL CHECK(origin_mode IN ('DROP_OFF','PICKUP')),
  origin_location_id TEXT,
  pickup_area TEXT,
  destination_mode TEXT NOT NULL CHECK(destination_mode IN ('COLLECTION','DELIVERY')),
  destination_location_id TEXT,
  delivery_area TEXT,
  contents TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_weight_kg REAL,
  fragile INTEGER NOT NULL DEFAULT 0,
  photo_path TEXT,
  state TEXT NOT NULL CHECK(state IN ('SUBMITTED','UNDER_REVIEW','PRELIMINARY_QUOTE_ISSUED','CUSTOMER_ACCEPTED','COMPANY_CONFIRMED','EXPIRED','ABANDONED','REJECTED','CANCELLED')),
  submitted_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(company_id, id),
  FOREIGN KEY(company_id, owner_customer_id) REFERENCES customers(company_id, id),
  FOREIGN KEY(company_id, origin_location_id) REFERENCES locations(company_id, id),
  FOREIGN KEY(company_id, destination_location_id) REFERENCES locations(company_id, id)
);

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL UNIQUE,
  amount REAL NOT NULL CHECK(amount >= 0),
  currency TEXT NOT NULL DEFAULT 'ETB',
  expires_at TEXT NOT NULL,
  expected_delivery_date TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ISSUED' CHECK(status IN ('ISSUED','ACCEPTED','EXPIRED','ABANDONED')),
  issued_by TEXT NOT NULL REFERENCES users(id),
  issued_at TEXT NOT NULL,
  accepted_at TEXT,
  UNIQUE(company_id, id),
  FOREIGN KEY(company_id, request_id) REFERENCES shipment_requests(company_id, id)
);

CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL UNIQUE,
  tracking_number TEXT NOT NULL,
  qr_identifier_hash TEXT NOT NULL UNIQUE,
  owner_customer_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
  contents TEXT NOT NULL,
  description TEXT NOT NULL,
  origin_label TEXT NOT NULL,
  destination_label TEXT NOT NULL,
  origin_location_id TEXT,
  destination_location_id TEXT,
  destination_mode TEXT NOT NULL CHECK(destination_mode IN ('COLLECTION','DELIVERY')),
  state TEXT NOT NULL CHECK(state IN ('AWAITING_COMPANY_RECEIPT','RECEIVED_BY_COMPANY','IN_TRANSIT','AT_COMPANY_LOCATION','READY_FOR_COLLECTION','OUT_FOR_DELIVERY','DELIVERY_ATTEMPTED','DELIVERED','ON_HOLD','DAMAGED','MISSING','RETURNING','RETURNED','CANCELLED')),
  payment_status TEXT NOT NULL DEFAULT 'UNPAID' CHECK(payment_status IN ('UNPAID','PARTIALLY_PAID','PAID','PAYMENT_ON_DELIVERY','WAIVED','REFUNDED')),
  preliminary_amount REAL NOT NULL,
  final_amount REAL,
  currency TEXT NOT NULL DEFAULT 'ETB',
  estimated_delivery_date TEXT,
  current_location_id TEXT,
  current_step_index INTEGER NOT NULL DEFAULT 0,
  delivery_pin_hash TEXT NOT NULL,
  delivery_pin_cipher TEXT NOT NULL,
  delivered_at TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(company_id, tracking_number),
  UNIQUE(company_id, id),
  FOREIGN KEY(company_id, request_id) REFERENCES shipment_requests(company_id, id),
  FOREIGN KEY(company_id, owner_customer_id) REFERENCES customers(company_id, id),
  FOREIGN KEY(company_id, origin_location_id) REFERENCES locations(company_id, id),
  FOREIGN KEY(company_id, destination_location_id) REFERENCES locations(company_id, id),
  FOREIGN KEY(company_id, current_location_id) REFERENCES locations(company_id, id)
);

CREATE TABLE IF NOT EXISTS journey_steps (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  shipment_id TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  step_type TEXT NOT NULL CHECK(step_type IN ('PICKUP','ROUTE_LEG','FINAL_DELIVERY','COLLECTION')),
  route_leg_id TEXT,
  origin_label TEXT NOT NULL,
  destination_label TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('PENDING','READY','DEPARTED','ARRIVED','COMPLETED','SKIPPED','EXCEPTION')),
  completed_at TEXT,
  UNIQUE(shipment_id, sequence),
  UNIQUE(company_id, id),
  FOREIGN KEY(company_id, shipment_id) REFERENCES shipments(company_id, id) ON DELETE CASCADE,
  FOREIGN KEY(company_id, route_leg_id) REFERENCES route_legs(company_id, id)
);

CREATE TABLE IF NOT EXISTS dispatch_batches (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  qr_identifier_hash TEXT NOT NULL UNIQUE,
  route_leg_id TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('DRAFT','OPEN','SEALED','DISPATCHED','ARRIVED','CLOSED')),
  expected_departure TEXT,
  expected_arrival TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE(company_id, batch_number),
  UNIQUE(company_id, id),
  FOREIGN KEY(company_id, route_leg_id) REFERENCES route_legs(company_id, id)
);

CREATE TABLE IF NOT EXISTS batch_memberships (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  batch_id TEXT NOT NULL,
  shipment_id TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  added_at TEXT NOT NULL,
  removed_at TEXT,
  added_by TEXT NOT NULL REFERENCES users(id),
  removed_by TEXT REFERENCES users(id),
  removal_reason TEXT,
  UNIQUE(company_id, id),
  FOREIGN KEY(company_id, batch_id) REFERENCES dispatch_batches(company_id, id) ON DELETE CASCADE,
  FOREIGN KEY(company_id, shipment_id) REFERENCES shipments(company_id, id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_batch_per_shipment ON batch_memberships(shipment_id) WHERE active = 1;

CREATE TABLE IF NOT EXISTS shipment_events (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  shipment_id TEXT NOT NULL,
  batch_id TEXT,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location_id TEXT,
  customer_visible INTEGER NOT NULL DEFAULT 0,
  actor_user_id TEXT REFERENCES users(id),
  occurred_at TEXT NOT NULL,
  idempotency_key TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  UNIQUE(company_id, id),
  UNIQUE(company_id, idempotency_key),
  FOREIGN KEY(company_id, shipment_id) REFERENCES shipments(company_id, id) ON DELETE CASCADE,
  FOREIGN KEY(company_id, batch_id) REFERENCES dispatch_batches(company_id, id),
  FOREIGN KEY(company_id, location_id) REFERENCES locations(company_id, id)
);

CREATE TABLE IF NOT EXISTS evidence_files (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  shipment_id TEXT NOT NULL,
  event_id TEXT,
  category TEXT NOT NULL CHECK(category IN ('PACKAGE_AT_PICKUP','SHIPPER_ID','RECEIVER_ID','PROOF_OF_RECEIPT','PROOF_OF_DELIVERY','DAMAGE','EXCEPTION','OTHER')),
  storage_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  customer_visible INTEGER NOT NULL DEFAULT 0,
  sensitive INTEGER NOT NULL DEFAULT 0,
  uploaded_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  FOREIGN KEY(company_id, shipment_id) REFERENCES shipments(company_id, id) ON DELETE CASCADE,
  FOREIGN KEY(company_id, event_id) REFERENCES shipment_events(company_id, id)
);

CREATE TABLE IF NOT EXISTS access_tokens (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('REQUEST_QUOTE','TRACKING','OWNER_ACCESS','QR_SHIPMENT','QR_BATCH')),
  entity_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  token_cipher TEXT NOT NULL,
  expires_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS delivery_pin_attempts (
  id TEXT PRIMARY KEY,
  shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES users(id),
  successful INTEGER NOT NULL,
  attempted_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  shipment_id TEXT REFERENCES shipments(id) ON DELETE CASCADE,
  event_id TEXT REFERENCES shipment_events(id) ON DELETE CASCADE,
  recipient TEXT,
  channel TEXT NOT NULL CHECK(channel IN ('EMAIL','IN_APP')),
  locale TEXT NOT NULL DEFAULT 'en',
  state TEXT NOT NULL DEFAULT 'PENDING' CHECK(state IN ('PENDING','SENT','FAILED','READ')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  provider_reference TEXT,
  failure_reason TEXT,
  created_at TEXT NOT NULL,
  sent_at TEXT,
  read_at TEXT
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  shipment_id TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ETB',
  method TEXT NOT NULL,
  reference TEXT,
  notes TEXT,
  recorded_by TEXT NOT NULL REFERENCES users(id),
  recorded_at TEXT NOT NULL,
  FOREIGN KEY(company_id, shipment_id) REFERENCES shipments(company_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS company_contracts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  model TEXT NOT NULL CHECK(model IN ('FLAT','PER_SHIPMENT','PER_USER','CUSTOM')),
  amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ETB',
  billing_frequency TEXT NOT NULL DEFAULT 'MONTHLY',
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  reason TEXT,
  before_json TEXT,
  after_json TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_requests_company_state ON shipment_requests(company_id, state);
CREATE INDEX IF NOT EXISTS idx_shipments_company_state ON shipments(company_id, state);
CREATE INDEX IF NOT EXISTS idx_events_shipment_time ON shipment_events(shipment_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_batches_company_state ON dispatch_batches(company_id, state);
CREATE INDEX IF NOT EXISTS idx_tokens_hash ON access_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_hash ON sessions(token_hash);

CREATE TABLE IF NOT EXISTS login_attempts (
  id TEXT PRIMARY KEY,
  identifier_hash TEXT NOT NULL,
  successful INTEGER NOT NULL,
  attempted_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier_time ON login_attempts(identifier_hash, attempted_at DESC);
