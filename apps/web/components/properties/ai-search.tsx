"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AccountSignIn } from "@/components/account/account-sign-in";
import { EMPTY_CRITERIA, propertiesHref, type PropertySearchCriteria } from "./criteria";

/**
 * The hero search: describe what you want, typed or spoken, and the answer is
 * a plain /properties URL.
 *
 * The server does all interpretation; this component only posts the text and
 * navigates with the criteria that come back, so the existing server-rendered
 * search, pagination, and fixture gating are what actually run. The chip under
 * the field restates what was understood — labelled "AI" only when a model
 * produced it and "basic matching" when the deterministic parser did, because
 * claiming AI for a regex is a lie about provenance.
 *
 * Voice input is progressive enhancement over the Web Speech API. Where the
 * browser has no recognizer the microphone simply is not rendered; nothing
 * else changes. Speech is transcribed locally by the browser into the same
 * text box — this component never records or uploads audio.
 */

type InterpretApiResponse =
  | {
      ok: true;
      data: {
        criteria: Partial<PropertySearchCriteria>;
        source: "ai" | "rules";
        echo: string;
      };
    }
  | { ok: false; error: { message?: string } };

/** Minimal surface of the (still-prefixed) Web Speech API. */
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

function speechRecognitionConstructor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  const ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return typeof ctor === "function" ? (ctor as new () => SpeechRecognitionLike) : null;
}

export function AiSearch({
  signedIn = false,
  accountsConfigured = false,
  supabaseUrl,
  anonKey
}: {
  /**
   * Whether the server saw a session when it rendered this page. The AI
   * understanding is an account perk: signed out, the same search bar works —
   * typed or spoken — but the server answers with the deterministic parser and
   * a quiet affordance here explains how to unlock the AI path.
   */
  signedIn?: boolean;
  accountsConfigured?: boolean;
  supabaseUrl?: string | undefined;
  anonKey?: string | undefined;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [chip, setChip] = useState<{ echo: string; source: "ai" | "rules" } | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const recognizerRef = useRef<SpeechRecognitionLike | null>(null);

  // Feature detection has to run on the client; rendering the microphone only
  // after mount is what keeps the server and client markup in agreement.
  useEffect(() => {
    setMicSupported(speechRecognitionConstructor() !== null);
    return () => recognizerRef.current?.abort();
  }, []);

  const stopListening = useCallback(() => {
    recognizerRef.current?.stop();
    recognizerRef.current = null;
    setListening(false);
    setInterim("");
  }, []);

  const startListening = useCallback(() => {
    const Recognition = speechRecognitionConstructor();
    if (Recognition === null) return;
    const recognizer = new Recognition();
    recognizer.continuous = false;
    recognizer.interimResults = true;
    recognizer.lang = "en-US";
    recognizer.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result === undefined) continue;
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      if (finalText !== "") {
        setText((current) => `${current} ${finalText}`.trim().slice(0, 300));
      }
      setInterim(interimText);
    };
    recognizer.onend = () => {
      recognizerRef.current = null;
      setListening(false);
      setInterim("");
    };
    recognizer.onerror = () => {
      recognizerRef.current = null;
      setListening(false);
      setInterim("");
    };
    recognizerRef.current = recognizer;
    setError(null);
    setListening(true);
    recognizer.start();
  }, []);

  const submit = useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault();
      const query = text.trim();
      if (query === "" || busy) return;
      if (listening) stopListening();

      setBusy(true);
      setError(null);
      try {
        const response = await fetch("/api/v1/properties/interpret", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query })
        });
        const payload = (await response.json()) as InterpretApiResponse;
        if (!response.ok || !payload.ok) {
          setError("We could not read that just now. The filters below still work.");
          return;
        }
        const criteria: PropertySearchCriteria = {
          ...EMPTY_CRITERIA,
          ...payload.data.criteria,
          page: 1
        };
        setChip({ echo: payload.data.echo, source: payload.data.source });
        router.push(propertiesHref(criteria));
      } catch {
        setError("We could not read that just now. The filters below still work.");
      } finally {
        setBusy(false);
      }
    },
    [busy, listening, router, stopListening, text]
  );

  return (
    <div className="mx-auto mt-10 w-full max-w-2xl">
      <form role="search" aria-label="Describe the property you are looking for" onSubmit={submit}>
        <label htmlFor="ai-property-query" className="sr-only">
          Describe the property you are looking for
        </label>

        <div
          className="flex items-center gap-1 rounded-full border py-1.5 pl-5 pr-1.5 shadow-[0_8px_30px_rgb(0_0_0/0.06)] backdrop-blur transition-shadow duration-200 focus-within:border-[var(--purple)] focus-within:shadow-[0_8px_30px_var(--purple-glow)]"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="h-5 w-5 shrink-0"
            stroke="var(--text-muted)"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <circle cx="9" cy="9" r="6" />
            <path d="m13.5 13.5 3.5 3.5" />
          </svg>

          <input
            id="ai-property-query"
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={300}
            autoComplete="off"
            enterKeyHint="search"
            placeholder="Try: 3 bedrooms in St. Pete under $500K"
            className="min-h-[52px] w-full min-w-0 flex-1 bg-transparent px-2 text-base outline-none sm:text-lg"
            style={{ color: "var(--text)" }}
          />

          {micSupported && (
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              aria-pressed={listening}
              aria-label={listening ? "Stop voice input" : "Search by voice"}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors duration-200 hover:bg-[var(--purple-subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--purple)]"
              style={listening ? { background: "var(--purple-subtle)" } : undefined}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className="h-5 w-5"
                stroke={listening ? "var(--purple)" : "var(--text-muted)"}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="7.25" y="2.5" width="5.5" height="9.5" rx="2.75" />
                <path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5" />
              </svg>
            </button>
          )}

          <button
            type="submit"
            disabled={busy || text.trim() === ""}
            aria-label="Search properties"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white shadow-[0_4px_14px_var(--purple-glow)] transition-all duration-200 hover:shadow-[0_6px_20px_var(--purple-glow)] disabled:opacity-40 disabled:shadow-none"
            style={{ background: "var(--purple)" }}
          >
            {busy ? (
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className="h-5 w-5 animate-spin motion-reduce:animate-none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M10 2.5a7.5 7.5 0 1 0 7.5 7.5" />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className="h-5 w-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3.5 10h13M11.5 5 16.5 10 11.5 15" />
              </svg>
            )}
          </button>
        </div>

        <div aria-live="polite" className="min-h-[1.75rem]">
          {listening && (
            <p role="status" className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Listening{interim !== "" ? `: “${interim}”` : "…"}
            </p>
          )}

          {error !== null && (
            <p
              role="alert"
              className="mt-2 text-sm font-medium"
              style={{ color: "var(--color-warning)" }}
            >
              {error}
            </p>
          )}

          {chip !== null && !listening && error === null && (
            <p
              role="status"
              className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border px-4 py-1.5 text-sm"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
                color: "var(--text)"
              }}
            >
              <span className="truncate">
                Showing: <span className="font-semibold">{chip.echo}</span>
              </span>
              <span className="shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>
                {/* Provenance is honest: "AI" only when a model interpreted the text. */}
                {chip.source === "ai" ? "· via AI" : "· basic matching"}
              </span>
              <button
                type="button"
                onClick={() => setChip(null)}
                aria-label="Dismiss search summary"
                className="grid h-5 w-5 shrink-0 place-items-center rounded-full transition-colors hover:bg-[var(--purple-subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--purple)]"
                style={{ color: "var(--text-muted)" }}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="h-3 w-3"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                >
                  <path d="m5 5 10 10M15 5 5 15" />
                </svg>
              </button>
            </p>
          )}
        </div>
      </form>

      {/* The unlock affordance lives outside the search form because the
          sign-in prompt is its own form. It never blocks the search: typed and
          spoken queries work signed out, answered by the deterministic parser
          and labelled accordingly — a rules answer is never presented as AI. */}
      {accountsConfigured && !signedIn && (
        <div className="mt-2 text-left">
          <button
            type="button"
            onClick={() => setSignInOpen((open) => !open)}
            aria-expanded={signInOpen}
            className="text-xs underline underline-offset-2 transition-colors hover:text-[var(--purple)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--purple)]"
            style={{ color: "var(--text-muted)" }}
          >
            AI understanding: sign in to unlock
          </button>
          {signInOpen && (
            <div
              className="mt-3 rounded-xl border p-4 text-left"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <p className="mb-3 text-sm font-semibold" style={{ color: "var(--text)" }}>
                With an account, your words are interpreted by AI instead of basic matching.
              </p>
              <AccountSignIn
                configured={accountsConfigured}
                supabaseUrl={supabaseUrl}
                anonKey={anonKey}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
