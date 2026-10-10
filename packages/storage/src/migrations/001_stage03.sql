CREATE TABLE IF NOT EXISTS local_owners (
  owner_id TEXT PRIMARY KEY,
  created_at_utc TEXT NOT NULL
) STRICT;

INSERT OR IGNORE INTO local_owners(owner_id, created_at_utc)
VALUES ('local-owner', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

CREATE TABLE IF NOT EXISTS saves (
  save_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES local_owners(owner_id),
  slot_name TEXT NOT NULL CHECK(length(slot_name) BETWEEN 1 AND 80),
  revision INTEGER NOT NULL CHECK(revision >= 0),
  event_sequence INTEGER NOT NULL CHECK(event_sequence >= 0),
  state_json TEXT NOT NULL,
  state_sha256 TEXT NOT NULL CHECK(length(state_sha256) = 64),
  world_package_id TEXT NOT NULL,
  content_version TEXT NOT NULL,
  ruleset_version TEXT NOT NULL,
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL,
  parent_save_id TEXT,
  parent_checkpoint_id TEXT,
  UNIQUE(owner_id, slot_name)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_saves_owner_updated
ON saves(owner_id, updated_at_utc DESC, save_id);

CREATE TABLE IF NOT EXISTS creation_requests (
  owner_id TEXT NOT NULL REFERENCES local_owners(owner_id),
  creation_key TEXT NOT NULL CHECK(length(creation_key) BETWEEN 1 AND 160),
  request_sha256 TEXT NOT NULL CHECK(length(request_sha256) = 64),
  save_id TEXT NOT NULL REFERENCES saves(save_id) ON DELETE RESTRICT,
  response_json TEXT NOT NULL,
  created_at_utc TEXT NOT NULL,
  PRIMARY KEY(owner_id, creation_key)
) STRICT;

CREATE TABLE IF NOT EXISTS command_receipts (
  receipt_sequence INTEGER PRIMARY KEY AUTOINCREMENT,
  save_id TEXT NOT NULL REFERENCES saves(save_id) ON DELETE CASCADE,
  command_id TEXT NOT NULL,
  request_sha256 TEXT NOT NULL CHECK(length(request_sha256) = 64),
  receipt_json TEXT NOT NULL,
  created_at_utc TEXT NOT NULL,
  UNIQUE(save_id, command_id)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_receipts_save_order
ON command_receipts(save_id, receipt_sequence);

CREATE TABLE IF NOT EXISTS domain_events (
  save_id TEXT NOT NULL REFERENCES saves(save_id) ON DELETE CASCADE,
  event_sequence INTEGER NOT NULL CHECK(event_sequence > 0),
  event_id TEXT NOT NULL,
  occurred_at_elapsed_ms INTEGER NOT NULL CHECK(occurred_at_elapsed_ms >= 0),
  causal_command_id TEXT NOT NULL,
  payload_schema_version INTEGER NOT NULL CHECK(payload_schema_version > 0),
  ruleset_version TEXT NOT NULL,
  content_version TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  player_event_json TEXT NOT NULL,
  PRIMARY KEY(save_id, event_sequence),
  UNIQUE(save_id, event_id),
  FOREIGN KEY(save_id, causal_command_id) REFERENCES command_receipts(save_id, command_id) ON DELETE RESTRICT
) STRICT;

CREATE TRIGGER IF NOT EXISTS domain_events_no_update
BEFORE UPDATE ON domain_events
BEGIN
  SELECT RAISE(ABORT, 'domain_events_are_append_only');
END;

CREATE TRIGGER IF NOT EXISTS domain_events_no_delete
BEFORE DELETE ON domain_events
BEGIN
  SELECT RAISE(ABORT, 'domain_events_are_append_only');
END;

CREATE TABLE IF NOT EXISTS checkpoints (
  checkpoint_id TEXT PRIMARY KEY,
  save_id TEXT NOT NULL REFERENCES saves(save_id) ON DELETE CASCADE,
  revision INTEGER NOT NULL CHECK(revision >= 0),
  event_sequence INTEGER NOT NULL CHECK(event_sequence >= 0),
  label TEXT NOT NULL CHECK(length(label) BETWEEN 1 AND 80),
  state_json TEXT NOT NULL,
  state_sha256 TEXT NOT NULL CHECK(length(state_sha256) = 64),
  created_at_utc TEXT NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS idx_checkpoints_save_order
ON checkpoints(save_id, created_at_utc DESC, checkpoint_id);
