import { AccountSignIn, type AccountSignInMode } from "@/components/account/account-sign-in";
import { Card, Section, SectionHeading } from "@/components/ui";
import { publicFeatures } from "@/lib/env";

/**
 * The signed-out gate for the TRACT portal. The loan surface is authenticated
 * end to end, so an unauthenticated visitor is met with sign-in rather than any
 * loan data. Reuses the account auth component (same Supabase session, same
 * Turnstile), so a borrower's WML account and their loan file are one login.
 */
export function LoanAuthPrompt({
  defaultMode,
  title,
  intro
}: {
  defaultMode: Extract<AccountSignInMode, "create" | "signIn">;
  title: string;
  intro: string;
}) {
  const features = publicFeatures();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const configured = features.accounts && supabaseUrl !== undefined && anonKey !== undefined;

  return (
    <Section width="narrow">
      <SectionHeading as="h1" eyebrow="TRACT" title={title} />
      <Card>
        <p className="mb-6 text-[var(--text-muted)]">{intro}</p>
        <AccountSignIn
          configured={configured}
          supabaseUrl={supabaseUrl}
          anonKey={anonKey}
          defaultMode={defaultMode}
        />
      </Card>
    </Section>
  );
}
