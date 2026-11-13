import Image from "next/image";

/**
 * The Wholesale Mortgage Lending lockup, the one brand mark on every page
 * (ADR-014): the WML glyph beside the company name set in live text.
 *
 * The glyph is cropped from public/brand/wml-logo.png. The full logo is not used
 * here because its "WHOLESALE MORTGAGE LENDING" line is baked black and would
 * vanish on the dark theme. Instead the name is real text coloured by --text,
 * and the glyph ships twice: the brand purple for light surfaces and a lighter
 * tint of the same hue for dark ones (the brand purple is about 2.3:1 on the
 * dark background). `brand-light-only` / `brand-dark-only` pick one against the
 * same `.dark` class the theme toggle sets (globals.css).
 *
 * The name is three words long, which is wider than the header can spare in two
 * places, so the variants differ only in when the name breaks onto two lines.
 * The site variant uses a bounded range (sm:max-[1359px]) rather than a later
 * min-[1360px] override, because Tailwind does not order an arbitrary min-[]
 * breakpoint after sm:, so the override would lose.
 *   - "site": the main header. Two lines on phones and again from 1360px, where
 *     the eight-link inline nav appears and needs the width; one line with the
 *     tagline in between, where the nav sits behind the menu button.
 *   - "landing": the landing header, which has one button and no nav. Two
 *     lines on phones, one line with the tagline from 640px.
 *   - "footer": always one line with the tagline.
 * Below 380px the header variants show the glyph alone: next to the call to
 * action and the menu button there is no room for the name on the narrowest
 * phones. The link around the lockup carries the name as its accessible label.
 *
 * The decorative glyph has an empty alt, so a screen reader hears the company
 * once, from the text or the link label, not twice.
 */
type Variant = "site" | "landing" | "footer";

const NAME_LINE: Record<Variant, string> = {
  site: "block sm:max-[1359px]:inline",
  landing: "block sm:inline",
  footer: "inline"
};

const TAGLINE: Record<Variant, string> = {
  site: "hidden sm:max-[1359px]:block",
  landing: "hidden sm:block",
  footer: "block"
};

const TEXT: Record<Variant, string> = {
  site: "hidden min-[380px]:flex",
  landing: "hidden min-[380px]:flex",
  footer: "flex"
};

const GLYPH: Record<Variant, string> = {
  site: "h-[18px] sm:h-[22px]",
  landing: "h-[18px] sm:h-[22px]",
  footer: "h-[22px]"
};

export function Wordmark({
  variant = "footer",
  className = ""
}: {
  variant?: Variant;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 sm:gap-2.5 ${className}`}>
      <Image
        src="/brand/wml-glyph.png"
        alt=""
        width={412}
        height={151}
        className={`brand-light-only w-auto shrink-0 ${GLYPH[variant]}`}
        priority
      />
      <Image
        src="/brand/wml-glyph-dark.png"
        alt=""
        width={412}
        height={151}
        className={`brand-dark-only w-auto shrink-0 ${GLYPH[variant]}`}
        priority
      />
      <span className={`${TEXT[variant]} flex-col leading-tight`}>
        <span
          className="whitespace-nowrap text-[12.5px] font-bold tracking-tight sm:text-sm"
          style={{ color: "var(--text)" }}
        >
          <span className={NAME_LINE[variant]}>Wholesale</span>{" "}
          <span className={NAME_LINE[variant]}>Mortgage Lending</span>
        </span>
        <span
          className={`whitespace-nowrap text-[11px] font-medium ${TAGLINE[variant]}`}
          style={{ color: "var(--text-muted)" }}
        >
          Florida mortgage brokerage
        </span>
      </span>
    </span>
  );
}
