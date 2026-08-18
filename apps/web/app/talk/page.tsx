import type { Metadata } from "next";
import Link from "next/link";
import { Card, Section, SectionHeading } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "What brings you to TRACT?",
  description:
    "Tell us what you are working on — buying, selling, investing, or partnering — and we will point you to the right conversation.",
  path: "/talk",
  // A router page: it exists to direct people, not to rank. Keeping it out of
  // the index also keeps it from competing with the pages it points to.
  noIndex: true
});

/**
 * "Talk to us" chooser.
 *
 * The header CTA lands here so one button can serve four very different
 * visitors. Each card routes to the destination whose funnel already speaks
 * that visitor's language, which beats a generic contact form for everyone.
 */
const CHOICES = [
  {
    href: "/get-started/purchase",
    title: "Buying a home",
    detail: "Two quick questions, then a licensed mortgage professional lays out your options."
  },
  {
    href: "/get-started/sell",
    title: "Selling a home",
    detail:
      "We're a mortgage brokerage, not a listing office — tell us about the home and we'll connect you with the right people."
  },
  {
    href: "/partners/real-estate-agents",
    title: "I'm a real estate agent",
    detail: "See how we work with agents, from co-marketing to keeping your clients moving."
  },
  {
    href: "/get-started/investment",
    title: "I'm an investor",
    detail: "Financing paths for rentals and investment property, laid out without the pitch."
  }
];

export default function TalkPage() {
  return (
    <Section orbs>
      <SectionHeading
        as="h1"
        eyebrow="Talk to us"
        title="What brings you to TRACT?"
        gradientWord="TRACT"
        description="Pick the closest fit and we'll start the right conversation. Nothing here is an application, and no credit is pulled."
      />
      <ul className="grid gap-5 sm:grid-cols-2">
        {CHOICES.map((choice) => (
          <Card as="li" key={choice.href} interactive className="!p-0">
            <Link href={choice.href} className="flex h-full flex-col p-7">
              <span className="text-xl font-semibold text-[var(--text)]">{choice.title}</span>
              <span className="mt-2 flex-1 text-sm" style={{ color: "var(--text-muted)" }}>
                {choice.detail}
              </span>
              <span
                aria-hidden="true"
                className="mt-5 text-sm font-semibold"
                style={{ color: "var(--purple)" }}
              >
                Start here &rarr;
              </span>
            </Link>
          </Card>
        ))}
      </ul>
      <p className="mt-8 text-sm" style={{ color: "var(--text-muted)" }}>
        None of these fit?{" "}
        <Link href="/contact" className="text-[var(--purple)] underline underline-offset-2">
          Send us a message
        </Link>{" "}
        and a licensed professional will get back to you.
      </p>
    </Section>
  );
}
