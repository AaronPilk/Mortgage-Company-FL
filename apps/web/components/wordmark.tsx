import Image from "next/image";

/**
 * The unified brand lockup, shown in the header and footer on every page.
 *
 * Two names, one identity: TRACT is the product people use, powered by Wholesale
 * Mortgage Lending — the company behind it. Locking them together everywhere is
 * what makes the two read as one brand.
 *
 * The mark is the real TRACT wordmark (the letters, with the purple house as the
 * "A"), not a type treatment. The source art is white-on-dark, so it ships in two
 * recolored, transparent variants — dark letters for light surfaces, white for
 * dark — and the theme picks one with `brand-light-only` / `brand-dark-only`
 * (defined in globals.css against the same `.dark` class the toggle sets). The
 * "powered by" line is hidden on the narrowest screens to keep the header row
 * clean; the footer always carries the full co-brand.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex flex-col leading-none ${className}`}>
      <span className="inline-flex items-center">
        <Image
          src="/brand/tract-word-light.png"
          alt="TRACT"
          width={640}
          height={118}
          className="brand-light-only h-[26px] w-auto"
          priority
        />
        <Image
          src="/brand/tract-word-dark.png"
          alt="TRACT"
          width={640}
          height={118}
          className="brand-dark-only h-[26px] w-auto"
          priority
        />
      </span>
      <span
        className="mt-1.5 hidden text-[0.56rem] font-semibold uppercase tracking-[0.13em] sm:block"
        style={{ color: "var(--text-muted)" }}
      >
        Powered by Wholesale Mortgage Lending
      </span>
    </span>
  );
}
