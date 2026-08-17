import type { Metadata } from "next";
import { ButtonLink, Card, Section, SectionHeading } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
import { publicFeatures } from "@/lib/env";

export const metadata: Metadata = pageMetadata({
  title: "Your account",
  description: "Saved scenarios and reports.",
  path: "/account",
  noIndex: true
});

export const dynamic = "force-dynamic";

export default function AccountPage() {
  const features = publicFeatures();
  return (
    <Section width="narrow">
      <SectionHeading as="h1" eyebrow="Account" title="Saved scenarios and reports" />
      <Card>
        <p className="text-muted">
          {features.accounts
            ? "Sign in to see scenarios you have saved. Nothing sensitive is stored here — saved calculator scenarios contain only the inputs you chose."
            : "Accounts are not enabled in this environment."}
        </p>
        <div className="mt-5">
          <ButtonLink href="/calculators" variant="secondary">
            Back to the calculators
          </ButtonLink>
        </div>
      </Card>
    </Section>
  );
}
