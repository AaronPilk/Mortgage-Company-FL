import Link from "next/link";
import { ButtonLink, Section } from "@/components/ui";

export default function NotFound() {
  return (
    <Section width="narrow">
      <h1 className="text-4xl font-bold">We could not find that page</h1>
      <p className="mt-4 text-lg text-[var(--text-muted)]">
        The link may be out of date, or the page may have moved. Here are the places people usually
        want.
      </p>
      <ul className="mt-8 space-y-3">
        {[
          { href: "/mortgage", label: "Mortgage options" },
          { href: "/calculators", label: "Payment and affordability calculators" },
          { href: "/resources", label: "Guides and explainers" },
          { href: "/contact", label: "Talk to someone" }
        ].map((item) => (
          <li key={item.href}>
            <Link className="text-[var(--purple)] underline underline-offset-2" href={item.href}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-10">
        <ButtonLink href="/">Back to the home page</ButtonLink>
      </div>
    </Section>
  );
}
