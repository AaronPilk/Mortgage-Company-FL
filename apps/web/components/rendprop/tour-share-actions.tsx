"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { RENDPROP_DEMO_TOUR_PATH } from "@/lib/rendprop-demo";

export function TourShareActions() {
  const [status, setStatus] = useState<"idle" | "copied" | "unavailable">("idle");

  async function copyStableLink() {
    try {
      await navigator.clipboard.writeText(
        new URL(RENDPROP_DEMO_TOUR_PATH, window.location.origin).toString()
      );
      setStatus("copied");
    } catch {
      setStatus("unavailable");
    }
  }

  return (
    <div>
      <Button type="button" variant="secondary" onClick={copyStableLink}>
        Copy stable sample link
      </Button>
      <p className="mt-2 min-h-5 text-xs text-[var(--text-muted)]" role="status">
        {status === "copied"
          ? "Sample link copied."
          : status === "unavailable"
            ? "Clipboard access is unavailable; copy the address from your browser."
            : "The copied link omits campaign parameters."}
      </p>
    </div>
  );
}
