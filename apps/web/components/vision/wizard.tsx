"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { dollarsToCents } from "@tract/mortgage-math";
import {
  type AnalysisType,
  type AssumptionKey,
  type AssumptionOverrides,
  type Ownership,
  type VisionInput,
  ASSUMPTION_CATALOGUE,
  runVisionScenario
} from "@tract/vision-model";
import { Badge, Button, Card } from "@/components/ui";
import {
  ANALYSIS_TYPE_META,
  FIELD_LABELS,
  SIZE_LABELS,
  type FieldKey,
  type SizeField,
  metaFor
} from "./copy";
import { NumberField, SelectField, TextField, parseOptionalNumber } from "./fields";
import { VisionPreview } from "./preview";
import { VisionReportRequest } from "./report-request";
import { newScenarioRef, trackVisionPreviewViewed, trackVisionStarted } from "./analytics";

/**
 * The Vision wizard.
 *
 * The whole point of the sequence is where the contact form sits: after a
 * complete, readable, honest result, not in front of one. Everything through
 * the preview runs in this browser tab against a pure arithmetic package —
 * nothing is sent anywhere, and nothing has to be, because there is no server
 * call to make. The only network request in the entire flow is the optional
 * report request at the end, and by then the person has already seen what they
 * came for and can decide whether it was worth an email address.
 */

const STEPS = ["type", "property", "assumptions", "preview", "report"] as const;
type Step = (typeof STEPS)[number];

const STEP_LABELS: Record<Step, string> = {
  type: "What you are modelling",
  property: "The property",
  assumptions: "Your numbers",
  preview: "Your result",
  report: "Full report"
};

type FieldState = Partial<Record<FieldKey, string>>;
type SizeState = Partial<Record<SizeField, string>>;

/** Assumptions surfaced in the wizard itself. The rest are shown with the result. */
const EXPOSED_OVERRIDES: Readonly<Record<AnalysisType, readonly AssumptionKey[]>> = {
  existing_home_renovation: ["contingencyRateBasisPoints", "valueUpliftShareOfSpendBasisPoints"],
  addition: ["contingencyRateBasisPoints", "valueUpliftShareOfSpendBasisPoints"],
  interior_upgrade: ["contingencyRateBasisPoints", "valueUpliftShareOfSpendBasisPoints"],
  land_new_construction: [
    "contingencyRateBasisPoints",
    "softCostRateBasisPoints",
    "completedValueToCostRatioBasisPoints"
  ],
  long_term_rental: ["longTermVacancyRateBasisPoints", "longTermManagementRateBasisPoints"],
  short_term_rental: ["shortTermVacancyRateBasisPoints", "shortTermManagementRateBasisPoints"],
  fix_and_flip: [
    "contingencyRateBasisPoints",
    "valueUpliftShareOfSpendBasisPoints",
    "sellingCostRateBasisPoints"
  ],
  buy_and_hold: ["longTermVacancyRateBasisPoints", "annualAppreciationBasisPoints"]
};

export function VisionWizard({
  disclosureText,
  disclosureVersion,
  smsConsentText,
  emailConsentText,
  turnstileSiteKey
}: {
  disclosureText: string;
  disclosureVersion: string;
  smsConsentText: string;
  emailConsentText: string;
  turnstileSiteKey?: string | undefined;
}) {
  const [step, setStep] = useState<Step>("type");
  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);
  const [ownership, setOwnership] = useState<Ownership>("purchasing");
  const [propertyLabel, setPropertyLabel] = useState("");
  const [price, setPrice] = useState("");
  const [sizes, setSizes] = useState<SizeState>({});
  const [fields, setFields] = useState<FieldState>({ rate: "7", term: "360" });
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [scenarioRef] = useState(newScenarioRef);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previewTracked = useRef(false);

  const meta = analysisType === null ? null : metaFor(analysisType);

  const input: VisionInput | null = useMemo(() => {
    if (analysisType === null) return null;

    const money = (key: FieldKey): number | undefined => {
      const parsed = parseOptionalNumber(fields[key] ?? "");
      return parsed === undefined ? undefined : dollarsToCents(Math.max(0, parsed));
    };
    const count = (key: SizeField): number | undefined => {
      const parsed = parseOptionalNumber(sizes[key] ?? "");
      return parsed === undefined ? undefined : Math.max(0, Math.round(parsed));
    };
    const priceCents = dollarsToCents(Math.max(0, parseOptionalNumber(price) ?? 0));
    const ratePercent = parseOptionalNumber(fields.rate ?? "");
    const termMonths = parseOptionalNumber(fields.term ?? "");
    const holdMonths = parseOptionalNumber(fields.holdMonths ?? "");

    const resolvedOverrides: AssumptionOverrides = {};
    for (const key of EXPOSED_OVERRIDES[analysisType]) {
      const raw = parseOptionalNumber(overrides[key] ?? "");
      if (raw === undefined) continue;
      // Every exposed override is a percentage in the UI and basis points in the model.
      resolvedOverrides[key] = Math.round(raw * 100);
    }

    const label = propertyLabel.trim();

    return {
      analysisType,
      ownership,
      purchasePriceCents: priceCents,
      ...(label === "" ? {} : { propertyLabel: label }),
      ...(count("squareFeet") === undefined ? {} : { squareFeet: count("squareFeet") as number }),
      ...(count("addedSquareFeet") === undefined
        ? {}
        : { addedSquareFeet: count("addedSquareFeet") as number }),
      ...(count("buildSquareFeet") === undefined
        ? {}
        : { buildSquareFeet: count("buildSquareFeet") as number }),
      ...(money("improvementBudget") === undefined
        ? {}
        : { improvementBudgetCents: money("improvementBudget") as number }),
      ...(money("expectedAfterValue") === undefined
        ? {}
        : { expectedAfterValueCents: money("expectedAfterValue") as number }),
      ...(money("downPayment") === undefined
        ? {}
        : { downPaymentCents: money("downPayment") as number }),
      ...(money("grossMonthlyRent") === undefined
        ? {}
        : { grossMonthlyRentCents: money("grossMonthlyRent") as number }),
      ...(money("nightlyRate") === undefined
        ? {}
        : { nightlyRateCents: money("nightlyRate") as number }),
      ...(money("annualPropertyTax") === undefined
        ? {}
        : { annualPropertyTaxCents: money("annualPropertyTax") as number }),
      ...(money("annualInsurance") === undefined
        ? {}
        : { annualInsuranceCents: money("annualInsurance") as number }),
      ...(money("monthlyHoa") === undefined
        ? {}
        : { monthlyHoaCents: money("monthlyHoa") as number }),
      ...(ratePercent === undefined
        ? {}
        : { annualRateBasisPoints: Math.max(0, Math.round(ratePercent * 100)) }),
      ...(termMonths === undefined ? {} : { termMonths: Math.round(termMonths) }),
      ...(holdMonths === undefined ? {} : { holdMonths: Math.round(holdMonths) }),
      ...(Object.keys(resolvedOverrides).length === 0 ? {} : { overrides: resolvedOverrides })
    };
  }, [analysisType, ownership, propertyLabel, price, sizes, fields, overrides]);

  const result = useMemo(() => (input === null ? null : runVisionScenario(input)), [input]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (step !== "preview" || analysisType === null || previewTracked.current) return;
    previewTracked.current = true;
    trackVisionPreviewViewed(analysisType, scenarioRef);
  }, [step, analysisType, scenarioRef]);

  const stepIndex = STEPS.indexOf(step);
  const canLeaveProperty = (parseOptionalNumber(price) ?? 0) > 0;

  const setField = (key: FieldKey, value: string): void =>
    setFields((current) => ({ ...current, [key]: value }));
  const setSize = (key: SizeField, value: string): void =>
    setSizes((current) => ({ ...current, [key]: value }));

  return (
    <div>
      <ol className="mb-8 flex flex-wrap gap-2" aria-label="Progress">
        {STEPS.map((entry, index) => {
          const state = index === stepIndex ? "current" : index < stepIndex ? "done" : "upcoming";
          return (
            <li key={entry}>
              <span
                aria-current={state === "current" ? "step" : undefined}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
                style={{
                  borderColor: state === "upcoming" ? "var(--border)" : "var(--purple)",
                  background: state === "current" ? "var(--purple-subtle)" : "transparent",
                  color: state === "upcoming" ? "var(--text-muted)" : "var(--purple)"
                }}
              >
                <span aria-hidden="true">{index + 1}</span>
                {STEP_LABELS[entry]}
              </span>
            </li>
          );
        })}
      </ol>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-bold text-[var(--text)] outline-none sm:text-3xl"
      >
        {STEP_LABELS[step]}
      </h2>

      {step === "type" && (
        <div className="mt-6">
          <p className="text-[var(--text-muted)]">
            Pick what you are actually trying to work out. Each one asks for different numbers and
            produces different figures.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {ANALYSIS_TYPE_META.map((entry) => {
              const selected = entry.type === analysisType;
              return (
                <button
                  key={entry.type}
                  type="button"
                  onClick={() => setAnalysisType(entry.type)}
                  aria-pressed={selected}
                  className="surface hover-float rounded-2xl p-5 text-left hover:border-[var(--purple)]"
                  style={selected ? { borderColor: "var(--purple)" } : undefined}
                >
                  <span className="block font-semibold text-[var(--text)]">{entry.label}</span>
                  <span className="mt-1 block text-sm text-[var(--text-muted)]">{entry.blurb}</span>
                  <span className="mt-3 block text-xs leading-relaxed text-[var(--text-muted)]">
                    <span className="font-semibold text-[var(--text)]">Tells you:</span>{" "}
                    {entry.answers}
                  </span>
                </button>
              );
            })}
          </div>

          {meta !== null && (
            <Card className="mt-6">
              <h3 className="font-semibold text-[var(--text)]">Have these to hand</h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-[var(--text-muted)]">
                {meta.needs.map((need) => (
                  <li key={need}>{need}</li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-[var(--text-muted)]">
                Anything you leave blank is filled with a labelled placeholder, and the result says
                which figures those placeholders drove.
              </p>
            </Card>
          )}

          <div className="mt-8">
            <Button
              type="button"
              disabled={analysisType === null}
              onClick={() => {
                if (analysisType === null) return;
                trackVisionStarted(analysisType);
                setStep("property");
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === "property" && meta !== null && (
        <div className="mt-6">
          <p className="text-[var(--text-muted)]">
            Nothing on this page leaves your browser. There is no lookup, no saved record, and no
            contact form until you have seen a result.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <SelectField
              id="vision-ownership"
              label="Do you own it?"
              value={ownership}
              onChange={setOwnership}
              options={[
                { value: "purchasing", label: "Buying it" },
                { value: "already_owned", label: "Already own it" }
              ]}
            />
            <TextField
              id="vision-label"
              label="Address or a name for it"
              optional
              value={propertyLabel}
              onChange={setPropertyLabel}
              placeholder="1420 Palmetto Way, or just: the corner lot"
              hint="Used only to label your result and, if you ask for a report, to tell us which property you mean. It is never sent to analytics."
            />
            <NumberField
              id="vision-price"
              label={meta.priceLabel}
              value={price}
              onChange={setPrice}
              prefix="$"
              step={1_000}
              hint="If you already own it, put what you believe it is worth. This model does not value anything."
            />
            {meta.sizeFields.map((sizeField) => (
              <NumberField
                key={sizeField}
                id={`vision-${sizeField}`}
                label={SIZE_LABELS[sizeField]}
                optional
                value={sizes[sizeField] ?? ""}
                onChange={(value) => setSize(sizeField, value)}
                suffix="sq ft"
                step={50}
              />
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep("type")}>
              Back
            </Button>
            <Button
              type="button"
              disabled={!canLeaveProperty}
              onClick={() => setStep("assumptions")}
            >
              Continue
            </Button>
          </div>
          {!canLeaveProperty && (
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              A price or value is needed before anything else can mean much.
            </p>
          )}
        </div>
      )}

      {step === "assumptions" && meta !== null && analysisType !== null && (
        <div className="mt-6">
          <p className="text-[var(--text-muted)]">
            Every blank field is filled with a placeholder that is not market data. The more of
            these you fill in with real figures, the more the result is worth.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {meta.fields.map((fieldKey) => {
              const copy = FIELD_LABELS[fieldKey];
              if (fieldKey === "term") {
                return (
                  <SelectField
                    key={fieldKey}
                    id="vision-term"
                    label={copy.label}
                    value={fields.term ?? "360"}
                    onChange={(value) => setField("term", value)}
                    options={[
                      { value: "360", label: "30 years" },
                      { value: "240", label: "20 years" },
                      { value: "180", label: "15 years" }
                    ]}
                  />
                );
              }
              if (fieldKey === "rate") {
                return (
                  <NumberField
                    key={fieldKey}
                    id="vision-rate"
                    label={copy.label}
                    hint={copy.hint}
                    value={fields.rate ?? ""}
                    onChange={(value) => setField("rate", value)}
                    suffix="%"
                    step={0.125}
                  />
                );
              }
              if (fieldKey === "holdMonths") {
                return (
                  <NumberField
                    key={fieldKey}
                    id="vision-hold"
                    label={copy.label}
                    hint={copy.hint}
                    optional
                    value={fields.holdMonths ?? ""}
                    onChange={(value) => setField("holdMonths", value)}
                    suffix="months"
                    step={1}
                  />
                );
              }
              return (
                <NumberField
                  key={fieldKey}
                  id={`vision-${fieldKey}`}
                  label={copy.label}
                  hint={copy.hint}
                  optional
                  value={fields[fieldKey] ?? ""}
                  onChange={(value) => setField(fieldKey, value)}
                  prefix="$"
                  step={100}
                />
              );
            })}
          </div>

          <details className="mt-8 rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
            <summary className="cursor-pointer font-semibold text-[var(--text)]">
              Change the assumptions that drive the answer
            </summary>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              These are the placeholders with the most influence on your result and the least
              evidence behind them. Each is a modelled assumption, not market data. Every other
              assumption is listed with your result.
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {EXPOSED_OVERRIDES[analysisType].map((key) => {
                const spec = ASSUMPTION_CATALOGUE[key];
                return (
                  <NumberField
                    key={key}
                    id={`vision-override-${key}`}
                    label={spec.label}
                    hint={spec.note}
                    optional
                    value={overrides[key] ?? ""}
                    onChange={(value) => setOverrides((current) => ({ ...current, [key]: value }))}
                    suffix="%"
                    min={spec.min / 100}
                    step={0.5}
                  />
                );
              })}
            </div>
            <p className="mt-4 text-xs text-[var(--text-muted)]">
              Leave one blank to keep the default of{" "}
              {EXPOSED_OVERRIDES[analysisType]
                .map((key) => `${ASSUMPTION_CATALOGUE[key].defaultValue / 100}%`)
                .join(", ")}{" "}
              respectively.
            </p>
          </details>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep("property")}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep("preview")}>
              See the result
            </Button>
          </div>
        </div>
      )}

      {step === "preview" && result !== null && analysisType !== null && (
        <div className="mt-6">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Badge tone="success">No contact details needed</Badge>
            <span className="text-sm text-[var(--text-muted)]">
              This ran in your browser. Nothing was sent anywhere.
            </span>
          </div>

          <VisionPreview result={result} />

          <div className="mt-10 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep("assumptions")}>
              Change my numbers
            </Button>
            <Button type="button" onClick={() => setStep("report")}>
              Get the full report
            </Button>
          </div>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            The report goes through the unverified items with a licensed mortgage professional. It
            is not an application, and it does not turn any figure above into an appraisal.
          </p>
        </div>
      )}

      {step === "report" && result !== null && input !== null && (
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <VisionReportRequest
            scenario={input}
            result={result}
            scenarioRef={scenarioRef}
            disclosureText={disclosureText}
            disclosureVersion={disclosureVersion}
            smsConsentText={smsConsentText}
            emailConsentText={emailConsentText}
            {...(turnstileSiteKey === undefined ? {} : { turnstileSiteKey })}
          />
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-[var(--text)]">What gets sent</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--text-muted)]">
                <li>What you entered, exactly as shown on your result</li>
                <li>The modelled ranges and the confidence level</li>
                <li>The list of things nobody has verified</li>
                <li>Your name, email, and phone, so someone can reply</li>
              </ul>
              <p className="mt-4 text-sm text-[var(--text-muted)]">
                Nothing sensitive. No documents, no account numbers, no government identifiers —
                this is a marketing enquiry, not an application, and it never becomes one here.
              </p>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold text-[var(--text)]">
                What the report still will not be
              </h3>
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                An appraisal, a valuation, a broker price opinion, a construction bid, a zoning or
                permitting opinion, an offer of credit, or a recommendation to buy or build
                anything. The arithmetic does not change because a person read it.
              </p>
            </Card>
            <Button type="button" variant="secondary" onClick={() => setStep("preview")}>
              Back to my result
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
