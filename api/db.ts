import knex, { type Knex } from "knex";
import { TABLE_COUNT } from "./constants.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "[db] DATABASE_URL is not set. Set it in .env (local) or in your Vercel project env vars."
  );
}

const isLocal =
  !!connectionString &&
  (connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1"));

export const db: Knex = knex({
  client: "pg",
  connection: {
    connectionString,
    // Managed Postgres (Vercel / Neon / Supabase) requires SSL; local usually does not.
    ssl: isLocal ? false : { rejectUnauthorized: false },
  },
  pool: { min: 0, max: 5 },
});

// Run the schema once per warm serverless instance.
let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = createSchema();
    schemaReady.catch(() => {
      // Allow a later request to retry if the first attempt failed.
      schemaReady = null;
    });
  }
  return schemaReady;
}

async function createSchema(): Promise<void> {
  const exists = await db.schema.hasTable("guests");
  if (!exists) {
    await db.schema.createTable("guests", (t) => {
      t.increments("id").primary();
      t.text("name").notNullable();
      t.integer("table_number").notNullable();
      t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(db.fn.now());
    });
  }
  await db.raw(
    "CREATE INDEX IF NOT EXISTS idx_guests_table ON guests (table_number)"
  );
  await ensureTableNumberRange();
}

// Keep the table_number range check in sync with TABLE_COUNT, replacing the
// constraint on databases that were created with a different table count.
async function ensureTableNumberRange(): Promise<void> {
  await db.raw(`
    DO $$
    DECLARE c record;
    BEGIN
      FOR c IN
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'guests'::regclass AND contype = 'c'
      LOOP
        EXECUTE 'ALTER TABLE guests DROP CONSTRAINT ' || quote_ident(c.conname);
      END LOOP;
      ALTER TABLE guests
        ADD CONSTRAINT guests_table_number_check
        CHECK (table_number BETWEEN 1 AND ${TABLE_COUNT});
    END $$;
  `);
}
