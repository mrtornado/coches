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

- **App:** `SESSION_SECRET`, `ADMIN_PASSWORD` (and optionally `PORT` — defaults to 8080; `HOST` is not needed, the server binds to `0.0.0.0`)
- **Postgres:** `DATABASE_URL`, `DATABASE_SSL`
- **S3:** `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`, `S3_PUBLIC_URL`

Works with AWS S3 (leave `S3_ENDPOINT` blank), Cloudflare R2, or MinIO (`S3_FORCE_PATH_STYLE=true`). `S3_PUBLIC_URL` is the public base URL where objects are served — the bucket must allow public reads for the car photos to display.

## Deploy on Coolify

1. Push this repo to Git and create a new **Application** in Coolify pointing at it.
   - **Build Pack: Dockerfile** (recommended). The included `Dockerfile` pins Node 22 LTS. Nixpacks' bundled Node is `22.11.0`, one patch below Astro's required `>=22.12.0`, so the Nixpacks build fails — the Dockerfile avoids that entirely.
   - _Alternative, if you insist on Nixpacks:_ set a **build-time** env var `NIXPACKS_NODE_VERSION=24` (or `23`) so it uses a Node new enough for Astro.
2. **Port:** the server binds to `0.0.0.0:8080` by default. Set Coolify's **Ports Exposes** to `8080` (or set a `PORT` env var and expose the same value). You do **not** need a `HOST` env var.
3. Add a **Postgres** resource in Coolify and copy its connection string into `DATABASE_URL`. Set `DATABASE_SSL=true` if required.
4. Set the env vars in the app's **Environment** tab (see list below).
5. Fill in the `S3_*` vars for your R2/S3 bucket. Make the bucket's objects publicly readable and set `S3_PUBLIC_URL` accordingly.
6. Deploy. Migrations apply on the first request; then open `/admin` and log in with `ADMIN_PASSWORD`.

**Environment variables to set in Coolify** (HOST/PORT not required):

```
SESSION_SECRET=<long random string>
ADMIN_PASSWORD=<your admin password>
DATABASE_URL=<from Coolify Postgres>
DATABASE_SSL=false
S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=coches
S3_ACCESS_KEY_ID=<r2 access key>
S3_SECRET_ACCESS_KEY=<r2 secret>
S3_FORCE_PATH_STYLE=false
S3_PUBLIC_URL=https://pub-xxxx.r2.dev
```

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
