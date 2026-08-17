import { Card } from "@/components/ui";
import { features } from "@/lib/env";
import { databaseConfigured } from "@/lib/supabase";
import { businessIdentity, licensingStatus } from "@/lib/site";
import { requireStaff } from "@/lib/authz";

/**
 * Launch readiness.
 *
 * The single board that answers "can we go live". Items marked human-owned
 * cannot be satisfied by writing code, and the page says so explicitly so
 * nobody mistakes a green technical column for permission to launch.
 */

type State = "blocked" | "in_progress" | "ready" | "approved" | "not_applicable";

type Gate = {
  area: string;
  item: string;
  state: State;
  owner: "engineering" | "principal_loan_originator" | "counsel" | "compliance" | "founders";
  note: string;
};

const STATE_LABEL: Record<State, string> = {
  blocked: "Blocked",
  in_progress: "In progress",
  ready: "Ready for review",
  approved: "Approved",
  not_applicable: "Not applicable"
};

const STATE_TONE: Record<State, string> = {
  blocked: "bg-danger/10 text-danger",
  in_progress: "bg-warning/10 text-warning",
  ready: "bg-[var(--purple-subtle)] text-[var(--purple)]",
  approved: "bg-success/10 text-success",
  not_applicable: "bg-[var(--bg)] text-[var(--text-muted)]"
};

function technicalGates(): Gate[] {
  const state = features();
  const configured = (ok: boolean): State => (ok ? "approved" : "blocked");

  return [
    {
      area: "Platform",
      item: "Database configured and migrations applied",
      state: configured(databaseConfigured()),
      owner: "engineering",
      note: "Without it there is no durable lead receipt, so the lead endpoint fails closed rather than pretending to succeed."
    },
    {
      area: "Platform",
      item: "Bot challenge active on conversion forms",
      state: state.turnstile === "production" ? "approved" : "in_progress",
      owner: "engineering",
      note: "Verified server-side. An unavailable challenge service fails closed."
    },
    {
      area: "Platform",
      item: "CRM sync connected",
      state: state.ghl === "production" ? "approved" : "in_progress",
      owner: "engineering",
      note: "Optional for launch. A CRM outage delays a sync; it never loses a lead."
    },
    {
      area: "Platform",
      item: "Secure application handoff configured",
      state: configured(state.secureApplicationConfigured),
      owner: "founders",
      note: "Requires a selected POS or LOS. Until it exists, /apply says applications are not open."
    },
    {
      area: "Platform",
      item: "Listing data agreement in place",
      state: state.mls === "fixture" || state.mls === "disabled" ? "blocked" : "approved",
      owner: "founders",
      note: "Fixture data cannot be published; the database constraint enforces this independently."
    },
    {
      area: "Platform",
      item: "AI provider budgets and quotas provisioned",
      state: state.ai === "disabled" ? "not_applicable" : "in_progress",
      owner: "engineering",
      note: "Spend is reserved before any provider call and a kill switch exists per feature and per provider."
    }
  ];
}

const HUMAN_GATES: Gate[] = [
  {
    area: "Licensing",
    item: "Florida mortgage broker company license issued",
    state: licensingStatus.companyLicensed ? "approved" : "blocked",
    owner: "principal_loan_originator",
    note: "Separate from any individual MLO license. Evidence: the issued license and the public NMLS record."
  },
  {
    area: "Licensing",
    item: "Principal loan originator designated and accepted by OFR",
    state: licensingStatus.principalLoanOriginatorNamed ? "approved" : "blocked",
    owner: "principal_loan_originator",
    note: "A designation the regulator must accept. Not the same as an individual holding an active MLO license."
  },
  {
    area: "Licensing",
    item: "Individual MLO licenses active and properly associated in NMLS",
    state: "blocked",
    owner: "principal_loan_originator",
    note: "Tracked per person. Nobody may originate, quote, negotiate, or take an application until theirs is active and associated."
  },
  {
    area: "Licensing",
    item: "Company NMLS record public on Consumer Access",
    state: licensingStatus.nmlsRecordPublic ? "approved" : "blocked",
    owner: "principal_loan_originator",
    note: `Until this is true, the site shows license fields as pending rather than displaying a number. Current value: ${businessIdentity.nmlsId ?? "none"}.`
  },
  {
    area: "Legal",
    item: "Legal pages reviewed by qualified counsel",
    state: "blocked",
    owner: "counsel",
    note: "Privacy, terms, disclosures, SMS terms, and the GLBA privacy notice. All currently shipped as drafts marked as such on the page itself."
  },
  {
    area: "Legal",
    item: "Affiliated business and referral analysis complete",
    state: "blocked",
    owner: "counsel",
    note: "Title, real estate, and processing relationships must be mapped before any cross-entity referral, data sharing, or co-marketing begins."
  },
  {
    area: "Legal",
    item: "Advertising review process operating",
    state: "blocked",
    owner: "compliance",
    note: "Every ad, landing page, script, and creative reviewed before publication and archived with substantiation for the applicable retention period."
  },
  {
    area: "Security",
    item: "Written information security program and Qualified Individual",
    state: "blocked",
    owner: "compliance",
    note: "The FTC Safeguards Rule expressly covers mortgage brokers. Required before any real borrower information enters any system."
  },
  {
    area: "Security",
    item: "Data inventory and flow map approved",
    state: "blocked",
    owner: "compliance",
    note: "Which data lives where, who owns it, how long it is kept, and every transfer between systems."
  },
  {
    area: "Compliance",
    item: "AML program and SAR procedures",
    state: "blocked",
    owner: "compliance",
    note: "FinCEN rules apply to nonbank residential mortgage lenders and originators."
  },
  {
    area: "Compliance",
    item: "Consent, suppression, and telemarketing procedures verified",
    state: "in_progress",
    owner: "compliance",
    note: "The consent ledger and suppression tables exist and are enforced in code. The operating procedure and current-rule verification are human-owned."
  },
  {
    area: "Compliance",
    item: "Lender agreements executed for every product offered",
    state: "blocked",
    owner: "founders",
    note: "No program page may describe an available product without an executed agreement covering it."
  }
];

export default async function ReadinessPage() {
  const session = await requireStaff();
  if (!session.authorized) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Launch readiness</h1>
        <p className="mt-4 text-[var(--text-muted)]">{session.message}</p>
      </div>
    );
  }

  const gates = [...technicalGates(), ...HUMAN_GATES];
  const blocking = gates.filter((gate) => gate.state === "blocked");

  return (
    <div>
      <h1 className="text-3xl font-bold">Launch readiness</h1>
      <p className="mt-2 max-w-3xl text-[var(--text-muted)]">
        Every gate that must be satisfied before this brokerage conducts regulated activity or runs
        paid mortgage advertising. Items owned by counsel, compliance, or the principal loan
        originator cannot be satisfied by shipping code, and a green technical column is not
        permission to launch.
      </p>

      <Card className="mt-6 border-danger/40 bg-danger/5">
        <p className="font-semibold text-danger">
          {blocking.length} blocking {blocking.length === 1 ? "item" : "items"}
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          While any licensing gate is blocked: the site stays in its pre-launch state, no
          application may be accepted, no credit may be pulled, no rate or term may be quoted or
          negotiated, no preapproval may be issued, and no paid mortgage advertising may run.
        </p>
      </Card>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Launch gates by area, with owner and current state</caption>
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th scope="col" className="py-3 pr-4 font-semibold">
                Area
              </th>
              <th scope="col" className="py-3 pr-4 font-semibold">
                Gate
              </th>
              <th scope="col" className="py-3 pr-4 font-semibold">
                State
              </th>
              <th scope="col" className="py-3 pr-4 font-semibold">
                Owner
              </th>
              <th scope="col" className="py-3 font-semibold">
                Note
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {gates.map((gate) => (
              <tr key={`${gate.area}-${gate.item}`}>
                <td className="py-3 pr-4 align-top text-[var(--text-muted)]">{gate.area}</td>
                <td className="py-3 pr-4 align-top font-medium">{gate.item}</td>
                <td className="py-3 pr-4 align-top">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATE_TONE[gate.state]}`}
                  >
                    {STATE_LABEL[gate.state]}
                  </span>
                </td>
                <td className="py-3 pr-4 align-top text-[var(--text-muted)]">
                  {gate.owner.replace(/_/g, " ")}
                </td>
                <td className="py-3 align-top text-[var(--text-muted)]">{gate.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
