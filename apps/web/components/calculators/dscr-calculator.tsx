"use client";

import { useMemo, useState } from "react";
import {
  DSCR_REFERENCE_BANDS,
  debtServiceCoverage,
  disclosureFor,
  dollarsToCents,
  dscrReferenceBand,
  formatCoverageRatio,
  formatUsd
} from "@tract/mortgage-math";
import { Disclosure } from "@/components/ui";
import { NumberInput, ResultRow } from "./field";

/**
 * Debt service coverage ratio.
 *
 * The reference bands are rendered as a table of how the ratio is commonly
 * described, with the reader's own result marked inside it. They are labelled as
 * general market reference in the table itself, not only in the disclosure,
 * because a band next to a number reads as a threshold unless it says otherwise.
 */
export function DscrCalculator() {
  const [monthlyRent, setMonthlyRent] = useState(3_200);
  const [loanAmount, setLoanAmount] = useState(300_000);
  const [ratePercent, setRatePercent] = useState(7.25);
  const [termMonths, setTermMonths] = useState(360);
  const [annualTax, setAnnualTax] = useState(4_800);
  const [annualInsurance, setAnnualInsurance] = useState(3_600);
  const [monthlyHoa, setMonthlyHoa] = useState(0);
  const [monthlyMortgageInsurance, setMonthlyMortgageInsurance] = useState(0);

  const result = useMemo(
    () =>
      debtServiceCoverage({
        grossMonthlyRentCents: dollarsToCents(Math.max(0, monthlyRent)),
        loanAmountCents: dollarsToCents(Math.max(0, loanAmount)),
        annualRateBasisPoints: Math.min(2_000, Math.max(0, Math.round(ratePercent * 100))),
        termMonths,
        annualPropertyTaxCents: dollarsToCents(Math.max(0, annualTax)),
        annualInsuranceCents: dollarsToCents(Math.max(0, annualInsurance)),
        monthlyHoaCents: dollarsToCents(Math.max(0, monthlyHoa)),
        monthlyMortgageInsuranceCents: dollarsToCents(Math.max(0, monthlyMortgageInsurance))
      }),
    [
      monthlyRent,
      loanAmount,
      ratePercent,
      termMonths,
      annualTax,
      annualInsurance,
      monthlyHoa,
      monthlyMortgageInsurance
    ]
  );

  const disclosure = disclosureFor("dscr");
  const band = dscrReferenceBand(result.ratioBasisPoints);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-card)]">
        <h3 className="text-lg font-semibold">Rent and the payment it has to cover</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          This runs entirely in your browser. Nothing you type is sent anywhere, stored, or used to
          contact you.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <NumberInput
            id="dscr-rent"
            label="Gross monthly rent"
            value={monthlyRent}
            onChange={setMonthlyRent}
            step={50}
            prefix="$"
            hint="Rent in place, or market rent supported by an appraiser's rent schedule."
          />
          <NumberInput
            id="dscr-loan"
            label="Loan amount"
            value={loanAmount}
            onChange={setLoanAmount}
            step={5_000}
            prefix="$"
          />
          <NumberInput
            id="dscr-rate"
            label="Interest rate"
            value={ratePercent}
            onChange={setRatePercent}
            step={0.125}
            prefix="%"
            hint="An assumption you choose. No rate is being quoted or offered."
          />
          <div>
            <label htmlFor="dscr-term" className="text-sm font-semibold text-[var(--text)]">
              Loan term
            </label>
            <select
              id="dscr-term"
              value={termMonths}
              onChange={(event) => setTermMonths(Number(event.target.value))}
              className="mt-1.5 min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm"
            >
              <option value={360}>30 years</option>
              <option value={240}>20 years</option>
              <option value={180}>15 years</option>
            </select>
          </div>
          <NumberInput
            id="dscr-tax"
            label="Annual property tax"
            value={annualTax}
            onChange={setAnnualTax}
            step={100}
            prefix="$"
          />
          <NumberInput
            id="dscr-insurance"
            label="Annual insurance"
            value={annualInsurance}
            onChange={setAnnualInsurance}
            step={100}
            prefix="$"
          />
          <NumberInput
            id="dscr-hoa"
            label="Monthly HOA dues"
            value={monthlyHoa}
            onChange={setMonthlyHoa}
            step={25}
            prefix="$"
            hint="The association line of PITIA."
          />
          <NumberInput
            id="dscr-mi"
            label="Monthly mortgage insurance"
            value={monthlyMortgageInsurance}
            onChange={setMonthlyMortgageInsurance}
            step={25}
            prefix="$"
            hint="Enter 0 if none applies."
          />
        </div>
      </div>

      <div>
        <div
          className="rounded-2xl border border-[var(--border)] bg-purple-950 p-6 text-white"
          aria-live="polite"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-purple-300">
            Debt service coverage ratio
          </p>
          <p className="mt-2 text-5xl font-bold tabular-nums text-white">
            {formatCoverageRatio(result.ratioBasisPoints)}
          </p>
          <p className="mt-2 text-sm text-purple-200">
            {formatUsd(result.grossMonthlyRentCents)} of rent against {formatUsd(result.pitiaCents)}{" "}
            of PITIA
          </p>

          <dl className="mt-6 space-y-2.5 text-sm">
            <ResultRow
              label="Principal and interest"
              value={formatUsd(result.principalAndInterestCents)}
            />
            <ResultRow label="Property tax" value={formatUsd(result.propertyTaxCents)} />
            <ResultRow label="Insurance" value={formatUsd(result.insuranceCents)} />
            <ResultRow label="Association dues" value={formatUsd(result.hoaCents)} />
            <ResultRow
              label="Mortgage insurance"
              value={formatUsd(result.mortgageInsuranceCents)}
            />
            <ResultRow label="Total PITIA" value={formatUsd(result.pitiaCents)} emphasis />
          </dl>

          <div className="mt-6 rounded-lg bg-purple-900 p-4">
            <p className="text-sm font-semibold text-purple-100">
              Rent {result.monthlyCoverageCents >= 0 ? "covers" : "does not cover"} the payment.
              Monthly difference: {formatUsd(result.monthlyCoverageCents)}
            </p>
            <p className="mt-1.5 text-sm text-purple-200">
              Rent of {formatUsd(result.breakEvenRentCents)} would put this ratio at exactly 1.00x.
              This ratio is arithmetic on the figures you entered. It is not an underwriting
              decision and it does not approve anything.
            </p>
          </div>

          <p className="mt-4 text-xs text-purple-300">
            Calculation version {result.calculationVersion}
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-base font-semibold text-[var(--text)]">
            How the ratio is commonly described
          </h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            These bands are general market reference only. They are not TRACT underwriting, not any
            lender&rsquo;s guidelines, and not thresholds anyone is bound by. Every lender sets its
            own requirements, and they change.
          </p>
          <ul className="mt-4 space-y-2.5">
            {DSCR_REFERENCE_BANDS.map((referenceBand) => {
              const current = band !== null && band.label === referenceBand.label;
              return (
                <li
                  key={referenceBand.label}
                  className="rounded-lg border p-3 text-sm"
                  style={{
                    borderColor: current ? "var(--purple)" : "var(--border)",
                    background: current ? "var(--purple-subtle)" : "var(--surface)"
                  }}
                >
                  <p className="font-semibold text-[var(--text)]">
                    {referenceBand.label}
                    {current && (
                      <span className="ml-2 font-normal text-[var(--purple)]">
                        your inputs land here
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-[var(--text-muted)]">{referenceBand.note}</p>
                </li>
              );
            })}
          </ul>
        </div>

        <Disclosure
          headline={disclosure.headline}
          body={disclosure.body}
          excludes={disclosure.excludes}
          version={disclosure.version}
        />
      </div>
    </div>
  );
}
