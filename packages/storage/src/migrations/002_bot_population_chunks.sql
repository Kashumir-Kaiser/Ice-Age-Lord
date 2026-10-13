CREATE TABLE IF NOT EXISTS bot_population_chunks (
  save_id TEXT NOT NULL REFERENCES saves(save_id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL CHECK(chunk_index >= 0),
  first_ordinal INTEGER NOT NULL CHECK(first_ordinal > 0),
  bot_count INTEGER NOT NULL CHECK(bot_count BETWEEN 1 AND 256),
  chunk_sha256 TEXT NOT NULL CHECK(length(chunk_sha256) = 64),
  chunk_json TEXT NOT NULL,
  PRIMARY KEY(save_id, chunk_index),
  UNIQUE(save_id, first_ordinal)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_bot_population_chunks_save
ON bot_population_chunks(save_id, chunk_index);
