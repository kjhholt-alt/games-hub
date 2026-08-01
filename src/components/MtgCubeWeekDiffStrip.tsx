import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { MtgTierPlate } from "@/components/MtgTierPlate";
import type { CubeWeekDiffPayload } from "@/lib/mtgDraftView";

/**
 * The Planar Cube's "what changed this week" strip — a pure diff of THIS
 * repo's own published git history for public/mtg-draft.json (see
 * scripts/build-cube-week-diff.mjs; never an external source, never a
 * guessed delta). The caller (src/app/mtg/cube/page.tsx) only mounts this
 * when isCubeWeekDiffCurrent() holds, so `diff` here is always fresh for the
 * live cube's week — no staleness check needed inside. Static server markup
 * only (native <details> for disclosure) so there's zero client JS and zero
 * layout shift on load; opening the disclosure is the only height change,
 * and that's a deliberate user action, not a shift.
 */
export function MtgCubeWeekDiffStrip({ diff }: { diff: CubeWeekDiffPayload }) {
  const { counts, added, removed, tier_moves, previous_week_label, current_week_label, basis } = diff;
  const hasDetail = added.length > 0 || removed.length > 0 || tier_moves.length > 0;

  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3.5 mb-6">
      <div className="flex flex-wrap items-center gap-2 mb-2.5">
        <span className="font-mono text-[11px] uppercase tracking-widest text-brass">
          What changed this week
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-text-secondary border border-border rounded px-1.5 py-0.5">
          {previous_week_label}
          <ArrowRight size={10} aria-hidden />
          {current_week_label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] mb-2.5">
        <Stat
          icon={<TrendingUp size={12} className="text-brass shrink-0" />}
          value={`+${counts.added}`}
          label="added"
        />
        <Stat
          icon={<TrendingDown size={12} className="text-text-secondary shrink-0" />}
          value={`-${counts.removed}`}
          label="removed"
        />
        <Stat
          icon={<ArrowRight size={12} className="text-purple shrink-0" />}
          value={String(counts.tier_moves)}
          label="tier moves"
        />
      </div>

      <p className="text-[11px] text-text-secondary leading-relaxed">{basis}</p>

      {hasDetail && (
        <details className="mt-2.5">
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-wide text-brass hover:text-brass-bright transition-colors select-none">
            Show full diff
          </summary>
          <div className="grid sm:grid-cols-3 gap-3 mt-3">
            {tier_moves.length > 0 && (
              <DiffGroup title={`Tier moves (${tier_moves.length})`}>
                {tier_moves.map((m) => (
                  <li
                    key={m.name}
                    className="flex items-center justify-between gap-2 py-1 border-b border-border last:border-0"
                  >
                    <span className="truncate">{m.name}</span>
                    <span className="flex items-center gap-1 shrink-0">
                      <MtgTierPlate letter={m.from_tier} size="sm" />
                      <span className="text-text-secondary" aria-hidden>
                        &rarr;
                      </span>
                      <MtgTierPlate letter={m.to_tier} size="sm" />
                    </span>
                  </li>
                ))}
              </DiffGroup>
            )}
            {added.length > 0 && (
              <DiffGroup title={`Added (${added.length})`}>
                {added.map((r) => (
                  <li
                    key={r.card}
                    className="flex items-center justify-between gap-2 py-1 border-b border-border last:border-0"
                  >
                    <span className="truncate">{r.card}</span>
                    <MtgTierPlate letter={r.grade} size="sm" />
                  </li>
                ))}
              </DiffGroup>
            )}
            {removed.length > 0 && (
              <DiffGroup title={`Removed (${removed.length})`}>
                {removed.map((r) => (
                  <li
                    key={r.card}
                    className="flex items-center justify-between gap-2 py-1 border-b border-border last:border-0 opacity-70"
                  >
                    <span className="truncate">{r.card}</span>
                    <MtgTierPlate letter={r.grade} size="sm" />
                  </li>
                ))}
              </DiffGroup>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-border rounded-md px-2.5 py-1">
      {icon}
      <span className="tabular-nums font-semibold">{value}</span>
      <span className="text-text-secondary uppercase tracking-wide">{label}</span>
    </span>
  );
}

function DiffGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-md p-2.5 max-h-56 overflow-y-auto">
      <p className="font-mono text-[10px] uppercase tracking-widest text-text-secondary mb-1.5 sticky top-0 bg-surface">
        {title}
      </p>
      <ul className="text-[11px]">{children}</ul>
    </div>
  );
}
