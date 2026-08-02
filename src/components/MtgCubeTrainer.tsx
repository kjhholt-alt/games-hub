"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Flame, RotateCcw, Trophy, X } from "lucide-react";
import { MtgTierPlate } from "@/components/MtgTierPlate";
import { priorSourceBasisColor, type CubeCardRow } from "@/lib/mtgDraftView";
import {
  bestPick,
  dealPack,
  eligibleTrainerRows,
  type TrainerCard,
} from "@/lib/mtgCubeTrainer";

/**
 * The interactive half of /mtg/cube/trainer: deals a weighted-by-rarity
 * practice pack from the committed cube payload, lets the reader pick one
 * card blind, then reveals our real tier + basis for every card in the
 * pack. No backend, no storage — the streak/accuracy counters below live
 * only in this component's state and reset on refresh.
 */
export function MtgCubeTrainer({ rows }: { rows: CubeCardRow[] }) {
  const eligible = useMemo(() => eligibleTrainerRows(rows), [rows]);
  const excludedCount = rows.length - eligible.length;

  const [pack, setPack] = useState<TrainerCard[] | null>(null);
  const [pickedCard, setPickedCard] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [correct, setCorrect] = useState(0);

  // Packs are randomized, so dealing happens in a client-only effect —
  // doing it during the initial render would make the server-rendered HTML
  // disagree with the client's first paint (a hydration mismatch).
  useEffect(() => {
    setPack(dealPack(eligible));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setBestStreak((b) => Math.max(b, streak));
  }, [streak]);

  const revealed = pickedCard !== null;
  const best = pack ? bestPick(pack) : null;
  const pickedIsWinner = revealed && pickedCard === best?.row.card;

  function handlePick(card: TrainerCard) {
    if (revealed || !best) return;
    setPickedCard(card.row.card);
    setRounds((r) => r + 1);
    if (card.row.card === best.row.card) {
      setCorrect((c) => c + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
  }

  function nextPack() {
    setPack(dealPack(eligible));
    setPickedCard(null);
  }

  if (!pack) {
    return (
      <div className="border border-border rounded-lg px-5 py-16 text-center text-text-secondary text-sm">
        Shuffling a pack&hellip;
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-5 font-mono text-[11px]">
        <Stat icon={<Flame size={12} />} label="Streak" value={streak} color="text-amber" />
        <Stat icon={<Trophy size={12} />} label="Best" value={bestStreak} color="text-brass" />
        <span className="inline-flex items-center gap-1.5 border border-border rounded-md px-2.5 py-1">
          <span className="text-text-secondary tabular-nums">
            {correct}/{rounds}
          </span>
          <span className="text-text-secondary uppercase tracking-wide">correct</span>
        </span>
      </div>

      {excludedCount > 0 && (
        <p className="text-xs text-text-secondary mb-4">
          {excludedCount} pool card{excludedCount === 1 ? "" : "s"} excluded from packs — no
          Scryfall image on file yet.
        </p>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
        {pack.map((card) => {
          const isPicked = pickedCard === card.row.card;
          const isBest = revealed && card.row.card === best?.row.card;
          return (
            <button
              key={card.row.card}
              type="button"
              disabled={revealed}
              aria-pressed={isPicked}
              onClick={() => handlePick(card)}
              className={`group relative rounded-lg border overflow-hidden text-left transition-colors ${
                isBest
                  ? "border-green"
                  : isPicked
                    ? "border-brass"
                    : "border-border hover:border-brass/50"
              } ${revealed ? "cursor-default" : "cursor-pointer"}`}
            >
              <div className="aspect-[63/88] bg-surface relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.row.image_normal}
                  alt={card.row.card}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                {revealed && (
                  <div className="absolute top-1 left-1">
                    <MtgTierPlate letter={card.row.grade} size="sm" />
                  </div>
                )}
                {isPicked && (
                  <div className="absolute top-1 right-1 rounded bg-surface/90 border border-brass px-1 py-0.5 text-[9px] font-mono uppercase tracking-wide text-brass">
                    Your pick
                  </div>
                )}
                {isBest && (
                  <div className="absolute bottom-1 right-1 rounded bg-surface/90 border border-green px-1 py-0.5 text-[9px] font-mono uppercase tracking-wide text-green">
                    Best pick
                  </div>
                )}
              </div>
              {revealed && (
                <div className="px-1.5 py-1">
                  <p className="text-[10px] leading-tight truncate" title={card.row.card}>
                    {card.row.card}
                  </p>
                  <p
                    className={`text-[9px] leading-tight truncate ${priorSourceBasisColor(card.row.prior_source)}`}
                    title={card.row.basis}
                  >
                    {card.row.basis}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {revealed && best && (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-md border px-4 py-3.5 mb-6 ${
            pickedIsWinner ? "border-green/40 bg-green-dim" : "border-amber/40 bg-amber-dim"
          }`}
        >
          {pickedIsWinner ? (
            <Check size={15} className="text-green mt-0.5 shrink-0" />
          ) : (
            <X size={15} className="text-amber mt-0.5 shrink-0" />
          )}
          <p className="text-text-secondary text-sm leading-relaxed">
            {pickedIsWinner ? (
              <>
                <span className="font-semibold text-green">Correct.</span> {best.row.card} was the
                strongest pick in this pack — Tier {best.row.grade}, {best.row.basis}.
              </>
            ) : (
              <>
                <span className="font-semibold text-amber">Not quite.</span> You picked{" "}
                {pickedCard}; the strongest pick was {best.row.card} — Tier {best.row.grade},{" "}
                {best.row.basis}.
              </>
            )}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={nextPack}
        disabled={!revealed}
        className="inline-flex items-center gap-2 rounded-md border border-brass/40 bg-brass-dim px-4 py-2 text-sm font-medium text-brass hover:border-brass/70 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <RotateCcw size={14} />
        {revealed ? "Deal next pack" : "Make a pick to continue"}
      </button>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-border rounded-md px-2.5 py-1">
      <span className={color}>{icon}</span>
      <span className={`${color} tabular-nums font-semibold`}>{value}</span>
      <span className="text-text-secondary uppercase tracking-wide">{label}</span>
    </span>
  );
}
