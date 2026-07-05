import { db, ensureSchema } from "../api/db.js";

// One-off helper to create the schema against DATABASE_URL.
// Usage: npm run db:init
async function main() {
  await ensureSchema();
  const [row] = await db("guests").count<{ count: string }[]>("* as count");
  console.log(`[db] schema ready. guests currently stored: ${Number(row.count)}`);
  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
