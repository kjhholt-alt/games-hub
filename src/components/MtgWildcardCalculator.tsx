"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ExternalLink, Loader2, Wand2 } from "lucide-react";
import { MtgWildcardOwnedInputs } from "@/components/MtgWildcardOwnedInputs";
import { MtgWildcardResultsTable } from "@/components/MtgWildcardResultsTable";
import {
  computeDeficit,
  computeNeeded,
  countBasicLands,
  loadOwnedWildcards,
  mergeByName,
  parseArenaDecklist,
  resolveWildcards,
  saveOwnedWildcards,
  EMPTY_WILDCARD_COUNTS,
  type ResolvedCard,
  type UnmatchedCard,
  type WildcardCounts,
} from "@/lib/mtgWildcards";

type Status = "idle" | "loading" | "done" | "error";

const PLACEHOLDER = `Deck
4 Monastery Swiftspear (MH3) 121
4 Lightning Bolt (STA) 42
17 Mountain

Sideboard
2 Abrade (MH2) 106`;

/**
 * The interactive half of /mtg/wildcards: decklist textarea, the 4 owned-
 * wildcard inputs, and the resolve/results flow. All parsing happens
 * client-side; the only network calls are polite, batched, cached Scryfall
 * lookups (see lib/mtgWildcards.ts) triggered by the Calculate button —
 * never on every keystroke.
 */
export function MtgWildcardCalculator() {
  const [text, setText] = useState("");
  const [owned, setOwned] = useState<WildcardCounts>(EMPTY_WILDCARD_COUNTS);
  const [status, setStatus] = useState<Status>("idle");
  const [resolved, setResolved] = useState<ResolvedCard[]>([]);
  const [unmatched, setUnmatched] = useState<UnmatchedCard[]>([]);
  const [basicLandCount, setBasicLandCount] = useState(0);
  const [error, setError] = useState("");

  // Owned wildcards persist across visits — read once on mount (client
  // only; localStorage has no server-render equivalent, so this can't be
  // initial state directly without a hydration mismatch).
  useEffect(() => {
    setOwned(loadOwnedWildcards());
  }, []);

  function updateOwned(next: WildcardCounts) {
    setOwned(next);
    saveOwnedWildcards(next);
  }

  async function handleCalculate() {
    const lines = parseArenaDecklist(text);
    const entries = mergeByName(lines);
    setBasicLandCount(countBasicLands(lines));

    if (entries.length === 0) {
      setStatus("error");
      setError("No card lines were recognized — paste a decklist export first.");
      setResolved([]);
      setUnmatched([]);
      return;
    }

    setStatus("loading");
    setError("");
    try {
      const result = await resolveWildcards(entries);
      setResolved(result.resolved);
      setUnmatched(result.unmatched);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Scryfall lookup failed.");
    }
  }

  const needed = useMemo(() => computeNeeded(resolved), [resolved]);
  const deficit = useMemo(() => computeDeficit(needed, owned), [needed, owned]);

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={10}
        spellCheck={false}
        className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-brass/50 mb-4"
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          type="button"
          onClick={handleCalculate}
          disabled={status === "loading"}
          className="inline-flex items-center gap-2 rounded-md border border-brass/50 bg-brass-dim text-brass px-4 py-2 text-sm font-medium hover:border-brass/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "loading" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Wand2 size={15} />
          )}
          {status === "loading" ? "Looking up rarities..." : "Calculate wildcards"}
        </button>
        <a
          href="https://scryfall.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-secondary hover:text-brass transition-colors"
        >
          Card data via Scryfall
          <ExternalLink size={11} />
        </a>
      </div>

      {status === "error" && error && (
        <div className="flex items-start gap-3 rounded-md border border-amber/40 bg-amber-dim px-4 py-3 mb-8">
          <AlertTriangle size={15} className="text-amber mt-0.5 shrink-0" />
          <p className="text-text-secondary text-xs leading-relaxed">{error}</p>
        </div>
      )}

      <div className="mb-8">
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-text-secondary mb-3">
          Owned wildcards
        </h2>
        <MtgWildcardOwnedInputs owned={owned} onChange={updateOwned} />
      </div>

      {status === "done" && (
        <div>
          {basicLandCount > 0 && (
            <p className="font-mono text-[11px] text-text-secondary mb-4">
              {basicLandCount.toLocaleString("en-US")} basic land
              {basicLandCount === 1 ? "" : "s"} excluded — basic lands cost no
              wildcards.
            </p>
          )}

          <MtgWildcardResultsTable
            needed={needed}
            owned={owned}
            deficit={deficit}
            resolved={resolved}
          />

          {unmatched.length > 0 && (
            <div className="flex items-start gap-3 rounded-md border border-border bg-surface px-4 py-3 mt-6">
              <AlertTriangle size={15} className="text-amber mt-0.5 shrink-0" />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-amber mb-1">
                  Unmatched ({unmatched.length})
                </p>
                <p className="text-text-secondary text-xs leading-relaxed mb-2">
                  Scryfall couldn&rsquo;t identify these lines — never guessed,
                  so they&rsquo;re excluded from the totals above. Double-check
                  spelling/set codes and recalculate.
                </p>
                <ul className="font-mono text-[11px] text-text-secondary space-y-0.5">
                  {unmatched.map((u) => (
                    <li key={`${u.name}-${u.set ?? ""}`}>
                      {u.count}x {u.name}
                      {u.set ? ` (${u.set.toUpperCase()})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <p className="text-xs text-text-secondary leading-relaxed mt-6 max-w-2xl">
            Rarity rule: a line with an exact (SET) code (and Arena&rsquo;s
            collector number, when present) uses that printing&rsquo;s real
            rarity. A card pasted without one uses the lowest rarity across
            every printing Scryfall has on record — so we never overcount
            wildcards guessing at the wrong reprint. When the same card name
            appears more than once with different printings, the first exact
            printing found wins.
          </p>
        </div>
      )}
    </div>
  );
}
