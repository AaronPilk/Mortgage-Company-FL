import type { Metadata } from "next";
import { AccountSettings } from "@/components/account/account-settings";
import { AccountSignIn } from "@/components/account/account-sign-in";
import { Badge, Button, ButtonLink, Card, Section, SectionHeading } from "@/components/ui";
import { AffordabilityCard } from "@/components/account/affordability-card";
import { HomeValueCard } from "@/components/account/home-value-card";
import { RateWatchCard } from "@/components/account/rate-watch-card";
import { SavedSearchAlertToggle } from "@/components/account/saved-search-alert-toggle";
import { readAffordabilityProfile } from "@/lib/affordability";
import { readHomeDashboard } from "@/lib/home-value";
import { homeValueAvailable } from "@/lib/property";
import { rateWatchAvailable, readMarketRates } from "@/lib/rates";
import { readRateWatch } from "@/lib/rate-watch";
import { publicFeatures } from "@/lib/env";
import { demoListings, listings } from "@/lib/listings";
import { pageMetadata } from "@/lib/metadata";
import { claimAgentRowForUser } from "@/lib/agent-claim";
import { createRequestClient, createServiceClient } from "@/lib/supabase";

export const metadata: Metadata = pageMetadata({
  title: "Your account",
  description: "Saved properties, planning scenarios, projects, reports, and account controls.",
  path: "/account",
  noIndex: true
});

export const dynamic = "force-dynamic";

type SavedProperty = {
  listing_key: string;
  source_mode: "fixture" | "live";
  saved_at: string;
};
type SavedScenario = {
  id: string;
  source: string;
  summary: string;
  version: string;
  calculation_version: string;
  saved_at: string;
};
type SavedSearch = {
  id: string;
  search_params: string;
  summary: string;
  saved_at: string;
  alerts_enabled: boolean;
};
type VisionProject = {
  id: string;
  title: string;
  goal: string;
  status: string;
  updated_at: string;
};
type VisionScenario = { project_id: string; scenario_name: string; scenario_type: string };
type VisionReport = {
  id: string;
  project_id: string;
  version: number;
  status: string;
  generated_at: string | null;
  created_at: string;
};
type AccountJob = {
  id: string;
  job_type: string;
  feature: string;
  status: string;
  attempt_count: number;
  created_at: string;
  completed_at: string | null;
};
type PrivacyRequest = {
  id: string;
  request_type: string;
  status: string;
  created_at: string;
  completed_at: string | null;
};

const AUTH_MESSAGES: Record<string, string> = {
  verified: "Your email link was verified.",
  error:
    "That email link could not be verified. Links expire and work once — request a new one below.",
  unavailable: "Account sign-in is not configured in this environment.",
  signed_out: "You have been signed out."
};

function date(value: string): string {
  return new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AccountPage({
  searchParams
}: {
  searchParams: Promise<{ auth?: string | string[] }>;
}) {
  const query = await searchParams;
  const authState = typeof query.auth === "string" ? query.auth : "";
  const features = publicFeatures();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authConfigured = features.accounts && supabaseUrl !== undefined && anonKey !== undefined;
  const supabase = features.accounts ? await createRequestClient() : null;
  const userResult = supabase === null ? null : await supabase.auth.getUser();
  const user = userResult?.error === null ? userResult.data.user : null;

  if (user === null || supabase === null) {
    return (
      <Section width="narrow">
        <SectionHeading as="h1" eyebrow="Account" title="Your saved TRACT work" />
        {AUTH_MESSAGES[authState] !== undefined && (
          <p
            className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm"
            role="status"
          >
            {AUTH_MESSAGES[authState]}
          </p>
        )}
        <Card>
          {!features.accounts ? (
            <p className="text-[var(--text-muted)]">
              Accounts are disabled in this environment. Public planning tools remain available.
            </p>
          ) : (
            // The standalone account page leans toward returning visitors:
            // sign-in first, with the create-account toggle one tap away.
            <AccountSignIn
              configured={authConfigured}
              supabaseUrl={supabaseUrl}
              anonKey={anonKey}
              defaultMode="signIn"
            />
          )}
          <div className="mt-6">
            <ButtonLink href="/calculators" variant="secondary">
              Use calculators without an account
            </ButtonLink>
          </div>
        </Card>
      </Section>
    );
  }

  // An agent who joined the directory before creating this account gets their
  // row linked here — one cheap, idempotent service-role update that only ever
  // claims an unowned row matching this verified email. A failure is a silent
  // no-op; the page renders regardless and the next visit retries.
  if (user.email !== undefined) {
    const serviceClient = createServiceClient();
    if (serviceClient !== null) {
      await claimAgentRowForUser(serviceClient, user.id, user.email);
    }
  }

  const [
    propertyResult,
    scenarioResult,
    savedSearchResult,
    preferenceResult,
    projectResult,
    jobResult,
    privacyResult
  ] = await Promise.all([
    supabase
      .from("saved_properties")
      .select("listing_key,source_mode,saved_at")
      .eq("owner_user_id", user.id)
      .order("saved_at", { ascending: false })
      .limit(50),
    supabase
      .from("saved_calculator_scenarios")
      .select("id,source,summary,version,calculation_version,saved_at")
      .eq("owner_user_id", user.id)
      .order("saved_at", { ascending: false })
      .limit(50),
    supabase
      .from("saved_searches")
      .select("id,search_params,summary,saved_at,alerts_enabled")
      .eq("owner_user_id", user.id)
      .order("saved_at", { ascending: false })
      .limit(50),
    supabase
      .from("notification_preferences")
      .select("report_ready_email,report_failure_email")
      .eq("owner_user_id", user.id)
      .maybeSingle(),
    supabase
      .from("vision_projects")
      .select("id,title,goal,status,updated_at")
      .eq("owner_user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50),
    supabase
      .from("ai_jobs")
      .select("id,job_type,feature,status,attempt_count,created_at,completed_at")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("privacy_requests")
      .select("id,request_type,status,created_at,completed_at")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
  ]);

  const properties = (propertyResult.data ?? []) as SavedProperty[];
  const scenarios = (scenarioResult.data ?? []) as SavedScenario[];
  const savedSearches = (savedSearchResult.data ?? []) as SavedSearch[];
  const projects = (projectResult.data ?? []) as VisionProject[];
  const jobs = (jobResult.data ?? []) as AccountJob[];
  const privacyRequests = (privacyResult.data ?? []) as PrivacyRequest[];
  const projectIds = projects.map((project) => project.id);
  const [visionScenarioResult, reportResult] =
    projectIds.length === 0
      ? [
          { data: [], error: null },
          { data: [], error: null }
        ]
      : await Promise.all([
          supabase
            .from("vision_scenarios")
            .select("project_id,scenario_name,scenario_type")
            .in("project_id", projectIds),
          supabase
            .from("vision_reports")
            .select("id,project_id,version,status,generated_at,created_at")
            .in("project_id", projectIds)
            .order("created_at", { ascending: false })
        ]);
  const visionScenarios = (visionScenarioResult.data ?? []) as VisionScenario[];
  const reports = (reportResult.data ?? []) as VisionReport[];
  const queryUnavailable = [
    propertyResult,
    scenarioResult,
    savedSearchResult,
    preferenceResult,
    projectResult,
    jobResult,
    privacyResult,
    visionScenarioResult,
    reportResult
  ].some((result) => result.error !== null);
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const scenarioCountByProject = new Map<string, number>();
  for (const scenario of visionScenarios) {
    scenarioCountByProject.set(
      scenario.project_id,
      (scenarioCountByProject.get(scenario.project_id) ?? 0) + 1
    );
  }
  const propertyViews = await Promise.all(
    properties.map(async (saved) => {
      const provider = saved.source_mode === "fixture" ? demoListings() : listings();
      return { saved, listing: await provider.getByKey(saved.listing_key) };
    })
  );

  const affordabilityProfile = await readAffordabilityProfile(supabase, user.id);
  const homeValueDashboard = features.homeValue ? await readHomeDashboard(supabase, user.id) : null;
  // Show the card when the valuation provider can serve, or when a saved
  // dashboard already exists (so a temporary provider outage still shows history).
  const homeValueCanLookup = features.homeValue && homeValueAvailable();
  const showHomeValue = homeValueCanLookup || homeValueDashboard !== null;

  const showRateWatch = features.rateWatch && rateWatchAvailable();
  // The market rate powers both the rate-watch card and the home-value refi
  // signal, so read it whenever either surface is showing (it returns null on its
  // own when the feed is off). Kept concurrent with the watch read.
  const needsMarketRates = showRateWatch || showHomeValue;
  const [marketRates, rateWatch] = await Promise.all([
    needsMarketRates ? readMarketRates() : Promise.resolve(null),
    showRateWatch ? readRateWatch(supabase, user.id) : Promise.resolve(null)
  ]);

  return (
    <Section width="wide">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading as="h1" eyebrow="Account" title="Your saved TRACT work" />
        <form action="/auth/sign-out" method="post">
          <Button type="submit" variant="secondary">
            Sign out
          </Button>
        </form>
      </div>
      <p className="-mt-5 mb-8 text-sm text-[var(--text-muted)]">
        Signed in as {user.email ?? "a verified account"}. Database access remains constrained by
        your user id through Row Level Security.
      </p>
      {queryUnavailable && (
        <Card className="mb-6 border-danger/40">
          <p className="text-danger" role="alert">
            Some account records are unavailable. No broader database access was attempted.
          </p>
        </Card>
      )}

      {features.tract && (
        <div
          className="mb-6 rounded-2xl p-6"
          style={{ border: "1px solid var(--purple)", background: "var(--purple-subtle)" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Your loan</h2>
              <p className="mt-2 max-w-xl text-sm text-[var(--text-muted)]">
                Your application, your document checklist, and your loan status — all in one secure
                place. Upload a document straight from your phone.
              </p>
            </div>
            <ButtonLink href="/loan" variant="primary">
              Open my loan
            </ButtonLink>
          </div>
        </div>
      )}

      <Card className="mb-6">
        <h2 className="text-2xl font-bold">What can I afford?</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
          Save your numbers once and we&apos;ll tailor the site to them — your search and your home
          lookups. It stays private to your account and is never an application.
        </p>
        <div className="mt-5">
          <AffordabilityCard
            initial={
              affordabilityProfile === null
                ? null
                : {
                    annualIncome: Math.round(affordabilityProfile.annualIncomeCents / 100),
                    downPayment: Math.round(affordabilityProfile.downPaymentCents / 100),
                    monthlyDebts: Math.round(affordabilityProfile.monthlyDebtsCents / 100),
                    creditBand: affordabilityProfile.creditBand
                  }
            }
          />
        </div>
      </Card>

      {showHomeValue && (
        <Card className="mb-6">
          <h2 className="text-2xl font-bold">What&apos;s my home worth?</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
            Track your home&apos;s estimated value over time and watch the equity you&apos;re
            building. An automated estimate — never an appraisal or an offer — kept private to your
            account.
          </p>
          <div className="mt-5">
            <HomeValueCard
              initial={homeValueDashboard}
              canLookup={homeValueCanLookup}
              marketThirtyYearBp={marketRates?.thirtyYearBp ?? null}
            />
          </div>
        </Card>
      )}

      {showRateWatch && (
        <Card className="mb-6">
          <h2 className="text-2xl font-bold">Watch mortgage rates</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
            Keep an eye on the national average and get a nudge when it moves. Market information,
            never a quote — your rate is always a conversation.
          </p>
          <div className="mt-5">
            <RateWatchCard rates={marketRates} initial={rateWatch} />
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-2xl font-bold">Saved properties</h2>
          {propertyViews.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--text-muted)]">No saved properties yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {propertyViews.map(({ saved, listing }) => (
                <li
                  key={saved.listing_key}
                  className="border-t border-[var(--border)] pt-4 first:border-0 first:pt-0"
                >
                  <p className="font-semibold">
                    {listing === null
                      ? saved.listing_key
                      : [listing.address.line1, listing.address.city, listing.address.state]
                          .filter(Boolean)
                          .join(", ")}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {saved.source_mode === "fixture" ? "Synthetic fixture" : "Licensed listing"} ·
                    saved {date(saved.saved_at)}
                  </p>
                  <ButtonLink
                    href={`/properties/${encodeURIComponent(saved.listing_key)}`}
                    variant="ghost"
                    className="mt-2 px-0"
                  >
                    Open property
                  </ButtonLink>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-2xl font-bold">Saved searches</h2>
          {savedSearches.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              No saved searches yet. Save one from the property search page.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {savedSearches.map((search) => (
                <li
                  key={search.id}
                  className="border-t border-[var(--border)] pt-4 first:border-0 first:pt-0"
                >
                  <p className="font-semibold">{search.summary}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Saved {date(search.saved_at)}
                  </p>
                  <ButtonLink
                    href={
                      search.search_params === ""
                        ? "/properties"
                        : `/properties?${search.search_params}`
                    }
                    variant="ghost"
                    className="mt-2 px-0"
                  >
                    Run this search
                  </ButtonLink>
                  {features.savedSearchAlerts && (
                    <SavedSearchAlertToggle
                      saveId={search.id}
                      initialEnabled={search.alerts_enabled}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-2xl font-bold">Calculator scenarios</h2>
          {scenarios.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              No account scenarios yet. On-device saves remain separate.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {scenarios.map((scenario) => (
                <li
                  key={scenario.id}
                  className="border-t border-[var(--border)] pt-4 first:border-0 first:pt-0"
                >
                  <p className="font-semibold">{scenario.summary}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {scenario.source.replaceAll("_", " ")} · {scenario.version} · calculation{" "}
                    {scenario.calculation_version} · saved {date(scenario.saved_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-2xl font-bold">Vision projects</h2>
          {projects.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--text-muted)]">No owned Vision projects yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {projects.map((project) => (
                <li
                  key={project.id}
                  className="border-t border-[var(--border)] pt-4 first:border-0 first:pt-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{project.title}</p>
                    <Badge tone="neutral">{project.status.replaceAll("_", " ")}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    {project.goal.replaceAll("_", " ")} ·{" "}
                    {scenarioCountByProject.get(project.id) ?? 0} saved Vision scenario(s) · updated{" "}
                    {date(project.updated_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-2xl font-bold">Reports and jobs</h2>
          {reports.length === 0 && jobs.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              No owned report or job records yet.
            </p>
          ) : (
            <div className="mt-4 space-y-5">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="border-t border-[var(--border)] pt-4 first:border-0 first:pt-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">
                      {projectById.get(report.project_id)?.title ?? "Vision report"} · v
                      {report.version}
                    </p>
                    <Badge
                      tone={
                        report.status === "published"
                          ? "success"
                          : report.status === "failed"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {report.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {report.generated_at === null
                      ? `Created ${date(report.created_at)}`
                      : `Generated ${date(report.generated_at)}`}
                  </p>
                </div>
              ))}
              {jobs.map((job) => (
                <div key={job.id} className="border-t border-[var(--border)] pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{job.job_type.replaceAll("_", " ")}</p>
                    <Badge
                      tone={
                        job.status === "succeeded"
                          ? "success"
                          : job.status === "failed"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {job.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {job.feature.replaceAll("_", " ")} · {job.attempt_count} attempt(s) · created{" "}
                    {date(job.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-2xl font-bold">Account settings</h2>
          <div className="mt-5">
            <AccountSettings
              initial={{
                reportReadyEmail: preferenceResult.data?.report_ready_email ?? true,
                reportFailureEmail: preferenceResult.data?.report_failure_email ?? true
              }}
            />
          </div>
        </Card>
        <Card>
          <h2 className="text-2xl font-bold">Privacy request history</h2>
          {privacyRequests.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--text-muted)]">No privacy requests yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {privacyRequests.map((request) => (
                <li
                  key={request.id}
                  className="border-t border-[var(--border)] pt-4 first:border-0 first:pt-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold capitalize">{request.request_type} request</p>
                    <Badge tone={request.status === "completed" ? "success" : "neutral"}>
                      {request.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Received {date(request.created_at)}
                    {request.completed_at === null
                      ? ""
                      : ` · completed ${date(request.completed_at)}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Section>
  );
}
