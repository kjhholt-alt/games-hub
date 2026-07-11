import { MtgConfidenceChip } from "@/components/MtgConfidenceChip";
import { MtgSourceLinks } from "@/components/MtgSourceLinks";
import { formatDate, isFadedConfidence, type BanlistRow } from "@/lib/mtg";

const ACTION_STYLE: Record<BanlistRow["action"], string> = {
  banned: "text-red bg-red-dim border-red/30",
  suspended: "text-amber bg-amber-dim border-amber/30",
  unbanned: "text-green bg-green-dim border-green/30",
};

/** Per-format banned/suspended tracker, most recent change first per format group. */
export function MtgBanlistTable({ rows }: { rows: BanlistRow[] }) {
  const sorted = [...rows].sort((a, b) =>
    b.effective_date.localeCompare(a.effective_date)
  );

  return (
    <div className="overflow-x-auto border border-border rounded-2xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-text-secondary text-left">
            <th className="px-4 py-3 font-medium">Format</th>
            <th className="px-4 py-3 font-medium">Card</th>
            <th className="px-4 py-3 font-medium">Action</th>
            <th className="px-4 py-3 font-medium">Effective</th>
            <th className="px-4 py-3 font-medium hidden md:table-cell">
              Reason
            </th>
            <th className="px-4 py-3 font-medium hidden lg:table-cell">
              Confidence &amp; sources
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={`${row.format}-${row.card_name}-${row.effective_date}`}
              className={`border-b border-border last:border-0 align-top hover:bg-surface/60 transition-colors ${
                isFadedConfidence(row.confidence) ? "opacity-60" : ""
              }`}
            >
              <td className="px-4 py-3 text-text-secondary">{row.format}</td>
              <td className="px-4 py-3 font-medium">{row.card_name}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase ${ACTION_STYLE[row.action]}`}
                >
                  {row.action}
                </span>
              </td>
              <td className="px-4 py-3 text-text-secondary tabular-nums">
                {formatDate(row.effective_date)}
              </td>
              <td className="px-4 py-3 text-text-secondary hidden md:table-cell max-w-md">
                {row.reason ?? "—"}
              </td>
              <td className="px-4 py-3 hidden lg:table-cell">
                <div className="flex flex-col gap-1.5 items-start">
                  <MtgConfidenceChip
                    confidence={row.confidence}
                    sampleSize={row.sample_size}
                  />
                  <MtgSourceLinks sources={row.sources} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
