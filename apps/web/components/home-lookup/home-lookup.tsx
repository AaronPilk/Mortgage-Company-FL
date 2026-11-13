"use client";

import { useMemo, useState } from "react";
import {
  affordability,
  cashToClose,
  centsToDollars,
  dollarsToCents,
  estimateClosingCostsCents,
  formatUsd,
  monthlyHousingCost,
  propertyTaxRateBasisPoints
} from "@tract/mortgage-math";
import { ButtonLink } from "@/components/ui";
import { usd } from "@/components/calculators/field";
import type { HomeLookupResult, PropertyLookupResponse } from "@/lib/home-lookup-types";

/**
 * Home lookup.
 *
 * Paste a listing link (or type an address); a licensed record answers it and
 * seeds the numbers. Everything the visitor edits — the price they actually
 * saw, their down payment, their income — recomputes on the device through
 * @tract/mortgage-math. It is an estimate, never a decision: no line here says
 * anyone is approved, and nothing typed into the estimate is transmitted.
 */

type Status = "idle" | "loading" | "found" | "not_found" | "error";

type ManualAddress = { line1: string; city: string; state: string; postalCode: string };

const EMPTY_ADDRESS: ManualAddress = { line1: "", city: "", state: "", postalCode: "" };

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  className = ""
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-semibold" style={{ color: "var(--text)" }}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 min-h-[44px] w-full rounded-lg border px-3 text-base outline-none focus:border-[var(--purple)]"
        style={{ borderColor: "var(--border)", background: "var(--bg)" }}
      />
    </div>
  );
}

function NumField({
  id,
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
  hint
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold" style={{ color: "var(--text)" }}>
        {label}
      </label>
      <div
        className="mt-1.5 flex items-center gap-2 rounded-lg border px-3 focus-within:border-[var(--purple)]"
        style={{ borderColor: "var(--border)", background: "var(--bg)" }}
      >
        {prefix !== undefined && (
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-h-[44px] w-full bg-transparent py-2 text-base tabular-nums outline-none"
        />
        {suffix !== undefined && (
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {suffix}
          </span>
        )}
      </div>
      {hint !== undefined && (
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="rounded-full px-3 py-1 text-sm font-medium"
      style={{ background: "var(--surface-2)", color: "var(--text)" }}
    >
      {children}
    </span>
  );
}

export function HomeLookupExperience() {
  const [link, setLink] = useState("");
  const [address, setAddress] = useState<ManualAddress>(EMPTY_ADDRESS);
  const [showManual, setShowManual] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [confirmNote, setConfirmNote] = useState<string | null>(null);
  const [result, setResult] = useState<HomeLookupResult | null>(null);

  // Estimate inputs, in dollars/percent for the UI and converted at the math boundary.
  const [priceDollars, setPriceDollars] = useState(425_000);
  const [downPercent, setDownPercent] = useState(20);
  const [annualIncomeDollars, setAnnualIncomeDollars] = useState(95_000);
  const [monthlyDebtsDollars, setMonthlyDebtsDollars] = useState(500);
  const [rateBp, setRateBp] = useState(650);
  const [annualTaxDollars, setAnnualTaxDollars] = useState(5_000);
  const [annualInsuranceDollars, setAnnualInsuranceDollars] = useState(3_600);
  const [annualFloodInsuranceDollars, setAnnualFloodInsuranceDollars] = useState(0);
  const [monthlyHoaDollars, setMonthlyHoaDollars] = useState(0);

  function seedFromResult(found: HomeLookupResult): void {
    const anchorCents =
      found.value?.estimateCents ?? found.assessedValueCents ?? found.lastSale?.priceCents ?? null;
    if (anchorCents !== null) setPriceDollars(Math.round(centsToDollars(anchorCents)));
    if (found.annualTaxAmountCents !== null) {
      setAnnualTaxDollars(Math.round(centsToDollars(found.annualTaxAmountCents)));
    }
    if (found.baseline !== null) {
      // The "true cost" seeds: value-aware homeowners insurance, plus flood if
      // the home sits in a Special Flood Hazard Area.
      setAnnualInsuranceDollars(
        Math.round(centsToDollars(found.baseline.annualHomeInsuranceCents))
      );
      setAnnualFloodInsuranceDollars(
        Math.round(centsToDollars(found.baseline.annualFloodInsuranceCents))
      );
    }
  }

  async function runLookup(body: { link: string } | { address: ManualAddress }): Promise<void> {
    setStatus("loading");
    setConfirmNote(null);
    try {
      const response = await fetch("/api/v1/property-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const json = (await response.json()) as {
        ok?: boolean;
        data?: PropertyLookupResponse;
      };
      if (!response.ok || json.ok !== true || json.data === undefined) {
        setStatus("error");
        return;
      }
      const data = json.data;
      if (data.status === "needs_address") {
        setAddress({
          line1: data.parsed.line1 ?? "",
          city: data.parsed.city ?? "",
          state: data.parsed.state ?? "",
          postalCode: data.parsed.postalCode ?? ""
        });
        setShowManual(true);
        setConfirmNote("We read this from your link — check it's right, then look it up.");
        setStatus("idle");
        return;
      }
      if (data.status === "not_found") {
        setAddress(data.address);
        setShowManual(true);
        setStatus("not_found");
        return;
      }
      setResult(data.result);
      seedFromResult(data.result);
      setStatus("found");
    } catch {
      setStatus("error");
    }
  }

  const addressReady =
    address.line1.trim() !== "" &&
    address.city.trim() !== "" &&
    address.state.trim().length === 2 &&
    /^\d{5}$/.test(address.postalCode.trim());

  const estimate = useMemo(() => {
    const priceCents = dollarsToCents(priceDollars);
    const downPaymentDollars = Math.round((priceDollars * downPercent) / 100);
    const loanDollars = Math.max(0, priceDollars - downPaymentDollars);
    const appliesMi = downPercent < 20;

    const payment = monthlyHousingCost({
      loanAmountCents: dollarsToCents(loanDollars),
      annualRateBasisPoints: rateBp,
      termMonths: 360,
      annualPropertyTaxCents: dollarsToCents(annualTaxDollars),
      annualHomeownersInsuranceCents: dollarsToCents(annualInsuranceDollars),
      annualFloodInsuranceCents: dollarsToCents(annualFloodInsuranceDollars),
      monthlyHoaCents: dollarsToCents(monthlyHoaDollars),
      ...(appliesMi ? { mortgageInsuranceAnnualRateBasisPoints: 55 } : {})
    });

    const afford = affordability({
      grossMonthlyIncomeCents: dollarsToCents(Math.round(annualIncomeDollars / 12)),
      monthlyDebtObligationsCents: dollarsToCents(monthlyDebtsDollars),
      downPaymentCents: dollarsToCents(downPaymentDollars),
      annualRateBasisPoints: rateBp,
      termMonths: 360,
      propertyTaxAnnualRateBasisPoints: propertyTaxRateBasisPoints(
        dollarsToCents(annualTaxDollars),
        priceCents
      ),
      annualHomeownersInsuranceCents: dollarsToCents(
        annualInsuranceDollars + annualFloodInsuranceDollars
      ),
      monthlyHoaCents: dollarsToCents(monthlyHoaDollars),
      ...(appliesMi ? { mortgageInsuranceAnnualRateBasisPoints: 55 } : {})
    });

    const closingCostsCents = estimateClosingCostsCents(priceCents);
    const ctc = cashToClose({
      purchasePriceCents: priceCents,
      downPaymentCents: dollarsToCents(downPaymentDollars),
      estimatedClosingCostsCents: closingCostsCents
    });

    return {
      downPaymentDollars,
      monthlyTotalCents: payment.totalMonthlyCents,
      piCents: payment.principalAndInterestCents,
      taxCents: payment.propertyTaxCents,
      insuranceCents: payment.homeownersInsuranceCents,
      floodInsuranceCents: payment.floodInsuranceCents,
      hoaCents: payment.hoaCents,
      miCents: payment.mortgageInsuranceCents,
      cashToCloseCents: ctc.estimatedCashToCloseCents,
      closingCostsCents,
      affordablePriceCents: afford.estimatedPurchasePriceCents,
      fits: priceCents <= afford.estimatedPurchasePriceCents
    };
  }, [
    priceDollars,
    downPercent,
    annualIncomeDollars,
    monthlyDebtsDollars,
    rateBp,
    annualTaxDollars,
    annualInsuranceDollars,
    annualFloodInsuranceDollars,
    monthlyHoaDollars
  ]);

  const affordablePriceDollars = Math.round(centsToDollars(estimate.affordablePriceCents));

  return (
    <div className="space-y-8">
      {/* Input */}
      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <label
          htmlFor="listing-link"
          className="text-sm font-semibold"
          style={{ color: "var(--text)" }}
        >
          Paste a listing link
        </label>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          From Zillow, Redfin, Realtor.com — anywhere. We read the address out of the link; we never
          pull anything from the site itself.
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="listing-link"
            type="url"
            inputMode="url"
            value={link}
            placeholder="https://www.zillow.com/homedetails/…"
            onChange={(event) => setLink(event.target.value)}
            className="min-h-[48px] flex-1 rounded-lg border px-3 text-base outline-none focus:border-[var(--purple)]"
            style={{ borderColor: "var(--border)", background: "var(--bg)" }}
          />
          <button
            type="button"
            disabled={link.trim() === "" || status === "loading"}
            onClick={() => void runLookup({ link: link.trim() })}
            className="min-h-[48px] rounded-lg px-5 text-base font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--purple)" }}
          >
            {status === "loading" ? "Looking up…" : "Look up this home"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowManual((open) => !open)}
          className="mt-4 text-sm font-medium underline underline-offset-4"
          style={{ color: "var(--purple)" }}
        >
          {showManual ? "Hide address fields" : "Or enter the address"}
        </button>

        {showManual && (
          <div className="mt-4 space-y-3">
            {confirmNote !== null && (
              <p
                className="rounded-lg border p-3 text-sm"
                style={{
                  borderColor: "var(--purple)",
                  background: "var(--purple-subtle)",
                  color: "var(--text)"
                }}
              >
                {confirmNote}
              </p>
            )}
            <TextField
              id="addr-line1"
              label="Street address"
              value={address.line1}
              onChange={(v) => setAddress((a) => ({ ...a, line1: v }))}
              placeholder="123 Example St"
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <TextField
                id="addr-city"
                label="City"
                value={address.city}
                onChange={(v) => setAddress((a) => ({ ...a, city: v }))}
                className="col-span-2"
              />
              <TextField
                id="addr-state"
                label="State"
                value={address.state}
                onChange={(v) => setAddress((a) => ({ ...a, state: v.toUpperCase() }))}
                maxLength={2}
                placeholder="FL"
              />
              <TextField
                id="addr-zip"
                label="ZIP"
                value={address.postalCode}
                onChange={(v) => setAddress((a) => ({ ...a, postalCode: v }))}
                maxLength={5}
                placeholder="33602"
              />
            </div>
            <button
              type="button"
              disabled={!addressReady || status === "loading"}
              onClick={() => void runLookup({ address })}
              className="min-h-[44px] rounded-lg px-5 text-base font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--purple)" }}
            >
              Look up this address
            </button>
          </div>
        )}

        {status === "error" && (
          <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
            That lookup didn&apos;t go through. Check the address and try again — or run the numbers
            yourself in the{" "}
            <a href="/calculators" className="underline" style={{ color: "var(--purple)" }}>
              calculators
            </a>
            .
          </p>
        )}
        {status === "not_found" && (
          <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
            We couldn&apos;t find a public record for that address. Double-check it above, or enter
            the price yourself below once you look it up.
          </p>
        )}
      </div>

      {/* Result */}
      {status === "found" && result !== null && (
        <>
          {result.sampleData.containsSampleData && result.sampleData.notice !== null && (
            <p
              className="rounded-xl border p-3 text-sm"
              style={{
                borderColor: "var(--purple)",
                background: "var(--purple-subtle)",
                color: "var(--text)"
              }}
            >
              {result.sampleData.notice}
            </p>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            {/* Facts */}
            <div
              className="rounded-2xl border p-6"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <h2 className="text-xl font-bold">{result.address.line1}</h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {result.address.city}, {result.address.state} {result.address.postalCode}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {result.facts.bedrooms !== null && <Chip>{result.facts.bedrooms} bd</Chip>}
                {result.facts.bathrooms !== null && <Chip>{result.facts.bathrooms} ba</Chip>}
                {result.facts.livingAreaSqft !== null && (
                  <Chip>{result.facts.livingAreaSqft.toLocaleString("en-US")} sq ft</Chip>
                )}
                {result.facts.yearBuilt !== null && <Chip>Built {result.facts.yearBuilt}</Chip>}
                {result.facts.propertyType !== null && <Chip>{result.facts.propertyType}</Chip>}
              </div>

              {result.value !== null && (
                <div className="mt-6">
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Automated value estimate
                  </p>
                  <p className="text-3xl font-bold" style={{ color: "var(--purple)" }}>
                    {formatUsd(result.value.estimateCents)}
                  </p>
                  {result.value.lowCents !== null && result.value.highCents !== null && (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Range {formatUsd(result.value.lowCents)} – {formatUsd(result.value.highCents)}
                      . An estimate from public records, not an appraisal or a list price.
                    </p>
                  )}
                </div>
              )}

              <dl className="mt-6 space-y-2 text-sm">
                {result.annualTaxAmountCents !== null && (
                  <div className="flex justify-between gap-4">
                    <dt style={{ color: "var(--text-muted)" }}>Annual property tax</dt>
                    <dd className="font-semibold tabular-nums">
                      {formatUsd(result.annualTaxAmountCents)}
                    </dd>
                  </div>
                )}
                {result.assessedValueCents !== null && (
                  <div className="flex justify-between gap-4">
                    <dt style={{ color: "var(--text-muted)" }}>Assessed value</dt>
                    <dd className="font-semibold tabular-nums">
                      {formatUsd(result.assessedValueCents)}
                    </dd>
                  </div>
                )}
                {result.lastSale !== null && (
                  <div className="flex justify-between gap-4">
                    <dt style={{ color: "var(--text-muted)" }}>Last sold</dt>
                    <dd className="font-semibold tabular-nums">
                      {formatUsd(result.lastSale.priceCents)}
                      {result.lastSale.date !== null
                        ? ` · ${result.lastSale.date.slice(0, 4)}`
                        : ""}
                    </dd>
                  </div>
                )}
              </dl>

              {result.flood !== null && (
                <div
                  className="mt-6 rounded-xl border p-4"
                  style={{
                    borderColor: result.flood.inSpecialFloodHazardArea
                      ? "var(--color-warning)"
                      : "var(--border)",
                    background: "var(--surface-2)"
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                      FEMA flood zone {result.flood.zone}
                    </span>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                      style={
                        result.flood.inSpecialFloodHazardArea
                          ? { background: "var(--color-warning)", color: "#fff" }
                          : { background: "var(--surface)", color: "var(--text-muted)" }
                      }
                    >
                      {result.flood.inSpecialFloodHazardArea
                        ? "High-risk — flood insurance likely required"
                        : "Not a high-risk zone"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    {result.flood.note}
                  </p>
                </div>
              )}
            </div>

            {/* Estimate */}
            <div
              className="rounded-2xl border p-6"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <h2 className="text-xl font-bold">Your numbers on this home</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                We started from the value estimate — replace it with the list price you saw, then
                set your down payment and income. Everything updates instantly, on your device.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <NumField
                  id="hl-price"
                  label="Price you're considering"
                  value={priceDollars}
                  onChange={setPriceDollars}
                  prefix="$"
                  step={1000}
                />
                <NumField
                  id="hl-down"
                  label="Down payment"
                  value={downPercent}
                  onChange={setDownPercent}
                  suffix="%"
                  hint={`${usd(estimate.downPaymentDollars)} down`}
                />
                <NumField
                  id="hl-income"
                  label="Annual income"
                  value={annualIncomeDollars}
                  onChange={setAnnualIncomeDollars}
                  prefix="$"
                  step={1000}
                />
                <NumField
                  id="hl-debts"
                  label="Monthly debts"
                  value={monthlyDebtsDollars}
                  onChange={setMonthlyDebtsDollars}
                  prefix="$"
                  hint="Cards, car, student loans"
                />
                <NumField
                  id="hl-rate"
                  label="Interest rate"
                  value={Number((rateBp / 100).toFixed(3))}
                  onChange={(v) => setRateBp(Math.max(0, Math.round(v * 100)))}
                  suffix="%"
                  step={0.125}
                  hint="An assumption, not a quote"
                />
                <NumField
                  id="hl-insurance"
                  label="Annual insurance"
                  value={annualInsuranceDollars}
                  onChange={setAnnualInsuranceDollars}
                  prefix="$"
                  step={100}
                  hint="Florida runs high — estimate, not a quote"
                />
                <NumField
                  id="hl-flood"
                  label="Flood insurance"
                  value={annualFloodInsuranceDollars}
                  onChange={setAnnualFloodInsuranceDollars}
                  prefix="$"
                  step={100}
                  hint={
                    result.flood?.inSpecialFloodHazardArea
                      ? "In a FEMA high-risk zone — usually required"
                      : "Per year, if you carry it"
                  }
                />
                <NumField
                  id="hl-hoa"
                  label="Monthly HOA"
                  value={monthlyHoaDollars}
                  onChange={setMonthlyHoaDollars}
                  prefix="$"
                  step={25}
                  hint="Condos and some communities"
                />
              </div>

              <div
                className="mt-6 rounded-xl p-5 text-white"
                style={{ background: "linear-gradient(135deg, var(--purple-dark), var(--purple))" }}
              >
                <div className="flex items-end justify-between gap-4">
                  <span className="text-sm text-purple-100">Estimated monthly payment</span>
                  <span className="text-3xl font-bold tabular-nums">
                    {formatUsd(estimate.monthlyTotalCents)}
                  </span>
                </div>
                <dl className="mt-4 space-y-1.5 text-sm text-purple-100">
                  <div className="flex justify-between">
                    <dt>Principal &amp; interest</dt>
                    <dd className="tabular-nums">{formatUsd(estimate.piCents)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Taxes</dt>
                    <dd className="tabular-nums">{formatUsd(estimate.taxCents)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Insurance</dt>
                    <dd className="tabular-nums">{formatUsd(estimate.insuranceCents)}</dd>
                  </div>
                  {estimate.floodInsuranceCents > 0 && (
                    <div className="flex justify-between">
                      <dt>Flood insurance</dt>
                      <dd className="tabular-nums">{formatUsd(estimate.floodInsuranceCents)}</dd>
                    </div>
                  )}
                  {estimate.hoaCents > 0 && (
                    <div className="flex justify-between">
                      <dt>HOA</dt>
                      <dd className="tabular-nums">{formatUsd(estimate.hoaCents)}</dd>
                    </div>
                  )}
                  {estimate.miCents > 0 && (
                    <div className="flex justify-between">
                      <dt>Mortgage insurance</dt>
                      <dd className="tabular-nums">{formatUsd(estimate.miCents)}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-4 border-t border-white/25 pt-3 text-sm">
                  <div className="flex justify-between">
                    <span>Estimated cash to close</span>
                    <span className="font-semibold tabular-nums">
                      {formatUsd(estimate.cashToCloseCents)}
                    </span>
                  </div>
                </div>
              </div>

              <p
                className="mt-4 rounded-xl border p-3 text-sm"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-2)",
                  color: "var(--text)"
                }}
              >
                {estimate.fits
                  ? "A payment like this typically fits an income around what you entered, under standard 28/43 guidelines."
                  : `This one runs above a typical range for that income — a larger down payment or a co-borrower changes it. Homes near ${usd(affordablePriceDollars)} tend to fit more comfortably.`}{" "}
                It&apos;s an estimate, not a decision. A licensed loan officer confirms what you
                actually qualify for.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <ButtonLink href="/talk" variant="primary" className="!min-h-[44px]">
                  Get a real pre-approval
                </ButtonLink>
                <ButtonLink
                  href={`/properties?maxPrice=${affordablePriceDollars}`}
                  variant="secondary"
                  className="!min-h-[44px]"
                >
                  See homes in this range
                </ButtonLink>
                <ButtonLink
                  href="/calculators/mortgage-payment"
                  variant="ghost"
                  className="!min-h-[44px]"
                >
                  Open the full calculator
                </ButtonLink>
              </div>
            </div>
          </div>

          {result.provenance.limitations.length > 0 && (
            <div
              className="rounded-xl border p-4 text-xs"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-2)",
                color: "var(--text-muted)"
              }}
            >
              <p className="font-semibold" style={{ color: "var(--text)" }}>
                What these numbers are — and aren&apos;t
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {result.provenance.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
