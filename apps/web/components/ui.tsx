import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Component library.
 *
 * The visual language: saturated purple, glow instead of flat shadow, a small
 * lift on hover, gradient reserved for emphasis. Depth is used to signal that a
 * surface is interactive — a card that does not move on hover is not a link.
 *
 * One primary action per visual region. That rule is what keeps a page
 * scannable, so `variant="primary"` stays rare.
 */

type ButtonVariant = "primary" | "secondary" | "ghost";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold " +
  "min-h-[48px] px-6 py-3 text-[0.95rem] tracking-[-0.01em] " +
  "transition-all duration-200 will-change-transform " +
  "disabled:opacity-45 disabled:cursor-not-allowed disabled:transform-none";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "text-white shadow-[0_4px_14px_var(--purple-glow)] " +
    "hover:-translate-y-0.5 hover:shadow-[0_10px_30px_var(--purple-glow)] active:translate-y-0",
  secondary:
    "border hover:-translate-y-0.5 hover:border-[var(--purple)] hover:text-[var(--purple)]",
  ghost: "hover:bg-[var(--purple-subtle)] hover:text-[var(--purple)]"
};

const variantStyle: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: "var(--purple)" },
  secondary: {
    background: "transparent",
    color: "var(--text)",
    borderColor: "var(--border)"
  },
  ghost: { color: "var(--text)" }
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
  ...rest
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  prefetch?: boolean;
  "data-cta"?: string;
}) {
  return (
    <Link
      href={href}
      style={variantStyle[variant]}
      className={`${buttonBase} ${buttonVariants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      style={variantStyle[variant]}
      className={`${buttonBase} ${buttonVariants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
  as: Element = "div",
  interactive = false
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section" | "li";
  /** Adds the lift and glow. Use only where the whole card is actually clickable. */
  interactive?: boolean;
}) {
  return (
    <Element
      className={`surface hover-float rounded-2xl p-6 ${
        interactive
          ? "cursor-pointer hover:-translate-y-1 hover:border-[var(--purple)] hover:shadow-[0_16px_44px_var(--purple-glow)]"
          : ""
      } ${className}`}
    >
      {children}
    </Element>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      className="mb-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]"
      style={{
        borderColor: "var(--purple)",
        background: "var(--purple-subtle)",
        color: "var(--purple)"
      }}
    >
      {children}
    </p>
  );
}

/**
 * Vertical rhythm lives here, in a `pad` prop, not in a `py-*` class passed
 * through `className`. A responsive utility appended by a caller loses to the
 * component's own `sm:` utility in the generated stylesheet regardless of
 * source order, which silently produces dead space. An enumerated prop cannot.
 */
type SectionPad = "default" | "tight" | "head" | "none";

const sectionPad: Record<SectionPad, string> = {
  default: "py-16 sm:py-24",
  tight: "py-10 sm:py-12",
  head: "pt-14 pb-6 sm:pt-20 sm:pb-8",
  none: ""
};

export function Section({
  children,
  className = "",
  width = "default",
  pad = "default",
  tone = "plain",
  orbs = false,
  id
}: {
  children: ReactNode;
  className?: string;
  width?: "narrow" | "default" | "wide";
  pad?: SectionPad;
  /**
   * `surface` tints the full width of the viewport, not the content column.
   * Alternating bands are what give a long page a readable rhythm; a tint that
   * stops at the container reads as a stray panel instead.
   */
  tone?: "plain" | "surface";
  /** Decorative depth behind the section. Heroes only — it is noise elsewhere. */
  orbs?: boolean;
  id?: string;
}) {
  const container =
    width === "narrow"
      ? "container-narrow"
      : width === "wide"
        ? "container-wide"
        : "container-default";
  return (
    <section
      id={id}
      className={`relative ${sectionPad[pad]} ${orbs ? "overflow-hidden" : ""} ${className}`}
      style={tone === "surface" ? { background: "var(--surface)" } : undefined}
    >
      {orbs && <Orbs variant="subtle" />}
      <div className={`${container} relative z-10`}>{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  gradientWord,
  as: Heading = "h2"
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Rendered in the gradient. Must appear in `title`. */
  gradientWord?: string;
  as?: "h1" | "h2" | "h3";
}) {
  const size =
    Heading === "h1"
      ? "text-4xl sm:text-6xl"
      : Heading === "h2"
        ? "text-3xl sm:text-4xl"
        : "text-2xl";

  let rendered: ReactNode = title;
  if (gradientWord !== undefined && title.includes(gradientWord)) {
    const [before, after] = title.split(gradientWord);
    rendered = (
      <>
        {before}
        <span className="text-gradient">{gradientWord}</span>
        {after}
      </>
    );
  }

  return (
    <div className="mb-12 max-w-2xl">
      {eyebrow !== undefined && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading className={size}>{rendered}</Heading>
      {description !== undefined && (
        <p className="mt-5 text-lg" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * Decorative background orbs. `aria-hidden` because they carry no meaning, and
 * disabled entirely under prefers-reduced-motion by the stylesheet.
 *
 * The clipping container is masked. Without it the blurred orb is cut off dead
 * straight at the section boundary, which reads as a rectangular tinted panel
 * rather than as depth — the exact opposite of the intent.
 */
export function Orbs({ variant = "hero" }: { variant?: "hero" | "subtle" }) {
  const opacity = variant === "hero" ? 0.28 : 0.14;
  const fade = "radial-gradient(ellipse 85% 75% at 50% 45%, #000 40%, transparent 100%)";
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ maskImage: fade, WebkitMaskImage: fade }}
    >
      <div
        className="orb"
        style={{
          width: 460,
          height: 460,
          top: -160,
          right: -120,
          background: "var(--purple)",
          opacity
        }}
      />
      <div
        className="orb"
        style={{
          width: 340,
          height: 340,
          bottom: -140,
          left: -100,
          background: "var(--purple-light)",
          opacity: opacity * 0.6,
          animationDelay: "-3s"
        }}
      />
    </div>
  );
}

/**
 * List markers. `aria-hidden` because the surrounding heading already carries
 * the meaning — "This may fit if" is the semantics, the tick is decoration.
 */
export function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="mt-1 h-4 w-4 shrink-0"
      stroke="var(--purple)"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10.5 8 14.5 16 5.5" />
    </svg>
  );
}

export function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="mt-1 h-4 w-4 shrink-0"
      stroke="var(--text-muted)"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10h11M11 5.5 15.5 10 11 14.5" />
    </svg>
  );
}

export function Badge({
  children,
  tone = "purple"
}: {
  children: ReactNode;
  tone?: "purple" | "success" | "warning" | "neutral";
}) {
  const styles: Record<string, React.CSSProperties> = {
    purple: {
      background: "var(--purple-subtle)",
      color: "var(--purple)",
      borderColor: "var(--purple)"
    },
    success: {
      background: "rgb(15 122 79 / 0.1)",
      color: "var(--color-success)",
      borderColor: "rgb(15 122 79 / 0.4)"
    },
    warning: {
      background: "rgb(164 93 7 / 0.1)",
      color: "var(--color-warning)",
      borderColor: "rgb(164 93 7 / 0.4)"
    },
    neutral: {
      background: "var(--surface-2)",
      color: "var(--text-muted)",
      borderColor: "var(--border)"
    }
  };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
      style={styles[tone]}
    >
      {children}
    </span>
  );
}

/**
 * Disclosure block. Every estimate, calculator result, and program page carries
 * one. The version is rendered so a saved scenario ties to the exact copy shown.
 */
export function Disclosure({
  headline,
  body,
  excludes,
  version
}: {
  headline: string;
  body: string;
  excludes?: string[];
  version?: string;
}) {
  return (
    <aside
      className="mt-8 rounded-2xl border p-6 text-sm"
      style={{ borderColor: "var(--border)", background: "var(--purple-subtle)" }}
    >
      <p className="font-semibold" style={{ color: "var(--text)" }}>
        {headline}
      </p>
      <p className="mt-2" style={{ color: "var(--text-muted)" }}>
        {body}
      </p>
      {excludes !== undefined && excludes.length > 0 && (
        <>
          <p className="mt-4 font-semibold" style={{ color: "var(--text)" }}>
            Not included in this estimate
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5" style={{ color: "var(--text-muted)" }}>
            {excludes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      )}
      {version !== undefined && (
        <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
          Disclosure version {version}
        </p>
      )}
    </aside>
  );
}

/**
 * Renders a licensing fact, or a visible pending state when the value has not
 * been issued. It cannot render a plausible-looking placeholder.
 */
export function LicenseFact({ label, value }: { label: string; value: string | null }) {
  return (
    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
      <span className="font-semibold" style={{ color: "var(--text)" }}>
        {label}:
      </span>{" "}
      {value === null ? <span className="italic">pending issuance</span> : value}
    </p>
  );
}

export function FeatureStatus({
  label,
  status
}: {
  label: string;
  status: "live" | "coming_soon" | "off";
}) {
  const copy = { live: "Available", coming_soon: "In development", off: "Not available yet" }[
    status
  ];
  const tone = status === "live" ? "success" : status === "coming_soon" ? "purple" : "neutral";
  return (
    <Badge tone={tone as "success" | "purple" | "neutral"}>
      {label}: {copy}
    </Badge>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div
      className="prose-measure space-y-5 text-[1.06rem] leading-[1.75] [&_a]:font-medium [&_a]:text-[var(--purple)] [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-12 [&_h2]:text-2xl [&_h3]:mt-9 [&_h3]:text-xl [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6"
      style={{ color: "var(--text-muted)" }}
    >
      {children}
    </div>
  );
}

export function Faq({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details
          key={item.question}
          className="surface hover-float group rounded-2xl px-6 py-5 hover:border-[var(--purple)]"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold marker:hidden">
            {item.question}
            <span
              aria-hidden="true"
              className="shrink-0 text-2xl leading-none transition-transform duration-200 group-open:rotate-45"
              style={{ color: "var(--purple)" }}
            >
              +
            </span>
          </summary>
          <p className="mt-4" style={{ color: "var(--text-muted)" }}>
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}

/**
 * The closing call to action. One implementation, used everywhere, so the last
 * thing a reader sees is the same on every template.
 *
 * The panel is purple in both themes, so its foreground colours are literal
 * white rather than theme tokens — the contrast is fixed by the gradient
 * underneath it, not by the page.
 */
export function CtaPanel({
  title,
  body,
  primary,
  secondary
}: {
  title: string;
  body: string;
  primary: { href: string; label: string; cta: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[2rem] px-8 py-14 text-center sm:px-16"
      style={{
        background: "linear-gradient(135deg, var(--purple-dark), var(--purple))",
        boxShadow: "0 24px 70px var(--purple-glow)"
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="orb"
          style={{
            width: 420,
            height: 420,
            top: -180,
            left: "50%",
            background: "#fff",
            opacity: 0.12
          }}
        />
      </div>
      <div className="relative mx-auto max-w-2xl">
        <h2 className="text-3xl text-white sm:text-4xl">{title}</h2>
        <p className="mt-4 text-lg" style={{ color: "rgb(255 255 255 / 0.86)" }}>
          {body}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={primary.href}
            data-cta={primary.cta}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-[var(--purple-dark)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            {primary.label}
          </Link>
          {secondary !== undefined && (
            <Link
              href={secondary.href}
              className="inline-flex min-h-[48px] items-center rounded-xl border border-white/40 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
            >
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/** A claim with a number. Only used where the number is actually verifiable. */
export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-3xl font-bold sm:text-4xl">
        <span className="text-gradient">{value}</span>
      </p>
      <p className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
    </div>
  );
}
