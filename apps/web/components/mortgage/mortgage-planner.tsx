"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CALCULATION_VERSION,
  affordability,
  dollarsToCents,
  formatUsd,
  monthlyHousingCost
} from "@tract/mortgage-math";
import type { LeadIntent, PlanningSnapshot } from "@tract/schemas";
import { LeadForm } from "@/components/lead-form";
import { Button, Card } from "@/components/ui";

const PLANNER_VERSION = "mortgage-planner@1.0.0";
const SAVED_PLANS_KEY = "tract.mortgage-plans.saved";

type PlannerIntent = "buying" | "refinancing" | "investing" | "building" | "unsure";
type Timeline = "now" | "0_3_months" | "3_6_months" | "6_plus" | "researching";

const intentOptions: { value: PlannerIntent; label: string; detail: string }[] = [
  { value: "buying", label: "Buying", detail: "First home, move-up, or relocation" },
  { value: "refinancing", label: "Refinancing", detail: "Payment, term, or cash-out planning" },
  { value: "investing", label: "Investing", detail: "Rental or resale scenario" },
  { value: "building", label: "Building", detail: "Land and construction conversation" },
  { value: "unsure", label: "Not sure", detail: "Start with a broad planning range" }
];

const intentMap: Record<PlannerIntent, LeadIntent> = {
  buying: "purchase",
  refinancing: "refinance",
  investing: "investment",
  building: "purchase",
  unsure: "general"
};

const timelineLabels: Record<Timeline, string> = {
  now: "Ready now",
  "0_3_months": "Within 3 months",
  "3_6_months": "3 to 6 months",
  "6_plus": "More than 6 months",
  researching: "Researching"
};

function numeric(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function fieldClass(): string {
  return "mt-1.5 min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base focus:border-[var(--purple)]";
}

function StepHeading({ step, title, body }: { step: number; title: string; body: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[var(--purple)]">
        Step {step} of 5
      </p>
      <h2 className="mt-2 text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{body}</p>
    </div>
  );
}

export function MortgagePlanner({
  disclosureText,
  smsConsentText,
  emailConsentText,
  turnstileSiteKey
}: {
  disclosureText: string;
  smsConsentText: string;
  emailConsentText: string;
  turnstileSiteKey?: string | undefined;
}) {
  const [step, setStep] = useState(1);
  const [intent, setIntent] = useState<PlannerIntent>("buying");
  const [market, setMarket] = useState("Tampa Bay");
  const [timeline, setTimeline] = useState<Timeline>("3_6_months");
  const [targetPrice, setTargetPrice] = useState(425_000);
  const [targetMonthly, setTargetMonthly] = useState(3_200);
  const [downPayment, setDownPayment] = useState(55_000);
  const [creditBand, setCreditBand] = useState("unknown");
  const [incomeType, setIncomeType] = useState("salary");
  const [grossMonthlyIncome, setGrossMonthlyIncome] = useState(0);
  const [monthlyDebt, setMonthlyDebt] = useState(0);
  const [occupancy, setOccupancy] = useState("primary_residence");
  const [savedMessage, setSavedMessage] = useState("");
  const [accountSaveState, setAccountSaveState] = useState<
    "idle" | "saving" | "saved" | "signin" | "error"
  >("idle");
  const accountSaveId = useRef<string | null>(null);

  const plan = useMemo(() => {
    const boundedDownPayment = Math.min(targetPrice, downPayment);
    const loanAmount = Math.max(0, targetPrice - boundedDownPayment);
    const downPercent = targetPrice === 0 ? 0 : (boundedDownPayment / targetPrice) * 100;
    const housing = monthlyHousingCost({
      loanAmountCents: dollarsToCents(loanAmount),
      annualRateBasisPoints: 650,
      termMonths: 360,
      annualPropertyTaxCents: dollarsToCents(targetPrice * 0.011),
      annualHomeownersInsuranceCents: dollarsToCents(4_200),
      ...(downPercent < 20 ? { mortgageInsuranceAnnualRateBasisPoints: 55 } : {})
    });

    let affordabilityPriceCents: number | null = null;
    if (grossMonthlyIncome > 0) {
      affordabilityPriceCents = affordability({
        grossMonthlyIncomeCents: dollarsToCents(grossMonthlyIncome),
        monthlyDebtObligationsCents: dollarsToCents(monthlyDebt),
        downPaymentCents: dollarsToCents(boundedDownPayment),
        annualRateBasisPoints: 650,
        termMonths: 360,
        propertyTaxAnnualRateBasisPoints: 110,
        annualHomeownersInsuranceCents: dollarsToCents(4_200)
      }).estimatedPurchasePriceCents;
    }

    return { housing, affordabilityPriceCents, boundedDownPayment, loanAmount, downPercent };
  }, [downPayment, grossMonthlyIncome, monthlyDebt, targetPrice]);

  const summary = `${intentOptions.find((option) => option.value === intent)?.label ?? "Planning"} · ${market || "Florida"} · ${timelineLabels[timeline]} · ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(targetPrice)} target · ${occupancy.replaceAll("_", " ")}`;

  const snapshot: PlanningSnapshot = {
    source: "mortgage_planner",
    version: PLANNER_VERSION,
    calculationVersion: CALCULATION_VERSION,
    inputSnapshot: {
      intent,
      market: market.slice(0, 100),
      timeline,
      targetPriceDollars: targetPrice,
      targetMonthlyDollars: targetMonthly,
      downPaymentDollars: plan.boundedDownPayment,
      creditBand,
      incomeType,
      grossMonthlyIncomeDollars: grossMonthlyIncome,
      monthlyDebtDollars: monthlyDebt,
      occupancy,
      assumedRateBasisPoints: 650,
      assumedTaxRateBasisPoints: 110,
      assumedAnnualInsuranceDollars: 4200
    },
    resultSnapshot: {
      loanAmountDollars: plan.loanAmount,
      estimatedMonthlyHousingDollars: Math.round(plan.housing.totalMonthlyCents / 100),
      illustrativeAffordabilityDollars:
        plan.affordabilityPriceCents === null
          ? null
          : Math.round(plan.affordabilityPriceCents / 100)
    },
    summary
  };

  function saveLocally() {
    try {
      const raw = window.localStorage.getItem(SAVED_PLANS_KEY);
      const current = raw === null ? null : (JSON.parse(raw) as { items?: unknown[] });
      const items = Array.isArray(current?.items) ? current.items.slice(-9) : [];
      items.push({ id: window.crypto.randomUUID(), savedAt: new Date().toISOString(), snapshot });
      window.localStorage.setItem(
        SAVED_PLANS_KEY,
        JSON.stringify({ version: PLANNER_VERSION, items })
      );
      setSavedMessage("Saved on this device. Nothing was sent to TRACT.");
    } catch {
      setSavedMessage("This browser blocked local storage, so the plan was not saved.");
    }
  }

  async function saveToAccount() {
    accountSaveId.current ??= window.crypto.randomUUID();
    setAccountSaveState("saving");
    try {
      const response = await fetch("/api/v1/account/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saveId: accountSaveId.current, snapshot })
      });
      if (response.ok) {
        accountSaveId.current = null;
        setAccountSaveState("saved");
      } else {
        setAccountSaveState(response.status === 401 ? "signin" : "error");
      }
    } catch {
      setAccountSaveState("error");
    }
  }

  return (
    <div data-testid="mortgage-planner">
      <nav aria-label="Mortgage planner progress" className="mb-6">
        <ol className="flex gap-2">
          {[1, 2, 3, 4, 5].map((number) => (
            <li key={number} className="flex-1">
              <div
                className={`h-1.5 rounded-full ${number <= step ? "bg-[var(--purple)]" : "bg-[var(--border)]"}`}
              />
              <span className="sr-only">Step {number}</span>
            </li>
          ))}
        </ol>
      </nav>

      {step === 1 && (
        <Card>
          <StepHeading
            step={1}
            title="What are you planning?"
            body="Choose the closest starting point. This does not commit you to a loan type."
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {intentOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setIntent(option.value)}
                aria-pressed={intent === option.value}
                className={`min-h-[76px] rounded-xl border p-4 text-left ${intent === option.value ? "border-[var(--purple)] bg-[var(--purple-subtle)]" : "border-[var(--border)]"}`}
              >
                <span className="block font-semibold">{option.label}</span>
                <span className="mt-1 block text-sm text-[var(--text-muted)]">{option.detail}</span>
              </button>
            ))}
          </div>
          <Button className="mt-6" type="button" onClick={() => setStep(2)}>
            Continue to timing
          </Button>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <StepHeading
            step={2}
            title="Where and when?"
            body="A city, county, or ZIP is enough. Do not enter a street address."
          />
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Florida market or ZIP
              <input
                value={market}
                maxLength={100}
                onChange={(event) => setMarket(event.target.value)}
                className={fieldClass()}
              />
            </label>
            <label className="text-sm font-semibold">
              Timing
              <select
                value={timeline}
                onChange={(event) => setTimeline(event.target.value as Timeline)}
                className={fieldClass()}
              >
                {Object.entries(timelineLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep(3)}>
              Continue to numbers
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <StepHeading
            step={3}
            title="Add optional planning inputs"
            body="These are self-reported estimates. Nothing is pulled from your credit and nothing leaves this browser unless you choose to send the plan in step 5."
          />
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Target price or value
              <input
                type="number"
                min="0"
                step="5000"
                value={targetPrice}
                onChange={(event) => setTargetPrice(numeric(event.target.value))}
                className={fieldClass()}
              />
            </label>
            <label className="text-sm font-semibold">
              Target monthly housing payment
              <input
                type="number"
                min="0"
                step="100"
                value={targetMonthly}
                onChange={(event) => setTargetMonthly(numeric(event.target.value))}
                className={fieldClass()}
              />
            </label>
            <label className="text-sm font-semibold">
              Down payment or equity
              <input
                type="number"
                min="0"
                step="1000"
                value={downPayment}
                onChange={(event) => setDownPayment(numeric(event.target.value))}
                className={fieldClass()}
              />
            </label>
            <label className="text-sm font-semibold">
              Self-reported credit band
              <select
                value={creditBand}
                onChange={(event) => setCreditBand(event.target.value)}
                className={fieldClass()}
              >
                <option value="unknown">Prefer not to say / unknown</option>
                <option value="below_580">Below 580</option>
                <option value="580_619">580–619</option>
                <option value="620_679">620–679</option>
                <option value="680_719">680–719</option>
                <option value="720_759">720–759</option>
                <option value="760_plus">760+</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Income type
              <select
                value={incomeType}
                onChange={(event) => setIncomeType(event.target.value)}
                className={fieldClass()}
              >
                <option value="salary">Salary / W-2</option>
                <option value="self_employed">Self-employed / business owner</option>
                <option value="contract">Contract / 1099</option>
                <option value="mixed">Mixed sources</option>
                <option value="not_sure">Not sure</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Occupancy
              <select
                value={occupancy}
                onChange={(event) => setOccupancy(event.target.value)}
                className={fieldClass()}
              >
                <option value="primary_residence">Primary residence</option>
                <option value="second_home">Second home</option>
                <option value="investment">Investment property</option>
                <option value="not_sure">Not sure</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Gross monthly income{" "}
              <span className="font-normal text-[var(--text-muted)]">(optional)</span>
              <input
                type="number"
                min="0"
                step="250"
                value={grossMonthlyIncome}
                onChange={(event) => setGrossMonthlyIncome(numeric(event.target.value))}
                className={fieldClass()}
              />
            </label>
            <label className="text-sm font-semibold">
              Monthly debt obligations{" "}
              <span className="font-normal text-[var(--text-muted)]">(optional)</span>
              <input
                type="number"
                min="0"
                step="50"
                value={monthlyDebt}
                onChange={(event) => setMonthlyDebt(numeric(event.target.value))}
                className={fieldClass()}
              />
            </label>
          </div>
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            Do not enter an SSN, date of birth, account number, documents, or a street address.
            Those belong only in an approved secure application system.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep(4)}>
              Show my planning range
            </Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <Card
            dataTestId="planner-preview"
            className="border-[var(--purple)] !bg-[var(--purple-subtle)]"
          >
            <StepHeading
              step={4}
              title="Your preliminary planning range"
              body="Immediate value first. Contact details are optional and come next."
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-purple-900 p-4">
                <p className="text-xs uppercase tracking-wide text-purple-300">
                  Estimated housing payment
                </p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {formatUsd(plan.housing.totalMonthlyCents)}
                </p>
              </div>
              <div className="rounded-xl bg-purple-900 p-4">
                <p className="text-xs uppercase tracking-wide text-purple-300">
                  Illustrative loan amount
                </p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {formatUsd(dollarsToCents(plan.loanAmount))}
                </p>
              </div>
              <div className="rounded-xl bg-purple-900 p-4">
                <p className="text-xs uppercase tracking-wide text-purple-300">
                  Target payment difference
                </p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {formatUsd(plan.housing.totalMonthlyCents - dollarsToCents(targetMonthly))}
                </p>
              </div>
            </div>
            {plan.affordabilityPriceCents !== null && (
              <p className="mt-5 text-sm text-purple-100">
                With the optional income and debt values, the illustrative ratio model returns{" "}
                {formatUsd(plan.affordabilityPriceCents)}. This is not a qualification or approval.
              </p>
            )}
            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-purple-300">Assumed rate</dt>
                <dd>6.50% · editable later in the payment calculator</dd>
              </div>
              <div>
                <dt className="text-purple-300">Tax assumption</dt>
                <dd>1.10% of price annually</dd>
              </div>
              <div>
                <dt className="text-purple-300">Insurance assumption</dt>
                <dd>$4,200 annually</dd>
              </div>
              <div>
                <dt className="text-purple-300">Mortgage insurance</dt>
                <dd>
                  {plan.downPercent < 20
                    ? "0.55% annual planning input"
                    : "Not included at 20%+ down"}
                </dd>
              </div>
            </dl>
            <p className="mt-5 text-xs text-purple-300">
              Calculation version {plan.housing.calculationVersion}
            </p>
          </Card>
          <Card>
            <h3 className="text-xl font-bold">Recommended next tool</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {intent === "refinancing"
                ? "Compare your current payment and closing costs in the refinance break-even calculator."
                : intent === "investing"
                  ? "Explore a synthetic duplex and carry the property into TRACT Vision."
                  : "Open the full payment calculator to replace every assumption with a precise number."}
            </p>
            <Link
              className="mt-4 inline-block font-semibold text-[var(--purple)] underline underline-offset-4"
              href={
                intent === "refinancing"
                  ? "/calculators/refinance-break-even"
                  : intent === "investing"
                    ? "/properties/FX-JAX-0005"
                    : "/calculators/mortgage-payment"
              }
            >
              Open recommended tool
            </Link>
          </Card>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep(3)}>
              Change inputs
            </Button>
            <Button type="button" variant="secondary" onClick={saveLocally}>
              Save on this device
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={saveToAccount}
              disabled={accountSaveState === "saving"}
            >
              {accountSaveState === "saving"
                ? "Saving…"
                : accountSaveState === "saved"
                  ? "Saved to account"
                  : "Save to my account"}
            </Button>
            <Button type="button" onClick={() => setStep(5)}>
              Save with TRACT or talk
            </Button>
          </div>
          {savedMessage !== "" && (
            <p
              role="status"
              data-testid="planner-save-status"
              className="text-sm text-[var(--text-muted)]"
            >
              {savedMessage}
            </p>
          )}
          {accountSaveState === "signin" && (
            <p role="status" className="text-sm text-[var(--text-muted)]">
              <Link href="/account" className="font-semibold text-[var(--purple)] underline">
                Sign in
              </Link>{" "}
              to save this plan across devices. The planner remains available without an account.
            </p>
          )}
          {accountSaveState === "error" && (
            <p role="status" className="text-sm text-[var(--text-muted)]">
              The account save was not confirmed. Retry to check the same request.
            </p>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StepHeading
              step={5}
              title="Choose whether to send it"
              body="The result was already available. Submit only if you want TRACT to retain the plan and contact you about it."
            />
            <Button type="button" variant="secondary" onClick={() => setStep(4)}>
              Back to result
            </Button>
          </div>
          <LeadForm
            intent={intentMap[intent]}
            formId="mortgage-planner"
            heading="Ask TRACT to review this plan"
            submitLabel="Send my plan for review"
            disclosureText={disclosureText}
            smsConsentText={smsConsentText}
            emailConsentText={emailConsentText}
            turnstileSiteKey={turnstileSiteKey}
            planningSnapshot={snapshot}
          />
        </div>
      )}
    </div>
  );
}
