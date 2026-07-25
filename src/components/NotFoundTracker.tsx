"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackNotFound } from "@/lib/track";

/** Logs the path that missed. Renders nothing. */
export function NotFoundTracker() {
  const pathname = usePathname();
  useEffect(() => {
    trackNotFound(pathname);
  }, [pathname]);
  return null;
}
