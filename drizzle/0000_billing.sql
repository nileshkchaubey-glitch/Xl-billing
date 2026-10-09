CREATE TABLE billing_workspaces (
  owner_id TEXT PRIMARY KEY NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  last_operation_id TEXT NOT NULL DEFAULT '',
  metadata_json TEXT NOT NULL CHECK (json_valid(metadata_json)),
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE billing_records (
  owner_id TEXT NOT NULL REFERENCES billing_workspaces(owner_id),
  collection TEXT NOT NULL CHECK (collection IN ('items','parties','invoices','purchases','retail','audit','openingPayments')),
  record_id TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  data_json TEXT NOT NULL CHECK (json_valid(data_json)),
  photo_key TEXT,
  PRIMARY KEY (owner_id, collection, record_id)
);
--> statement-breakpoint
CREATE TABLE billing_operations (
  owner_id TEXT NOT NULL REFERENCES billing_workspaces(owner_id),
  operation_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  verified INTEGER NOT NULL CHECK (verified = 1),
  created_at TEXT NOT NULL,
  PRIMARY KEY (owner_id, operation_id)
);
