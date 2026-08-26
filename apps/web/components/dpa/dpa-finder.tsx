"use client";

import { useState } from "react";
import { ButtonLink } from "@/components/ui";
import { type DpaAnswers, type DpaProgram, matchPrograms } from "@/lib/dpa-programs";

/**
 * Down-payment-assistance finder.
 *
 * Three stable yes/no questions narrow the statewide programs to the ones worth
 * asking a licensed officer about. It is explicitly not an eligibility decision
 * or a credit decision: it never says "you qualify", shows no dollar approval,
 * and always routes to a conversation. Income and purchase-price limits are left
 * to the officer against the current county tables, so the finder cannot imply a
 * determination it has not made.
 */

type Tri = boolean | null;

const QUESTIONS: {
  key: keyof DpaAnswers;
  question: string;
  yes: string;
  no: string;
}[] = [
  {
    key: "ownedRecently",
    question: "Have you owned a home as your primary residence in the last three years?",
    yes: "Yes, I have",
    no: "No, I haven't"
  },
  {
    key: "floridaFullTime",
    question: "Do you work at least 35 hours a week for a Florida-based employer?",
    yes: "Yes",
    no: "No"
  },
  {
    key: "military",
    question: "Are you a veteran or active-duty military?",
    yes: "Yes",
    no: "No"
  }
];

function Choice({
  selected,
  label,
  onClick
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="min-h-[44px] rounded-lg border px-4 text-sm font-semibold transition-colors"
      style={{
        borderColor: selected ? "var(--purple)" : "var(--border)",
        background: selected ? "var(--purple)" : "var(--bg)",
        color: selected ? "#fff" : "var(--text)"
      }}
    >
      {label}
    </button>
  );
}

function ProgramResult({ program }: { program: DpaProgram }) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-4">
      <h4 className="text-lg font-bold text-[var(--text)]">{program.name}</h4>
      <p className="mt-1 text-sm font-medium" style={{ color: "var(--purple)" }}>
        {program.assistance}
      </p>
      <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
        {program.structure}
      </p>
      <a
        href={program.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-xs underline"
        style={{ color: "var(--text-muted)" }}
      >
        {program.sourceLabel} ↗
      </a>
    </div>
  );
}

export function DpaFinder() {
  const [answers, setAnswers] = useState<{ [K in keyof DpaAnswers]: Tri }>({
    ownedRecently: null,
    floridaFullTime: null,
    military: null
  });

  const complete =
    answers.ownedRecently !== null && answers.floridaFullTime !== null && answers.military !== null;

  const result = complete ? matchPrograms(answers as DpaAnswers) : { matched: [], other: [] };

  function set(key: keyof DpaAnswers, value: boolean): void {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div
      className="rounded-2xl border p-6"
      style={{ borderColor: "var(--purple)", background: "var(--purple-subtle)" }}
    >
      <h3 className="text-xl font-bold text-[var(--text)]">Which programs should I ask about?</h3>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
        Answer three quick questions. This points you to the programs worth a conversation — it is
        not an eligibility check or an approval.
      </p>

      <div className="mt-5 space-y-4">
        {QUESTIONS.map((item) => (
          <div key={item.key}>
            <p className="text-sm font-semibold text-[var(--text)]">{item.question}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Choice
                selected={answers[item.key] === true}
                label={item.yes}
                onClick={() => set(item.key, true)}
              />
              <Choice
                selected={answers[item.key] === false}
                label={item.no}
                onClick={() => set(item.key, false)}
              />
            </div>
          </div>
        ))}
      </div>

      {complete && (
        <div className="mt-6 border-t border-[var(--border)] pt-5">
          {result.matched.length > 0 ? (
            <>
              <p className="text-sm font-semibold text-[var(--text)]">
                Based on your answers, these are worth asking a licensed loan officer about:
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {result.matched.map((program) => (
                  <ProgramResult key={program.id} program={program} />
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--text)]">
              The statewide first-time-buyer programs may not be the fit here — but that&apos;s not
              the whole picture. Many Florida counties and cities run their own assistance programs
              with different rules, and there are other loan options. A licensed officer can walk
              through what fits.
            </p>
          )}

          <div
            className="mt-5 rounded-xl border p-4"
            style={{ borderColor: "var(--border)", background: "var(--bg)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              This isn&apos;t an eligibility decision or an approval — income and purchase-price
              limits vary by county and change yearly, and a licensed loan officer confirms what you
              actually qualify for.
            </p>
            <div className="mt-3">
              <ButtonLink href="/talk" variant="primary">
                Talk through my options
              </ButtonLink>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
