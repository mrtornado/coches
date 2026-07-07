# Renta Coches — MVP

Lightest-possible rent-a-car listing. Admin posts cars, they show on the front page. Bookings are **manual requests only — no online payments**.

**Stack:** Astro (SSR, `output: "server"`) + Node adapter · React island · Tailwind v4 · Postgres via Drizzle ORM + drizzle-zod · S3-compatible object storage for images.

## Features

- **Public** (`/`) — grid of available cars; each links to a detail page (`/car/:id`) with a booking-request form.
- **Admin** (`/admin`) — password-protected. Add cars (with photo upload → S3), hide/show, delete, and view booking requests.
- **Auth** — single shared password (`ADMIN_PASSWORD`), HMAC-signed session cookie. No user accounts.
- **DB migrations** run automatically on the first request (see `src/middleware.ts`).

## Local development

```bash
npm install
cp .env.example .env      # fill in the values
npm run dev               # http://localhost:4321
```

You need a reachable Postgres (`DATABASE_URL`) and, for image uploads, an S3-compatible bucket. Without S3 configured you can still add cars — the photo is just optional.

### Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build → `dist/` |
| `npm run start` | Run the built server (`node ./dist/server/entry.mjs`) |
| `npm run db:generate` | Generate a new SQL migration after editing `src/lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations manually (also runs automatically on boot) |
| `npm run db:studio` | Drizzle Studio |

## Environment variables

See [`.env.example`](.env.example). Summary:

- **App:** `HOST`, `PORT`, `SESSION_SECRET`, `ADMIN_PASSWORD`
- **Postgres:** `DATABASE_URL`, `DATABASE_SSL`
- **S3:** `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`, `S3_PUBLIC_URL`

Works with AWS S3 (leave `S3_ENDPOINT` blank), Cloudflare R2, or MinIO (`S3_FORCE_PATH_STYLE=true`). `S3_PUBLIC_URL` is the public base URL where objects are served — the bucket must allow public reads for the car photos to display.

## Deploy on Coolify

1. Push this repo to Git and create a new **Application** in Coolify pointing at it. Coolify (Nixpacks) detects Astro and builds it automatically — no Dockerfile needed.
   - Build command: `npm run build`
   - Start command: `npm run start` (serves on `$PORT`, host `0.0.0.0`)
2. Add a **Postgres** resource in Coolify and copy its connection string into `DATABASE_URL`. Set `DATABASE_SSL=true` if required.
3. Set all env vars from `.env.example` in the app's **Environment** tab.
4. Create/point an **S3 bucket** (or R2) and fill in the `S3_*` vars. Make the bucket's objects publicly readable and set `S3_PUBLIC_URL` accordingly.
5. Deploy. Migrations apply on the first request; then open `/admin` and log in with `ADMIN_PASSWORD`.

## Project layout

```
src/
├─ middleware.ts            # runs DB migrations once on first request
├─ layouts/Layout.astro
├─ components/CarForm.tsx   # React island: add-car form with image preview
├─ lib/
│  ├─ auth.ts               # signed-cookie admin session
│  ├─ s3.ts                 # S3 upload/delete helpers
│  └─ db/{index,schema}.ts  # Drizzle pool + tables + drizzle-zod validation
└─ pages/
   ├─ index.astro           # public car grid
   ├─ car/[id].astro        # detail + booking form
   ├─ admin/index.astro     # login OR dashboard
   └─ api/                  # login, logout, cars/{create,delete,toggle}, bookings/create
```
