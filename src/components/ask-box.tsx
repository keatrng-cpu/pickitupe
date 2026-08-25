import { useRef, useState } from "react";
import { ArrowRight, Loader2, Phone } from "lucide-react";
import { askQuestion } from "@/lib/chat-actions";

type Turn = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Do you take old appliances?",
  "How much for a standard lot?",
  "Do you do gutters?",
  "What if it snows before you come?",
];

/**
 * "Have more questions?" — the answer box under the FAQ.
 *
 * Deliberately NOT a floating chat bubble. CLAUDE.md's design bar rules out
 * bolt-on chat widgets, and a launcher that follows you down the page is the
 * exact "generic AI startup" tell the whole site is built to avoid. This is a
 * section: it sits where questions actually occur, after the FAQ has already
 * answered the common ones.
 *
 * The model never computes a price — every number it can say is rendered from
 * pricebook.ts into its prompt server-side (see chat-actions.ts). The phone
 * number stays visible the whole time because for anything the box can't
 * answer, texting a photo is genuinely the faster path.
 */
export function AskBox() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const liveRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;

    const nextTurns: Turn[] = [...turns, { role: "user", content: q }];
    setTurns(nextTurns);
    setQuestion("");
    setBusy(true);

    try {
      const res = await askQuestion({
        data: {
          question: q,
          // Trim to the last few turns: the whole point is short factual
          // answers, and a long transcript is just tokens and drift.
          history: turns.slice(-6),
        },
      });
      setTurns([
        ...nextTurns,
        {
          role: "assistant",
          content: res.ok ? res.answer : res.error,
        },
      ]);
    } catch {
      setTurns([
        ...nextTurns,
        {
          role: "assistant",
          content:
            "Couldn't reach the answer service. Call or text 218-779-2553.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card-green rounded-2xl p-6 lg:p-8">
      <h3 className="font-display text-2xl leading-[1.15]">
        Have more questions?
      </h3>
      <p className="mt-2 text-sm leading-[1.6] text-fg/90">
        Ask anything about the work, the prices, or the area we cover. If it
        needs a real look at your yard, you'll get pointed straight at the
        phone.
      </p>

      {turns.length > 0 ? (
        <div
          ref={liveRef}
          aria-live="polite"
          className="mt-6 space-y-4 border-t border-border pt-6"
        >
          {turns.map((t, i) => (
            <div key={i}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gold">
                {t.role === "user" ? "You" : "Pick It Up E"}
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-[1.6] text-fg/90">
                {t.content}
              </p>
            </div>
          ))}
          {busy ? (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="size-4 animate-spin" />
              Checking…
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="btn-press inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm text-muted transition hover:border-gold/50 hover:text-fg"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(question);
        }}
        className="mt-6"
      >
        <label htmlFor="ask" className="sr-only">
          Ask a question about leaf cleanup or junk removal
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="ask"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={500}
            placeholder="Type your question…"
            disabled={busy}
            className="w-full rounded-xl border border-border bg-bg-deep/50 px-4 py-3 text-base text-fg outline-none placeholder:text-muted/70 focus:border-gold disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={busy || !question.trim()}
            className="btn-press inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-fg px-6 text-base font-medium tracking-wide text-ink hover:bg-gold disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Ask
            <ArrowRight className="size-4" />
          </button>
        </div>
      </form>

      <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <Phone className="size-3.5" aria-hidden />
        Answers come from this site's own price list. For anything about your
        specific yard, text a photo to
        <a
          className="text-fg underline decoration-gold/50 underline-offset-4"
          href="sms:2187792553"
        >
          218-779-2553
        </a>
        and the owner will reply the same day.
      </p>
    </div>
  );
}
