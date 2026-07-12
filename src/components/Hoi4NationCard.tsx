import {
  Flag,
  Crosshair,
  FlaskConical,
  AlertTriangle,
  Milestone,
  Route,
} from "lucide-react";
import { PATH_META, type Hoi4Nation } from "@/lib/hoi4";
import { Hoi4TierBadge } from "@/components/Hoi4TierBadge";

// Faction accent → text color class. Mirrors the color tokens in globals.css.
const PATH_TEXT: Record<string, string> = {
  red: "text-red",
  cyan: "text-cyan",
  amber: "text-amber",
  purple: "text-purple",
};

/**
 * One major nation: tier + identity at the top, then the build spine (opener →
 * signature focus → key research), the run-ender pitfall, and the milestone
 * timeline. All data is curated in data/hoi4-nations.ts (ported from
 * hoi4-playbook) — nothing here is invented at render time.
 */
export function Hoi4NationCard({ nation }: { nation: Hoi4Nation }) {
  const path = PATH_META[nation.path];
  const pathColor = PATH_TEXT[path.color] ?? "text-text-secondary";

  return (
    <div className="bg-surface border border-border rounded-lg p-5 sm:p-6 flex flex-col">
      {/* Header: tier badge + name + faction */}
      <div className="flex items-start gap-4 mb-4">
        <Hoi4TierBadge letter={nation.tier} size="lg" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold leading-tight">{nation.name}</h3>
            <span className="text-[11px] font-mono text-text-secondary">
              {nation.tag}
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold ${pathColor}`}
          >
            <Flag size={11} />
            {path.label.toUpperCase()}
          </span>
        </div>
      </div>

      <p className="text-sm text-text-secondary leading-relaxed mb-5">
        {nation.identity}
      </p>

      {/* Build spine */}
      <div className="space-y-3 mb-5">
        <SpineRow
          icon={<Route size={14} className="text-text-secondary" />}
          label="Focus path"
          title={nation.focusPathName}
        />
        <SpineRow
          icon={<Crosshair size={14} className="text-text-secondary" />}
          label="Signature focus"
          title={nation.signatureFocus.title}
          detail={nation.signatureFocus.why}
        />
        <SpineRow
          icon={<FlaskConical size={14} className="text-text-secondary" />}
          label="Key research"
          title={nation.keyResearch.title}
          detail={nation.keyResearch.why}
        />
      </div>

      {/* Run-ender pitfall */}
      <div className="flex items-start gap-2.5 bg-amber-dim border border-amber/30 rounded-lg p-3.5 mb-5">
        <AlertTriangle size={15} className="text-amber mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-amber mb-0.5">
            Pitfall: {nation.pitfall.title}
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">
            {nation.pitfall.why}
          </p>
        </div>
      </div>

      {/* Milestones — pushed to the bottom so cards line up in the grid */}
      <div className="mt-auto">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-text-secondary mb-2">
          <Milestone size={12} />
          MILESTONES
        </div>
        <ol className="space-y-1.5">
          {nation.milestones.map((m, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-surface-raised border border-border text-[10px] text-text-secondary tabular-nums shrink-0">
                {i + 1}
              </span>
              <span className="flex-1 leading-snug">{m.label}</span>
              {m.by && (
                <span className="text-[11px] font-mono text-cyan tabular-nums shrink-0">
                  {m.by}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function SpineRow({
  icon,
  label,
  title,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  detail?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] font-mono text-text-secondary mb-0.5">
        {icon}
        {label.toUpperCase()}
      </div>
      <p className="text-sm font-semibold leading-snug">{title}</p>
      {detail && (
        <p className="text-xs text-text-secondary leading-relaxed mt-0.5">
          {detail}
        </p>
      )}
    </div>
  );
}
