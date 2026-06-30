# Prompt Kickoff untuk Claude Code

> Cara pakai: buat folder repo baru, taruh `CLAUDE.md` di root repo, lalu buka Claude Code di folder itu dan tempel prompt di bawah ini sebagai pesan pertama.

---

You are building **SAVO Ops**, an internal operations dashboard for a frozen-food UMKM. The full specification is in `CLAUDE.md` in this repo root — **read it completely before doing anything**, and treat its "Rules of engagement" as binding.

Tech stack is locked: Next.js 15 (App Router, TypeScript) + Tailwind + shadcn/ui, Supabase (Postgres + Auth + Storage), `@react-pdf/renderer` for invoices, SheetJS/exceljs for Excel, deployed on Netlify free tier. All app UI must be in **Bahasa Indonesia**, currency IDR, timezone Asia/Jakarta. This is for 2–3 staff sharing one admin role. It is NOT a dine-in POS and NOT a public storefront. Payments are recorded **manually** for now (no gateway yet), but **invoice PDF generation is a required Phase 1 feature**.

Work in the phases defined in `CLAUDE.md` section 11. **Start with Phase 0 (scaffold + infra) only.** Do not jump ahead.

Before writing code, do these in order:
1. Confirm in one short message (in Bahasa Indonesia) that you've read `CLAUDE.md` and summarize the plan for Phase 0 in 4–6 bullet points.
2. Give me an exact, numbered checklist of every credential/account action **I** need to do for Phase 0 (create GitHub repo, create Supabase project + where to copy URL/anon key/service-role key, create Netlify account + connect repo + which env vars to paste, and the email I want for the owner login). Tell me precisely where each value goes.
3. Wait for me to provide those values. Never put real secrets in git — use `.env.example` and `.env.local` (gitignored).

Then build Phase 0, deploy it to Netlify, give me the live URL, and stop for my approval before Phase 1.

Throughout: explain things to me plainly in Bahasa Indonesia (I'm the business owner, not a developer), ask before anything destructive or irreversible, and keep everything on free tiers. If anything would require a paid plan or a credential you don't have, stop and tell me.
