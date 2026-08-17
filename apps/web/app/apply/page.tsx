import type { Metadata } from "next";
import { ButtonLink, Card, Disclosure, Prose, Section, SectionHeading } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
import { env, publicFeatures } from "@/lib/env";

export const metadata: Metadata = pageMetadata({
  title: "Start a secure application",
  description: "How the application step works and where it happens.",
  path: "/apply"
});

/**
 * Application handoff.
 *
 * The application itself never happens here. This page explains the boundary and
 * links out to the approved secure system. No sensitive value is ever appended
 * to that URL.
 */
export default function ApplyPage() {
  const features = publicFeatures();
  const destination = env().SECURE_APPLICATION_URL;

  return (
    <Section width="narrow" orbs>
      <SectionHeading
        as="h1"
        eyebrow="Apply"
        title="The application happens in a secure system"
        description="Not on this website, and not by email."
      />

      <Prose>
        <h2>Why the application is somewhere else</h2>
        <p>
          A mortgage application involves income documentation, asset statements, identification,
          and a Social Security number for the credit report. That information belongs in a system
          built for it, with the access controls, encryption, audit trail, and disclosure tracking
          the transaction requires. A marketing website is not that system, and building one that
          pretended to be would be worse than not having one.
        </p>
        <h2>What happens when you click through</h2>
        <ol>
          <li>You are taken to the approved secure application system.</li>
          <li>
            You create your own credentials there. We never ask for a portal password, and nobody
            from our office will ever ask you for one.
          </li>
          <li>
            Once you provide the elements that constitute an application, time-sensitive disclosure
            requirements begin. Those are tracked in that system, not here.
          </li>
        </ol>
        <h2>Before you start</h2>
        <p>
          If you have not yet spoken with anyone here, start with a conversation instead. It takes a
          few minutes, involves no credit inquiry, and usually changes what you would have applied
          for.
        </p>
      </Prose>

      <Card className="mt-10">
        {features.secureApplication && destination !== undefined ? (
          <>
            <h2 className="text-xl font-semibold">Continue to the secure application</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              You are leaving this website. Your information is entered directly into the secure
              system, not through this page.
            </p>
            <div className="mt-5">
              <ButtonLink href={destination} data-cta="application-handoff">
                Open the secure application
              </ButtonLink>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold">Applications are not open yet</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              The secure application system is not connected yet, and we will not collect
              application information any other way in the meantime. Start with a conversation and
              we will let you know the moment it is available.
            </p>
            <div className="mt-5">
              <ButtonLink href="/contact" variant="secondary">
                Talk to a mortgage professional
              </ButtonLink>
            </div>
          </>
        )}
      </Card>

      <Disclosure
        headline="Never send sensitive information by email or through a web form."
        body="We will never ask for your Social Security number, account numbers, passwords, or documents by email, text, or through any form on this website. If you receive such a request claiming to be from us, do not respond to it and contact us directly."
      />
    </Section>
  );
}
