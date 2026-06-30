"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

/**
 * Shows a one-time toast based on the `?msg=` (success) or `?err=` (error)
 * query param, then strips it from the URL. Place once per list page.
 */
export function FlashToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const shown = useRef(false);

  useEffect(() => {
    const msg = params.get("msg");
    const err = params.get("err");
    if ((!msg && !err) || shown.current) return;
    shown.current = true;

    if (msg) toast.success(msg);
    if (err) toast.error(err);

    const next = new URLSearchParams(params);
    next.delete("msg");
    next.delete("err");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, router, pathname]);

  return null;
}
