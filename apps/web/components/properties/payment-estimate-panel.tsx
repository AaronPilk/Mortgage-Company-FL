import type { ListingSummary } from "@tract/integrations";
import { disclosureFor, formatRate, formatUsd } from "@tract/mortgage-math";
import { ButtonLink, Card, Disclosure } from "@/components/ui";
import { PAYMENT_ASSUMPTIONS, estimateListingPayment } from "./payment-estimate";

/**
 * Estimated monthly payment for a listing.
 *
 * The assumptions are printed above the number, not below it, because a payment
 * figure without them is a claim and with them is an illustration. The approved
 * calculator disclosure copy is reused verbatim so this surface cannot drift
 * away from the wording the calculators carry.
 */
export function PaymentEstimatePanel({ listing }: { listing: ListingSummary }) {
  const estimate = estimateListingPayment(listing);
  const disclosure = disclosureFor("payment");

  if (estimate === null) {
    return (
      <Card>
        <h2 className="text-xl font-semibold">Estimated monthly payment</h2>
        <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
          This record has no list price, so there is nothing to base an estimate on. The payment
          calculator will take a price you supply.
        </p>
        <div className="mt-5">
          <ButtonLink href="/calculators/mortgage-payment" variant="secondary">
            Estimate my payment
          </ButtonLink>
        </div>
      </Card>
    );
  }

  const { breakdown } = estimate;

  const rows: { label: string; value: number; note?: string }[] = [
    { label: "Principal and interest", value: breakdown.principalAndInterestCents },
    {
      label: "Property tax",
      value: breakdown.propertyTaxCents,
      note: estimate.usedListingTaxes ? "from this sample record" : "not supplied"
    },
    {
      label: "Homeowners insurance",
      value: breakdown.homeownersInsuranceCents,
      note: "assumed, not quoted"
    },
    ...(estimate.usedListingHoa
      ? [
          {
            label: "Association dues",
            value: breakdown.hoaCents,
            note: "from this sample record"
          }
        ]
      : [])
  ];

  return (
    <Card>
      <h2 className="text-xl font-semibold">Estimated monthly payment</h2>

      <dl
        className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        <div className="flex gap-1.5">
          <dt>Assumed down payment</dt>
          <dd className="font-semibold" style={{ color: "var(--text)" }}>
            {formatRate(PAYMENT_ASSUMPTIONS.downPaymentBasisPoints)} (
            {formatUsd(estimate.downPaymentCents)})
          </dd>
        </div>
        <div className="flex gap-1.5">
          <dt>Assumed rate</dt>
          <dd className="font-semibold" style={{ color: "var(--text)" }}>
            {formatRate(PAYMENT_ASSUMPTIONS.annualRateBasisPoints)}
          </dd>
        </div>
        <div className="flex gap-1.5">
          <dt>Term</dt>
          <dd className="font-semibold" style={{ color: "var(--text)" }}>
            {PAYMENT_ASSUMPTIONS.termMonths / 12} years, fixed
          </dd>
        </div>
        <div className="flex gap-1.5">
          <dt>Loan amount</dt>
          <dd className="font-semibold" style={{ color: "var(--text)" }}>
            {formatUsd(estimate.loanAmountCents)}
          </dd>
        </div>
      </dl>

      <p className="mt-6 text-4xl font-bold" style={{ color: "var(--text)" }}>
        {formatUsd(breakdown.totalMonthlyCents)}
        <span className="ml-2 text-base font-medium" style={{ color: "var(--text-muted)" }}>
          per month
        </span>
      </p>

      <dl className="mt-5 space-y-2 text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 border-b pb-2 last:border-b-0"
            style={{ borderColor: "var(--border)" }}
          >
            <dt style={{ color: "var(--text-muted)" }}>
              {row.label}
              {row.note !== undefined && (
                <span className="ml-1.5 text-xs italic">({row.note})</span>
              )}
            </dt>
            <dd className="font-semibold tabular-nums" style={{ color: "var(--text)" }}>
              {formatUsd(row.value)}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
        The assumed rate is a placeholder chosen to demonstrate the arithmetic. It is not a quote,
        not a rate anyone has been offered, and not tied to any index. The property figures come
        from a sample record that describes no real property. Calculation{" "}
        {breakdown.calculationVersion}.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href="/calculators/mortgage-payment" variant="secondary">
          Estimate my payment
        </ButtonLink>
      </div>

      <Disclosure
        headline={disclosure.headline}
        body={disclosure.body}
        excludes={disclosure.excludes}
        version={disclosure.version}
      />
    </Card>
  );
}
