import express, { type Request, type Response, type NextFunction } from "express";
import { fileURLToPath } from "url";
import { ensureSchema } from "./db.js";
import { AppError } from "./errors.js";
import { seatingRouter } from "./routes/seating.routes.js";

const app = express();
app.use(express.json());

// Ensure the table/index exist before handling any request (cheap after first run).
app.use(async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureSchema();
    next();
  } catch (err) {
    next(err);
  }
});

app.use("/api", seatingRouter);

// Central JSON error handler: AppError carries an HTTP status, anything else is a 500.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error(err);

  const message = err instanceof Error ? err.message : "Սերվերի ներքին սխալ";
  res.status(500).json({ error: message || "Սերվերի ներքին սխալ" });
});

// Local dev: `tsx watch api/index.ts` runs this file directly and starts a server.
// On Vercel, the file is imported and the default export is used as the handler.
const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  const port = Number(process.env.PORT) || 3001;
  app.listen(port, "0.0.0.0", () => console.log(`[api] listening on http://0.0.0.0:${port}`));
}

export default app;
