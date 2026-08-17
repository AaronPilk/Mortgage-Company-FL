import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Component library.
 *
 * One primary purple action per visual region; everything else is neutral. That
 * rule is what keeps a page scannable, so `variant="primary"` is used sparingly
 * and reviewed in design critique.
 */

type ButtonVariant = "primary" | "secondary" | "ghost";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-[--radius-md] font-semibold " +
  "transition-colors duration-150 min-h-[44px] px-5 py-3 text-[0.95rem] " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-purple-700 text-white hover:bg-purple-800",
  secondary: "bg-white text-purple-800 border border-purple-300 hover:bg-purple-50",
  ghost: "text-purple-800 hover:bg-purple-50"
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
    <Link href={href} className={`${buttonBase} ${buttonVariants[variant]} ${className}`} {...rest}>
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
    <button className={`${buttonBase} ${buttonVariants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
  as: Element = "div"
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section" | "li";
}) {
  return (
    <Element
      className={`rounded-[--radius-lg] border border-line bg-white p-6 shadow-[--shadow-card] ${className}`}
    >
      {children}
    </Element>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-purple-700">
      {children}
    </p>
  );
}

export function Section({
  children,
  className = "",
  width = "default",
  id
}: {
  children: ReactNode;
  className?: string;
  width?: "narrow" | "default" | "wide";
  id?: string;
}) {
  const container =
    width === "narrow"
      ? "container-narrow"
      : width === "wide"
        ? "container-wide"
        : "container-default";
  return (
    <section id={id} className={`py-14 sm:py-20 ${className}`}>
      <div className={container}>{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  as: Heading = "h2"
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className="mb-10 max-w-2xl">
      {eyebrow !== undefined && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading
        className={Heading === "h1" ? "text-4xl sm:text-5xl font-bold" : "text-3xl font-bold"}
      >
        {title}
      </Heading>
      {description !== undefined && <p className="mt-4 text-lg text-muted">{description}</p>}
    </div>
  );
}

/**
 * Disclosure block. Every estimate, calculator result, and program page carries
 * one. The version is rendered so a saved scenario can be tied to the exact copy
 * a consumer saw.
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
    <aside className="mt-8 rounded-[--radius-md] border border-line bg-purple-50 p-5 text-sm text-ink">
      <p className="font-semibold">{headline}</p>
      <p className="mt-2 text-muted">{body}</p>
      {excludes !== undefined && excludes.length > 0 && (
        <>
          <p className="mt-3 font-semibold">Not included in this estimate</p>
          <ul className="mt-1 list-disc pl-5 text-muted">
            {excludes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      )}
      {version !== undefined && (
        <p className="mt-3 text-xs text-muted">Disclosure version {version}</p>
      )}
    </aside>
  );
}

/**
 * Renders a licensing fact or, when the value is not yet issued, a visible
 * pending state. It deliberately cannot render a plausible-looking placeholder.
 */
export function LicenseFact({ label, value }: { label: string; value: string | null }) {
  return (
    <p className="text-sm text-muted">
      <span className="font-semibold text-ink">{label}:</span>{" "}
      {value === null ? (
        <span className="italic">pending issuance — not yet available</span>
      ) : (
        value
      )}
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
  const tone = {
    live: "bg-purple-100 text-purple-800",
    coming_soon: "bg-purple-50 text-purple-700",
    off: "bg-canvas text-muted"
  }[status];
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
      {label}: {copy}
    </span>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="prose-measure space-y-4 text-[1.05rem] leading-relaxed text-ink [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_a]:text-purple-700 [&_a]:underline [&_a]:underline-offset-2">
      {children}
    </div>
  );
}

export function Faq({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="divide-y divide-line rounded-[--radius-lg] border border-line bg-white">
      {items.map((item) => (
        <details key={item.question} className="group p-6">
          <summary className="cursor-pointer list-none text-lg font-semibold text-purple-950 marker:hidden">
            {item.question}
          </summary>
          <p className="mt-3 text-muted">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
