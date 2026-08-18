import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/account/update-password-form";
import { ButtonLink, Card, Section, SectionHeading } from "@/components/ui";
import { publicFeatures } from "@/lib/env";
import { pageMetadata } from "@/lib/metadata";
import { createRequestClient } from "@/lib/supabase";

export const metadata: Metadata = pageMetadata({
  title: "Set a new password",
  description: "Complete a password reset for your TRACT account.",
  path: "/auth/update-password",
  noIndex: true
});

export const dynamic = "force-dynamic";

/**
 * Where the password reset email lands.
 *
 * The link in that email goes through /auth/callback, which exchanges the
 * recovery code for a session cookie and redirects here. So by the time this
 * page renders, a valid reset means a signed-in (recovered) session exists —
 * and an invalid, expired, or cross-browser link means it does not. Both
 * states get an honest page: the form when the session is real, an
 * explanation and a way back when it is not.
 */
export default async function UpdatePasswordPage() {
  const features = publicFeatures();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const configured = features.accounts && supabaseUrl !== undefined && anonKey !== undefined;
  const supabase = configured ? await createRequestClient() : null;
  const userResult = supabase === null ? null : await supabase.auth.getUser();
  const user = userResult?.error === null ? userResult.data.user : null;

  return (
    <Section width="narrow">
      <SectionHeading as="h1" eyebrow="Account" title="Set a new password" />
      <Card>
        {!configured || supabaseUrl === undefined || anonKey === undefined ? (
          <p className="text-[var(--text-muted)]" role="status">
            Account sign-in is not configured in this environment, so there is no password to reset
            here.
          </p>
        ) : user === null ? (
          <div className="space-y-4">
            <p className="text-[var(--text-muted)]" role="status">
              This page could not verify a password reset. Reset links expire, work once, and must
              be opened in the same browser that requested them. Request a new link from the sign-in
              form.
            </p>
            <ButtonLink href="/account" variant="secondary">
              Back to sign in
            </ButtonLink>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-[var(--text-muted)]">
              Setting a new password for {user.email ?? "your account"}.
            </p>
            <UpdatePasswordForm supabaseUrl={supabaseUrl} anonKey={anonKey} />
          </div>
        )}
      </Card>
    </Section>
  );
}
