-- Schema for the wedding seating app.
-- Applied automatically at runtime (see api/db.ts ensureSchema),
-- or manually with:  npm run db:init

CREATE TABLE IF NOT EXISTS guests (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  table_number INTEGER NOT NULL CHECK (table_number BETWEEN 1 AND 38),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guests_table ON guests (table_number);
