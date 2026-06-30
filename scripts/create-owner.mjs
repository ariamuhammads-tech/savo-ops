// Create / invite the SAVO owner account using the Supabase service role.
// No password is stored in code: this generates a one-time invite link that
// lets the owner set their own password via /atur-sandi.
//
// Usage (PowerShell, from project root):
//   node --env-file=.env.local scripts/create-owner.mjs <owner-email> <site-url>
// Example:
//   node --env-file=.env.local scripts/create-owner.mjs ariamuhammads@gmail.com https://savo-ops.netlify.app
//
// The <site-url> must be added to Supabase → Authentication → URL Configuration
// (Site URL + Redirect URLs) so the invite link can redirect back.

import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
const siteUrl = (process.argv[3] ?? "http://localhost:3000").replace(/\/$/, "");

if (!email) {
  console.error("ERROR: berikan email owner sebagai argumen pertama.");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "ERROR: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tidak ditemukan. " +
      "Jalankan dengan: node --env-file=.env.local scripts/create-owner.mjs ...",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const redirectTo = `${siteUrl}/auth/callback`;

async function main() {
  // Try an invite link first (creates the user if it does not exist).
  let { data, error } = await supabase.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo },
  });

  // If the user already exists, fall back to a recovery (set-password) link.
  if (error && /already.*registered|exists/i.test(error.message)) {
    console.log("Pengguna sudah ada — membuat link atur ulang sandi…");
    ({ data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    }));
  }

  if (error) {
    console.error("Gagal membuat link:", error.message);
    process.exit(1);
  }

  console.log("\n✅ Akun owner siap. Berikan / buka link berikut untuk mengatur kata sandi:\n");
  console.log(data?.properties?.action_link ?? "(link tidak tersedia)");
  console.log("\nSetelah mengatur sandi, login di:", `${siteUrl}/login`, "\n");
}

main();
