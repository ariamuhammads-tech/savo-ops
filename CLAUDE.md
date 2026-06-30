# CLAUDE.md — SAVO Ops

> This file is the single source of truth for Claude Code. Read it fully before writing any code.
> Written in English (precise technical spec). **All user-facing UI text in the app MUST be in Bahasa Indonesia.** Currency is IDR (Rp).

---

## 0. Rules of engagement (read first)

1. **Work in phases.** Do not build everything at once. Finish a phase, run it, show the result, and wait for the owner's approval before starting the next phase. Phases are defined in section 11.
2. **Never commit secrets.** No API keys, service-role keys, DB passwords, or `.env` values in git. Provide `.env.example` only. Add `.env*` to `.gitignore`.
3. **Ask before destructive or irreversible actions** (dropping tables with data, force-pushing, deleting Supabase projects, changing access controls). When you need a credential or an account action, stop and ask the owner — the owner provides credentials and approvals; you do the building.
4. **No paid services.** Everything must run on free tiers (see section 2). If a task seems to require a paid service, stop and propose a free alternative instead.
5. **Indonesian UI, IDR currency, Asia/Jakarta timezone (WIB).** Number format `1.234.567` (dot thousands). Dates `dd MMM yyyy`.
6. **Mobile-first.** The owner and staff will often use this on a phone. Every screen must be fully usable on a ~390px viewport.
7. **Keep it simple.** This is an internal tool for 2–3 people, not a multi-tenant SaaS. Prefer clarity over cleverness. No over-engineering.

---

## 1. What we are building

**SAVO Ops** — an internal operations dashboard for **SAVO** (savo.eats), a premium homemade frozen-food UMKM in Bandung (sausages & bitterballen, 100% Australian beef, no preservatives). Sales channels: B2C (WhatsApp/Instagram orders) and B2B (cafés, restaurants, co-working spaces buying ready-to-heat / RTH stock).

The system manages: **sales & orders, manual payment recording, invoices, standard recipes with HPP (COGS) costing, and inventory** (raw materials + finished goods), plus a dashboard.

### What this is NOT
- ❌ NOT a dine-in restaurant POS. There are no tables, no table-side menu, no kitchen-display ticketing.
- ❌ NOT a public e-commerce storefront. It is an internal back-office tool used by staff who log in.
- ❌ NOT a payment-processing app (for now). Payments are **recorded manually**. A payment gateway (Midtrans) is deferred to a later phase; design the data model to accept it later, but do not build the integration now.

### Users
2–3 staff, all sharing one role (`admin`) with full access. Keep a `role` column for future granularity, but do not build role-based UI restrictions now.

---

## 2. Tech stack (locked)

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 15** (App Router, TypeScript, React Server Components where sensible) | |
| Styling | **Tailwind CSS** + **shadcn/ui** | Clean, modern, accessible components |
| Icons | **lucide-react** | |
| Charts | **Recharts** | Dashboard KPIs |
| Tables | **@tanstack/react-table** | Sortable/filterable data tables |
| Forms | **react-hook-form** + **zod** | Validation |
| Backend / DB | **Supabase** (Postgres + Auth + Storage) | Free tier, commercial use allowed |
| DB access | **`@supabase/supabase-js`** with generated TS types (`supabase gen types typescript`) | Typed, simple. No separate ORM. |
| Schema/migrations | Supabase SQL migration files in `/supabase/migrations` | Versioned SQL |
| Invoice PDF | **`@react-pdf/renderer`** | Generated server-side, downloadable + stored in Supabase Storage |
| Excel import/export | **SheetJS (`xlsx`)** for read, **`exceljs`** for styled write | |
| Dates | **date-fns** + **date-fns-tz** | Force `Asia/Jakarta` |
| Deploy | **Netlify** (Free plan) | Commercial use allowed on free tier; full Node functions (needed for PDF + future webhooks). Use `@netlify/plugin-nextjs`. |

### Why Netlify and not Vercel
Vercel's free **Hobby** plan is officially **non-commercial only**, and this is a business tool — so a compliant free deploy needs Netlify (free tier explicitly permits commercial use and runs full Node functions). Keep the app as **standard portable Next.js** so it can move to Vercel Pro or Cloudflare later with minimal change. Do not use Vercel-proprietary APIs.

### Free-tier facts to respect
- **Supabase Free:** 500 MB Postgres, 1 GB Storage, 5 GB egress/month, 50k MAU, **2 projects max**. Projects **pause after 7 days of inactivity** — add a tiny keep-alive (a GitHub Actions cron that pings a health endpoint every ~3 days). No automatic backups on free → add a weekly `pg_dump` GitHub Action committing a dump to the repo (or to Storage). **New Supabase projects (after 2026-05-30) require explicit Postgres grants for the Data API** — set up RLS + grants correctly in migrations.
- **Netlify Free:** 100 GB bandwidth, 300 build min, 125k function invocations/month — far beyond 2–3 internal users.

---

## 3. Environment variables

Create `.env.example` (committed) and `.env.local` (gitignored). The owner will fill real values.

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only, never exposed to client

# App
NEXT_PUBLIC_APP_NAME=SAVO Ops
TZ=Asia/Jakarta

# (Deferred — leave blank for now)
# MIDTRANS_SERVER_KEY=
# MIDTRANS_CLIENT_KEY=
# MIDTRANS_IS_PRODUCTION=false
```

Never read the service-role key in client components. Use it only in route handlers / server actions.

---

## 4. Data model

Postgres via Supabase. All tables: `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz default now()` (with an `updated_at` trigger). Money stored as `numeric(14,2)` (IDR, no cents in UI but keep the type). Quantities `numeric(14,3)`.

### Phase 1 tables

**profiles** — mirrors `auth.users`
- `id uuid` (FK → auth.users.id), `full_name text`, `role text default 'admin'`

**business_settings** — singleton (one row), used on invoices
- `business_name`, `tagline`, `address`, `phone_wa`, `email`, `instagram`, `npwp` (nullable), `logo_url`, `invoice_prefix text default 'INV'`, `tax_percent numeric default 0`, `bank_name`, `bank_account_no`, `bank_account_name`, `invoice_notes text` (default payment terms / thank-you note)

**products** — finished goods / SKU (e.g., Sosis Original, Cheese, Habanero, Bitterballen)
- `sku text unique`, `name`, `category text`, `unit text` (e.g. `pack`, `pcs`), `weight_grams numeric`, `price_b2c numeric`, `price_b2b numeric`, `photo_url`, `stock_qty numeric default 0`, `min_stock numeric default 0`, `is_active bool default true`, `notes`

**ingredients** — raw materials (beef, spices, casing, cheese, packaging…)
- `name`, `unit text` (`g`,`kg`,`ml`,`l`,`pcs`), `stock_qty numeric default 0`, `min_stock numeric default 0`, `last_unit_cost numeric default 0` (cost per `unit`), `supplier_name`, `notes`

**recipes** — standard recipe per product (one active recipe per product; allow versioning via `is_active`)
- `product_id` (FK), `name`, `yield_qty numeric` (units produced per full batch), `yield_unit text`, `overhead_cost numeric default 0` (flat labor/utility add per batch, optional), `is_active bool default true`, `notes`

**recipe_items**
- `recipe_id` (FK), `ingredient_id` (FK), `quantity numeric`, `unit text`

**customers** — B2C & B2B
- `name`, `type text check (type in ('b2c','b2b'))`, `business_name` (nullable), `phone_wa`, `email`, `address`, `price_tier text default 'b2c'` (`b2c`|`b2b` → which product price to default), `payment_terms_days int default 0`, `notes`

**orders**
- `order_no text unique` (auto, e.g. `SO-2026-0001`), `customer_id` (FK, nullable for walk-in), `channel text` (`wa`|`ig`|`b2b`|`other`), `order_date date`, `status text` (`draft`|`confirmed`|`in_production`|`ready`|`delivered`|`completed`|`cancelled`), `subtotal numeric`, `discount numeric default 0`, `shipping numeric default 0`, `tax numeric default 0`, `total numeric`, `payment_status text` (`unpaid`|`partial`|`paid`), `notes`

**order_items**
- `order_id` (FK), `product_id` (FK), `qty numeric`, `unit_price numeric`, `subtotal numeric`

**payments** — manual now, gateway-ready schema
- `order_id` (FK), `amount numeric`, `method text` (`cash`|`transfer`|`qris`|`other`), `status text default 'settled'` (`pending`|`settled`|`failed`), `paid_at timestamptz`, `reference text` (e.g. transfer note), `provider text` (nullable, future: `midtrans`), `provider_order_id text` (nullable), `provider_txn_id text` (nullable), `notes`

**invoices**
- `invoice_no text unique` (auto, uses `business_settings.invoice_prefix`, e.g. `INV-2026-0001`), `order_id` (FK), `customer_id` (FK), `issue_date date`, `due_date date`, `status text` (`draft`|`sent`|`paid`|`overdue`|`cancelled`), `total numeric`, `pdf_url text` (Supabase Storage path)

**stock_movements** — unified ledger (lightweight in Phase 1)
- `item_type text` (`product`|`ingredient`), `item_id uuid`, `movement_type text` (`adjustment`|`sale`|`production_in`|`production_out`|`purchase`|`waste`), `qty_change numeric` (+/−), `balance_after numeric`, `ref_type text` (nullable), `ref_id uuid` (nullable), `notes`

### Phase 2 tables (do NOT build in Phase 1)
- **purchases** / **purchase_items** — buying raw materials → increments `ingredients.stock_qty`, updates `last_unit_cost`, logs `stock_movements(purchase)`.
- **production_batches** — records a cook: consumes ingredients per recipe × scale, increments `products.stock_qty`, computes actual HPP, logs movements.
- Midtrans fields on `payments` are already present; the integration itself is Phase 2.

### Phase 3 (later)
- **expenses** (operational costs) for a simple profit view.

---

## 5. Core business logic

### HPP (COGS) — Phase 1
For a product's active recipe:
- `hpp_total = SUM(recipe_item.quantity × ingredient.last_unit_cost) + recipe.overhead_cost`
- `hpp_per_unit = hpp_total / recipe.yield_qty`
- Show on the recipe screen: HPP per unit, current `price_b2c` & `price_b2b`, **margin %** = `(price − hpp_per_unit) / price`, and a **suggested price** input (enter target margin → show price). This costing view is a headline feature — make it clear and prominent.
- **RTH selling point** (from SAVO's B2B pitch): an RTH pack is 250g yielding 3–4 restaurant portions; break-even for a café is ~2 portions/pack. Surface a small "RTH economics" helper on the product/recipe screen if a product is flagged `category = 'RTH'` (optional, nice-to-have).

### Stock — Phase 1 (manual + on sale)
- Stock is a directly editable number on products and ingredients, plus an **Adjustment** action (reason + qty +/−) that writes a `stock_movements` row.
- When an order moves to `delivered` or `completed`, deduct `order_items.qty` from `products.stock_qty` and log `stock_movements(sale)` once (guard against double-deduction on repeated status changes — track whether stock was already applied for that order).
- Low-stock alerts: any product/ingredient where `stock_qty <= min_stock` shows on the dashboard.

### Numbering
- `order_no`: `SO-{YYYY}-{0001}` sequential per year.
- `invoice_no`: `{prefix}-{YYYY}-{0001}` sequential per year. Generate atomically (DB sequence or a `select … for update` counter) to avoid duplicates.

### Invoice generation (Phase 1 — required feature)
- Generate an invoice from an order (one click on the order page, or from the Invoices page).
- PDF via `@react-pdf/renderer`, server-side. Layout: SAVO logo + business header (from `business_settings`), invoice no & dates, bill-to (customer), line items (product, qty, unit price, subtotal), subtotal/discount/shipping/tax/total, bank transfer details + `invoice_notes`, payment status.
- Save the PDF to Supabase Storage bucket `invoices/` and store the path in `invoices.pdf_url`; provide a **Download** button and a **WhatsApp share** helper (since SAVO sells heavily on WA): build a `https://wa.me/<customer phone>?text=<short message>` link (the PDF itself is downloaded/attached manually by staff).
- Money in Indonesian format (Rp 1.234.567).

### Payments — Phase 1 (manual)
- Record a payment against an order (amount, method, date, reference). Recompute `orders.payment_status` from sum of settled payments vs `orders.total` (`unpaid` / `partial` / `paid`).

---

## 6. Auth & security
- Supabase Auth, email+password. Seed/create the owner account on first run (owner supplies email; do not hardcode a password — use Supabase's invite or a one-time setup flow).
- **RLS enabled on every table.** Policy: an authenticated user (exists in `profiles`) can `select/insert/update/delete` business tables. Unauthenticated = no access. `business_settings` and destructive ops still go through the app, not anon.
- Server-only operations (PDF generation writing to Storage, future webhooks) use the service-role key in route handlers, never client-side.
- Add explicit Postgres `grant`s required by the new Supabase Data API rule (post 2026-05-30) in the migrations.

---

## 7. Modules / pages (Bahasa Indonesia labels)

| Route | Label (ID) | Purpose |
|---|---|---|
| `/login` | Masuk | Auth |
| `/` (dashboard) | Dasbor | KPIs: penjualan hari ini & bulan ini, jumlah pesanan per status, invoice belum lunas, **alert stok menipis** (produk & bahan), produk terlaris, estimasi margin |
| `/produk` | Produk | CRUD SKU, harga B2C/B2B, foto, stok produk jadi |
| `/bahan` | Bahan Baku | CRUD bahan, stok, harga beli terakhir, level minimum, supplier |
| `/resep` | Resep & HPP | Resep standar per produk + kalkulasi HPP otomatis, margin, saran harga |
| `/pelanggan` | Pelanggan | B2C & B2B, tier harga, termin |
| `/pesanan` | Pesanan | Buat/kelola order, item, status, channel |
| `/pesanan/[id]` | Detail Pesanan | Item, pembayaran (manual), tombol buat invoice |
| `/pembayaran` | Pembayaran | Catat & lihat pembayaran manual |
| `/invoice` | Invoice | Daftar invoice, generate PDF, download, share WA |
| `/laporan` | Laporan | Penjualan, stok, HPP/margin; **export Excel** |
| `/pengaturan` | Pengaturan | Profil bisnis (untuk invoice), pengguna, import/export Excel |

Navigation: a left sidebar on desktop, bottom nav or hamburger on mobile.

---

## 8. Excel import/export (required feature)
- **Import** (bulk, via `xlsx`): products, ingredients, customers, recipes. Flow: download a template → upload filled file → preview parsed rows with validation errors highlighted → confirm to insert/update (upsert by SKU/name). Never silently overwrite without preview.
- **Export** (via `exceljs`, styled with headers): products, ingredients, customers, orders, payments, and the reports. Indonesian column headers, IDR formatting.
- Put templates + import/export under `/pengaturan` and `/laporan`.

---

## 9. UI / UX direction
- Modern, clean, calm. Lots of whitespace, soft rounded cards, subtle borders, one accent color. SAVO's brand leans **warm cream backgrounds with a dark ink text and a warm accent** (think appetizing, premium, homemade). Use a refined palette — not a generic admin template, not loud reds.
- Suggested tokens (tune freely): background `#FBF7F0` (warm cream), surface `#FFFFFF`, ink `#1F1A17`, muted `#6B6258`, accent `#C0492B` (warm terracotta) used sparingly, success `#2F7D5B`, warning `#C9892F`.
- Type: a humanist/classy pairing is on-brand (e.g. a serif display for headings + clean sans for body). If self-hosting fonts is fiddly on free tier, fall back to a strong system/Google-fonts sans — readability over flourish.
- Every list view: search + filter + sort + empty state + loading skeletons. Every form: inline validation, clear primary action, toast on success/error. Confirm dialogs for deletes.
- Indonesian throughout, friendly but professional tone.

> Optional design input: the owner may provide a Google Stitch UI reference. If a reference design or screenshots are added to `/docs/design`, follow them. Otherwise apply the direction above.

---

## 10. Project conventions
- Folder: `app/` (routes), `components/` (ui + feature), `lib/` (supabase client, utils, formatters, pdf, excel), `supabase/migrations/`, `supabase/seed.sql`, `docs/`, `scripts/` (keep-alive, backup).
- `lib/format.ts`: `formatIDR()`, `formatDate()` (WIB), number parsing for Indonesian input.
- Generate Supabase types into `lib/database.types.ts`; type all queries.
- Seed data (`supabase/seed.sql`): SAVO business profile (name SAVO, Bandung, WA `6281324124242`, IG `@savo.eats`), the three known products (Sosis Original, Cheese, Habanero) + Bitterballen, a few sample ingredients, and one sample B2B customer — so the app is demoable immediately.
- Commit conventionally; keep PRs/commits scoped per phase.
- Provide a clear `README.md`: setup, env, run, deploy to Netlify, how to run migrations, how the keep-alive & backup actions work.

---

## 11. Build phases & acceptance (work top to bottom, stop for approval after each)

### Phase 0 — Scaffold & infra
- Next.js 15 + TS + Tailwind + shadcn/ui initialized; ESLint/Prettier; folder structure; `.env.example`; `.gitignore` (incl. `.env*`).
- Supabase project connected (owner provides URL + keys); migrations runner working; RLS + grants baseline.
- Auth working (login/logout, protected routes, owner account).
- Deployed to Netlify with env vars set; live URL reachable.
- ✅ Done = owner can log into an empty deployed app.

### Phase 1 — MVP (the core the owner asked for)
Products, Ingredients, Recipes + **HPP costing**, Customers, Orders + Order items, **manual Payments**, **Invoice PDF generation + download + WA share**, Dashboard (KPIs + low-stock alerts), Settings (business profile), **Excel import/export**, manual stock + sale deduction + adjustments + `stock_movements`.
- ✅ Done = owner can: add products/ingredients, build a recipe and see HPP & margin, create a customer, make an order, record a manual payment, generate & download an invoice PDF, see the dashboard update, and import/export Excel. All in Indonesian, on mobile.

### Phase 2 — Inventory automation & gateway (later, on request)
Purchases (raw-material buying), Production batches (recipe-driven consumption + actual HPP), fuller stock ledger/reporting, **Midtrans Snap** integration on payments (sandbox first).

### Phase 3 — Optional
Expenses & simple profit view, deeper analytics, B2B niceties.

---

## 12. When you need something from the owner
Stop and ask clearly (one short list) whenever you need: Supabase project URL/keys, the owner's login email, Netlify connection/auth, a logo file, or approval to proceed to the next phase. The owner's job is credentials + approvals; yours is to build, explain plainly (in Indonesian when talking to the owner), and never touch secrets in git.
