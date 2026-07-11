import { RefreshCw } from "lucide-react";
import type { ModuleStatus } from "@/lib/mtg";
import { formatFreshness } from "@/lib/mtg";

const STATUS_STYLE: Record<ModuleStatus, string> = {
  published: "text-green bg-green-dim border-green/30",
  sample: "text-purple bg-purple-dim border-purple/30",
  stale: "text-amber bg-amber-dim border-amber/30",
  pending_key: "text-text-secondary bg-surface border-border",
};

const STATUS_LABEL: Record<ModuleStatus, string> = {
  published: "live",
  sample: "sample",
  stale: "stale",
  pending_key: "pending key",
};

/**
 * Every module card's header: icon + title, its own freshness chip (module-
 * level, independent of the other modules), a one-line methodology summary,
 * and its attribution list. This is the per-module half of the honesty rail.
 */
export function MtgModuleHeader({
  icon,
  title,
  status,
  computedAt,
  methodology,
  attribution,
  extra,
}: {
  icon: React.ReactNode;
  title: string;
  status: ModuleStatus;
  computedAt: string;
  methodology: string;
  attribution: string[];
  extra?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase ${STATUS_STYLE[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
          <RefreshCw size={11} />
          updated {formatFreshness(computedAt)}
        </span>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed max-w-3xl">
        {methodology}
      </p>
      {extra}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-secondary mt-2">
        {attribution.map((a) => (
          <span key={a}>{a}</span>
        ))}
      </div>
    </div>
  );
}
