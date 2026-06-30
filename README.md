# SAVO Ops

Internal operations dashboard for **SAVO** (savo.eats) — a premium homemade
frozen-food UMKM in Bandung. Manages sales & orders, manual payments, invoices,
recipes with HPP (COGS) costing, and inventory.

UI is in **Bahasa Indonesia**, currency **IDR (Rp)**, timezone **Asia/Jakarta (WIB)**.

> **Ringkasan (untuk pemilik):** Ini aplikasi internal SAVO. Hanya staf yang
> sudah login bisa membuka. Dibangun bertahap (lihat fase di `CLAUDE.md`).
> Saat ini **Phase 0** — kerangka + login + deploy.

## Tech stack

- **Next.js 15** (App Router, TypeScript) · **Tailwind CSS v4** · **shadcn/ui** · **lucide-react**
- **Supabase** (Postgres + Auth + Storage)
- Deploy on **Netlify** (free tier, `@netlify/plugin-nextjs`)

## Setup (local)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` from the template and fill real values:
   ```bash
   cp .env.example .env.local
   ```
   Required:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only — never exposed to the client)
   - `SUPABASE_DB_URL` (Postgres connection string URI — only needed to run migrations locally)
3. Run the dev server:
   ```bash
   npm run dev
   ```
   App at http://localhost:3000 (you'll be redirected to `/login`).

## Database migrations

SQL lives in `supabase/migrations/` (versioned). Apply with:

```bash
npm run db:migrate
```

This reads `SUPABASE_DB_URL` from `.env.local` and runs each `.sql` file in order.
You can also paste a migration's SQL directly into the Supabase **SQL Editor**.

## Owner / first user

No password is stored in code. Generate a one-time invite link:

```bash
npm run owner:invite -- ariamuhammads@gmail.com https://<your-site>.netlify.app
```

Open the printed link → set a password on `/atur-sandi` → log in at `/login`.
The site URL must be added in Supabase → **Authentication → URL Configuration**
(Site URL + Redirect URLs include `https://<your-site>.netlify.app/auth/callback`).

## Deploy to Netlify (free)

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import from GitHub** → pick the repo.
   Build settings are read from `netlify.toml` (no manual config needed).
3. **Site settings → Environment variables** — add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy. Open the live URL.

## Keep-alive & backups (GitHub Actions)

- **`.github/workflows/keep-alive.yml`** — pings `/api/health` every 3 days so the
  Supabase free project doesn't pause. Set repo **variable** `HEALTHCHECK_URL` to
  `https://<your-site>.netlify.app/api/health`.
- **`.github/workflows/backup.yml`** — weekly `pg_dump` committed to `backups/`.
  Set repo **secret** `SUPABASE_DB_URL` to the Postgres connection string URI.

## Project structure

```
src/
  app/            # routes (App Router)
    login/        # /login (auth)
    atur-sandi/   # set password after invite
    auth/         # signout + callback route handlers
    api/health/   # keep-alive health endpoint
  components/ui/  # shadcn/ui components
  lib/
    supabase/     # browser / server / admin / middleware clients
    format.ts     # IDR + WIB formatters
supabase/migrations/  # versioned SQL
scripts/          # apply-migrations, create-owner
```

## Conventions

- All user-facing text in **Bahasa Indonesia**; money as `Rp 1.234.567`.
- Never commit secrets. `.env*` is gitignored (except `.env.example`).
- Build in phases — see `CLAUDE.md` (the source of truth).
