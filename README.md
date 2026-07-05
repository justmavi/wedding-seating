# Wedding Seating

A simple app to assign wedding guests to tables and visualise the hall map.

- **Frontend** — React + TypeScript (Vite)
- **Backend** — Express REST API running as a Vercel serverless function
- **Database** — Postgres (via `pg`)
- **Hosting** — Vercel (single repo, frontend + API deploy together)

The hall has **32 tables** (16 per side, each side = 2 columns × 8 rows), a
**Bride & Groom** table top-center and a **Stage** bottom-center. Numbering
follows the hand-drawn plan: **right side = tables 1–16, left side = 17–32**,
each side numbered bottom-to-top (left column odd, right column even). Every
table holds up to **13 guests**.

---

## Project structure

```
api/
  index.ts        Express app + REST routes (default export = Vercel handler)
  db.ts           Postgres pool + schema bootstrap
db/
  schema.sql      SQL schema (also applied automatically at runtime)
scripts/
  init-db.ts      One-off `npm run db:init` helper
src/
  main.tsx        React entry
  App.tsx         View switching + data loading
  api.ts          Typed fetch client for the REST API
  types.ts        Shared types + constants
  components/
    HallMap.tsx     Hall visualisation + global guest search
    TableDetail.tsx Per-table guests: add / remove / move / multiselect / search
index.html
vite.config.ts    Dev proxy: /api -> http://localhost:3001
vercel.json       Routes every /api/* request to the serverless function
```

## REST API

| Method | Path                       | Purpose                                  |
| ------ | -------------------------- | ---------------------------------------- |
| GET    | `/api/tables`              | Counts for all 32 tables                 |
| GET    | `/api/tables/:num`         | One table with its guests                |
| GET    | `/api/search?q=`           | Search guests across all tables          |
| POST   | `/api/tables/:num/guests`  | Add a guest `{ name }` (409 if full)     |
| DELETE | `/api/guests/:id`          | Remove a guest                           |
| POST   | `/api/guests/move`         | Move guests `{ ids, to }` (409 if no room) |

---

## Local development

1. **Install**
   ```bash
   npm install
   ```
2. **Set up Postgres.** Copy `.env.example` to `.env` and set `DATABASE_URL`,
   e.g. a local database:
   ```
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/wedding
   ```
   Then create the schema (optional — it's also created automatically on the
   first API request):
   ```bash
   npm run db:init
   ```
3. **Run both servers** (Express API on `:3001`, Vite frontend on `:5173`, with
   `/api` proxied):
   ```bash
   npm run dev
   ```
   Open http://localhost:5173.

## Deploy to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket and **Import Project** in Vercel.
2. Create a Postgres database (Vercel dashboard → **Storage → Create → Postgres**,
   or use Neon/Supabase) and connect it. This sets `DATABASE_URL` for you — if
   you use an external provider, add `DATABASE_URL` manually under
   **Settings → Environment Variables**.
3. Deploy. Vercel builds the frontend with `vite build` (output `dist`) and runs
   `api/index.ts` as a serverless function. `vercel.json` rewrites all `/api/*`
   traffic to it, and the schema is created automatically on first request.

No extra configuration is needed — build command, output directory, and API
routing are all defined in `vercel.json`.
