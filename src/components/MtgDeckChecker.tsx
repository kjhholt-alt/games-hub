"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ClipboardCheck, Loader2 } from "lucide-react";
import { MtgDeckCheckTable } from "@/components/MtgDeckCheckTable";
import { MtgSampleBanner } from "@/components/MtgSampleBanner";
import {
  buildDeckCheckRows,
  countBasicLands,
  mergeByName,
  parseArenaDecklist,
  sortDeckCheckRows,
  summarizeDeckCheck,
  type DeckCheckRow,
} from "@/lib/mtgDeckCheck";
import { isSampleDraftPayload, type MtgDraftPayload } from "@/lib/mtgDraftView";

type PayloadStatus = "loading" | "ready" | "error";

const PLACEHOLDER = `Deck
4 Monastery Swiftspear (MH3) 121
4 Lightning Bolt (STA) 42
17 Mountain

Sideboard
2 Abrade (MH2) 106`;

/**
 * The interactive half of /mtg/check. Fetches the ALREADY-PUBLISHED
 * /mtg-draft.json static file client-side (the exact same file /mtg/cube,
 * /mtg/draft, and /mtg/hob render from — no new payload, no server route)
 * once on mount, then every "Check deck" click is pure in-browser
 * computation over the pasted decklist: zero additional network calls,
 * zero Scryfall lookups (unlike the Wildcard Calculator, which needs live
 * rarity data this page never does — every field it renders already ships
 * on the cube/draft/HOB rows).
 */
export function MtgDeckChecker() {
  const [text, setText] = useState("");
  const [payload, setPayload] = useState<MtgDraftPayload | null>(null);
  const [payloadStatus, setPayloadStatus] = useState<PayloadStatus>("loading");
  const [rows, setRows] = useState<DeckCheckRow[] | null>(null);
  const [basicLandCount, setBasicLandCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/mtg-draft.json")
      .then((res) => {
        if (!res.ok) throw new Error(`fetch failed (${res.status})`);
        return res.json();
      })
      .then((data: MtgDraftPayload) => {
        if (cancelled) return;
        setPayload(data);
        setPayloadStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setPayloadStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleCheck() {
    const lines = parseArenaDecklist(text);
    const entries = mergeByName(lines);
    setBasicLandCount(countBasicLands(lines));

    if (entries.length === 0) {
      setError("No card lines were recognized — paste a decklist export first.");
      setRows(null);
      return;
    }

    setError("");
    setRows(sortDeckCheckRows(buildDeckCheckRows(entries, payload)));
  }

  const summary = rows ? summarizeDeckCheck(rows) : null;
  const sample = payload ? isSampleDraftPayload(payload) : false;

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
          onClick={handleCheck}
          disabled={payloadStatus === "loading"}
          className="inline-flex items-center gap-2 rounded-md border border-brass/50 bg-brass-dim text-brass px-4 py-2 text-sm font-medium hover:border-brass/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {payloadStatus === "loading" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <ClipboardCheck size={15} />
          )}
          {payloadStatus === "loading" ? "Loading cube + tier data..." : "Check deck"}
        </button>
        <span className="font-mono text-[11px] text-text-secondary">
          Matched against the live Cube pool, then published format tier data — no lookups leave your browser.
        </span>
      </div>

      {payloadStatus === "error" && (
        <div className="flex items-start gap-3 rounded-md border border-amber/40 bg-amber-dim px-4 py-3 mb-8">
          <AlertTriangle size={15} className="text-amber mt-0.5 shrink-0" />
          <p className="text-text-secondary text-xs leading-relaxed">
            Cube/tier data is unavailable right now — check back shortly. Nothing below is invented while it&rsquo;s down.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-md border border-amber/40 bg-amber-dim px-4 py-3 mb-8">
          <AlertTriangle size={15} className="text-amber mt-0.5 shrink-0" />
          <p className="text-text-secondary text-xs leading-relaxed">{error}</p>
        </div>
      )}

      {sample && rows && <MtgSampleBanner />}

      {rows && summary && (
        <div>
          {basicLandCount > 0 && (
            <p className="font-mono text-[11px] text-text-secondary mb-4">
              {basicLandCount.toLocaleString("en-US")} basic land
              {basicLandCount === 1 ? "" : "s"} excluded — basic lands are
              never tiered.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-4 font-mono text-[11px]">
            <Stat label="Unique cards" value={summary.total} color="text-foreground" />
            <Stat label="From Cube" value={summary.fromCube} color="text-green" />
            <Stat label="From format tiers" value={summary.fromDraftSet + summary.fromHob} color="text-brass" />
            <Stat label="Honestly uncovered" value={summary.uncovered} color="text-text-secondary" />
          </div>

          <MtgDeckCheckTable rows={rows} />

          <p className="text-xs text-text-secondary leading-relaxed mt-6 max-w-2xl">
            Match rule: exact card-name match, first against this week&rsquo;s
            Planar Cube pool, then against every published Draft Ranker set
            and The Hobbit&rsquo;s Day-0 pack — the same tier/basis every
            other /mtg page renders, never a fresh score computed for this
            page. A card that isn&rsquo;t in any of those pools renders
            honestly uncovered rather than an invented rating.
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-border rounded-md px-2.5 py-1">
      <span className={`${color} tabular-nums font-semibold`}>{value}</span>
      <span className="text-text-secondary uppercase tracking-wide">{label}</span>
    </span>
  );
}
