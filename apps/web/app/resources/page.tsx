import type { Metadata } from "next";
import Link from "next/link";
import { Card, Section, SectionHeading } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Guides and explainers",
  description: "Plain-language guides to the parts of a Florida mortgage that surprise people.",
  path: "/resources"
});

/**
 * Resource index.
 *
 * Only published, reviewed material is listed. The editorial backlog lives in
 * docs/content/ as briefs; a brief is not a page and does not appear here.
 */
const PUBLISHED: { href: string; title: string; body: string }[] = [];

export default function ResourcesPage() {
  return (
    <Section orbs>
      <SectionHeading
        as="h1"
        eyebrow="Resources"
        title="Guides worth the time"
        gradientWord="worth the time"
        description="Each one is written against primary sources, reviewed by a named person, and dated."
      />

      {PUBLISHED.length === 0 ? (
        <Card>
          <h2 className="text-lg font-semibold text-[var(--text)]">Guides are being written</h2>
          <p className="mt-3 text-[var(--text-muted)]">
            We are not publishing thin articles to fill a page. Each guide is written against
            primary sources, reviewed, and dated before it goes up, and the first set is in review
            now.
          </p>
          <p className="mt-3 text-[var(--text-muted)]">
            In the meantime, the{" "}
            <Link className="text-[var(--purple)] underline underline-offset-2" href="/mortgage">
              loan program pages
            </Link>{" "}
            and the{" "}
            <Link className="text-[var(--purple)] underline underline-offset-2" href="/calculators">
              calculators
            </Link>{" "}
            cover most of what people ask us first.
          </p>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PUBLISHED.map((item) => (
            <Card as="li" key={item.href}>
              <Link href={item.href}>
                <h2 className="text-lg font-semibold text-[var(--text)]">{item.title}</h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{item.body}</p>
              </Link>
            </Card>
          ))}
        </ul>
      )}
    </Section>
  );
}
