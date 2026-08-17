import type { Metadata } from "next";
import { Section } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "You are offline",
  description: "How to reach us while your connection is unavailable.",
  path: "/offline",
  noIndex: true
});

/**
 * Offline fallback.
 *
 * It gives the visitor a way to reach a human and says nothing about the state
 * of any form they may have been filling in. Claiming a submission succeeded
 * while offline would be worse than showing nothing.
 */
export default function OfflinePage() {
  return (
    <Section width="narrow">
      <h1 className="text-4xl font-bold">You are offline</h1>
      <p className="mt-4 text-lg text-[var(--text-muted)]">
        This page could not load because your device is not connected. Anything you were in the
        middle of submitting has not been sent.
      </p>
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6">
        <h2 className="text-xl font-semibold">Reach us directly</h2>
        <p className="mt-2 text-[var(--text-muted)]">
          Once you are back online, the contact page has every way to get in touch. Our calculators
          work entirely in your browser, so they will run again as soon as this page reloads.
        </p>
      </div>
    </Section>
  );
}
