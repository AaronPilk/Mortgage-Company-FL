"use client";

import Image from "next/image";
import { useState } from "react";

export function AssetImage({
  src,
  alt,
  width,
  height,
  sizes,
  priority = false,
  className = "object-cover",
  fallbackLabel = "Preview unavailable"
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  priority?: boolean;
  className?: string;
  fallbackLabel?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        data-media-state="fallback"
        className="grid h-full min-h-48 w-full place-items-center bg-[var(--surface-2)] px-6 text-center text-sm font-semibold text-[var(--text-muted)]"
      >
        {fallbackLabel}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      className={`h-full w-full ${className}`}
      onError={() => setFailed(true)}
      data-media-state="loaded"
    />
  );
}
