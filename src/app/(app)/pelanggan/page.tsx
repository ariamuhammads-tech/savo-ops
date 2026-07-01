import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import { FlashToast } from "@/components/flash-toast";
import { CustomerList } from "./customer-list";
import type { Customer } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function PelangganPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("customers").select("*").order("name");

  return (
    <>
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>
      <CustomerList customers={(data ?? []) as Customer[]} />
    </>
  );
}
