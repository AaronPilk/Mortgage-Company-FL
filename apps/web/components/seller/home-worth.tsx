"use client";

import { useState } from "react";
import { formatUsd } from "@tract/mortgage-math";
import { Button } from "@/components/ui";
import { LeadForm } from "@/components/lead-form";
import type { HomeLookupResult, PropertyLookupResponse } from "@/lib/home-lookup-types";

/**
 * Seller funnel — "what's my home worth".
 *
 * A homeowner enters their address, sees an estimated value (the EXISTING AVM,
 * via /api/v1/sell/estimate), and is invited to talk to a real estate
 * professional about selling — which creates a seller lead (intent "sell_home")
 * through the existing lead pipeline.
 *
 * Two honest states around the number: when `avmAvailable` is false (ATTOM dark)
 * the funnel shows NO figure and never fabricates one (invariant 6); the lead
 * capture is unaffected, because the value is a nicety and the introduction is
 * the point. The form collects contact + address + intent only — no financial
 * figure is ever asked of the homeowner (invariant 2). TRACT brokers mortgages,
 * not homes: every line here is connection framing.
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

function formatAddress(address: ManualAddress): string {
  return `${address.line1}, ${address.city}, ${address.state} ${address.postalCode}`;
}

export function SellerWorthExperience({
  avmAvailable,
  turnstileSiteKey,
  disclosureText,
  smsConsentText,
  emailConsentText
}: {
  avmAvailable: boolean;
  turnstileSiteKey?: string | undefined;
  disclosureText: string;
  smsConsentText: string;
  emailConsentText: string;
}) {
  const [address, setAddress] = useState<ManualAddress>(EMPTY_ADDRESS);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<HomeLookupResult | null>(null);
  // The address captured when the person asked to talk to an agent. It seeds the
  // lead message (uncontrolled), so we key the form on it to re-seed on change.
  const [leadContext, setLeadContext] = useState<string | null>(null);

  const addressReady =
    address.line1.trim() !== "" &&
    address.city.trim() !== "" &&
    address.state.trim().length === 2 &&
    /^\d{5}$/.test(address.postalCode.trim());

  async function runEstimate(): Promise<void> {
    setStatus("loading");
    try {
      const response = await fetch("/api/v1/sell/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address })
      });
      const json = (await response.json()) as { ok?: boolean; data?: PropertyLookupResponse };
      if (!response.ok || json.ok !== true || json.data === undefined) {
        setStatus("error");
        return;
      }
      const data = json.data;
      if (data.status === "not_found") {
        setStatus("not_found");
        setResult(null);
        return;
      }
      // `needs_address` never occurs on this route (address-only body); treat any
      // non-found status conservatively.
      if (data.status !== "found") {
        setStatus("error");
        return;
      }
      setResult(data.result);
      setStatus("found");
    } catch {
      setStatus("error");
    }
  }

  function talkToAgent(): void {
    setLeadContext(formatAddress(address));
  }

  return (
    <div className="space-y-8">
      {/* Address */}
      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <h2 className="text-xl font-bold">Where is the home?</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {avmAvailable
            ? "Enter the address and we'll pull an estimated value from public records."
            : "Enter the address and we'll connect you with a real estate professional who can value it in person."}
        </p>

        <div className="mt-4 space-y-3">
          <TextField
            id="sell-line1"
            label="Street address"
            value={address.line1}
            onChange={(v) => setAddress((a) => ({ ...a, line1: v }))}
            placeholder="123 Example St"
            maxLength={200}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <TextField
              id="sell-city"
              label="City"
              value={address.city}
              onChange={(v) => setAddress((a) => ({ ...a, city: v }))}
              maxLength={120}
              className="col-span-2"
            />
            <TextField
              id="sell-state"
              label="State"
              value={address.state}
              onChange={(v) => setAddress((a) => ({ ...a, state: v.toUpperCase() }))}
              maxLength={2}
              placeholder="FL"
            />
            <TextField
              id="sell-zip"
              label="ZIP"
              value={address.postalCode}
              onChange={(v) => setAddress((a) => ({ ...a, postalCode: v }))}
              maxLength={5}
              placeholder="33602"
            />
          </div>

          {avmAvailable && (
            <Button
              type="button"
              variant="primary"
              disabled={!addressReady || status === "loading"}
              onClick={() => void runEstimate()}
            >
              {status === "loading" ? "Estimating…" : "See my estimate"}
            </Button>
          )}
        </div>

        {status === "error" && (
          <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
            That estimate didn&apos;t go through. Check the address and try again — or just talk to
            an agent below, no estimate required.
          </p>
        )}
        {status === "not_found" && (
          <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
            We couldn&apos;t find a public record for that address. A real estate professional can
            still value your home in person — reach out below.
          </p>
        )}
      </div>

      {/* Value */}
      {status === "found" && result !== null && (
        <div
          className="rounded-2xl border p-6"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          {result.sampleData.containsSampleData && result.sampleData.notice !== null && (
            <p
              className="mb-4 rounded-xl border p-3 text-sm"
              style={{
                borderColor: "var(--purple)",
                background: "var(--purple-subtle)",
                color: "var(--text)"
              }}
            >
              {result.sampleData.notice}
            </p>
          )}

          <h2 className="text-xl font-bold">{result.address.line1}</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {result.address.city}, {result.address.state} {result.address.postalCode}
          </p>

          {result.value !== null ? (
            <div className="mt-6">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Estimated value
              </p>
              <p className="text-4xl font-bold" style={{ color: "var(--purple)" }}>
                {formatUsd(result.value.estimateCents)}
              </p>
              {result.value.lowCents !== null && result.value.highCents !== null && (
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  Range {formatUsd(result.value.lowCents)} – {formatUsd(result.value.highCents)}. An
                  automated estimate from public records — not an appraisal, a list price, or an
                  offer. A real estate professional prices it against the market.
                </p>
              )}
            </div>
          ) : (
            <p className="mt-6 text-sm" style={{ color: "var(--text-muted)" }}>
              We found your home&apos;s record, but there isn&apos;t an automated value we can stand
              behind for it. A real estate professional can value it against the local market —
              that&apos;s a more reliable number anyway.
            </p>
          )}
        </div>
      )}

      {/* Talk to an agent */}
      {leadContext === null ? (
        <div
          className="rounded-2xl border p-6"
          style={{ borderColor: "var(--purple)", background: "var(--purple-subtle)" }}
        >
          <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>
            Thinking about selling?
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            TRACT is a mortgage brokerage — we don&apos;t list homes. Tell us where to reach you and
            we&apos;ll introduce you to a real estate professional in our network who handles sales.
            No listing agreement, no obligation.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="button" variant="primary" disabled={!addressReady} onClick={talkToAgent}>
              Talk to an agent about selling
            </Button>
            {!addressReady && (
              <p className="self-center text-xs" style={{ color: "var(--text-muted)" }}>
                Enter your address above first.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <LeadForm
            key={leadContext}
            intent="sell_home"
            formId="seller-home-worth"
            heading="Talk to an agent about selling"
            submitLabel="Connect me with an agent"
            disclosureText={disclosureText}
            smsConsentText={smsConsentText}
            emailConsentText={emailConsentText}
            turnstileSiteKey={turnstileSiteKey}
            initialMessage={`Selling: ${leadContext}`}
          />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Buying your next place too? Talk to{" "}
            <a href="/talk" className="underline" style={{ color: "var(--purple)" }}>
              a licensed mortgage professional
            </a>{" "}
            about financing.
          </p>
        </div>
      )}
    </div>
  );
}
