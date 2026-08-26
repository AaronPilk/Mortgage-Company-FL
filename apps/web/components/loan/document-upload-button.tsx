"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * One-tap document upload for a single checklist item.
 *
 * Flow: ask the server for a signed slot → PUT the file straight to storage
 * (never through the Worker) → tell the server it landed → refresh so the item
 * flips to "Received". On a phone the file picker offers the camera, so a
 * borrower can photograph a pay stub and be done.
 */

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif"
]);

type UploadState = "idle" | "uploading" | "done" | "error";

export function DocumentUploadButton({
  loanFileId,
  requirementId,
  received
}: {
  loanFileId: string;
  requirementId: string;
  received: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [message, setMessage] = useState("");

  async function handleFile(file: File): Promise<void> {
    if (file.size > MAX_BYTES) {
      setState("error");
      setMessage("That file is over 25 MB. Try a photo or a smaller PDF.");
      return;
    }
    if (!ALLOWED.has(file.type)) {
      setState("error");
      setMessage("Use a PDF or a photo (JPG, PNG, or HEIC).");
      return;
    }

    setState("uploading");
    setMessage("");
    try {
      const slotRes = await fetch("/api/v1/loan/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanFileId,
          requirementId,
          contentType: file.type,
          byteSize: file.size
        })
      });
      if (!slotRes.ok) throw new Error("slot");
      const payload = (await slotRes.json()) as {
        data?: { documentId?: string; signedUrl?: string };
      };
      const documentId = payload.data?.documentId;
      const signedUrl = payload.data?.signedUrl;
      if (documentId === undefined || signedUrl === undefined) throw new Error("slot");

      const put = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });
      if (!put.ok) throw new Error("put");

      const confirm = await fetch("/api/v1/loan/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId })
      });
      if (!confirm.ok) throw new Error("confirm");

      setState("done");
      setMessage("");
      router.refresh();
    } catch {
      setState("error");
      setMessage("That didn't go through. Please try again.");
    }
  }

  const label = state === "uploading" ? "Uploading…" : received ? "Replace" : "Upload";

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file !== undefined) void handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={state === "uploading"}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
        style={{
          borderColor: received ? "var(--border)" : "var(--purple)",
          color: received ? "var(--text-muted)" : "var(--purple)",
          background: received ? "transparent" : "var(--purple-subtle)"
        }}
      >
        {label}
      </button>
      {message !== "" && (
        <span
          className="max-w-[12rem] text-right text-xs"
          style={{ color: "var(--color-warning-text, var(--color-warning))" }}
        >
          {message}
        </span>
      )}
    </div>
  );
}
