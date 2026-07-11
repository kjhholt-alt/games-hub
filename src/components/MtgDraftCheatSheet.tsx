import { MtgDraftGradeBadge } from "@/components/MtgDraftGradeBadge";
import { cheatSheetGroups, formatWinRate, type DraftCardRow } from "@/lib/mtgDraftView";

const GROUP_STYLE: Record<string, string> = {
  W: "border-amber/30",
  U: "border-cyan/30",
  B: "border-border",
  R: "border-red/30",
  G: "border-green/30",
  "": "border-purple/30",
};

const GROUP_TEXT: Record<string, string> = {
  W: "text-amber",
  U: "text-cyan",
  B: "text-foreground",
  R: "text-red",
  G: "text-green",
  "": "text-purple",
};

/**
 * Compact, print-friendly cheat sheet: top commons and top uncommons grouped
 * into the 5 mono-color lanes plus a Multi/Colorless lane — the second-
 * screen reference drafters actually want, not another sortable table.
 * `print:break-inside-avoid` keeps a color lane from splitting across a
 * printed page.
 */
export function MtgDraftCheatSheet({ rows }: { rows: DraftCardRow[] }) {
  const commons = cheatSheetGroups(rows, "common", 8);
  const uncommons = cheatSheetGroups(rows, "uncommon", 6);

  return (
    <div className="space-y-8">
      <CheatSheetSection title="Top commons by color" groups={commons} />
      <CheatSheetSection title="Top uncommons by color" groups={uncommons} />
    </div>
  );
}

function CheatSheetSection({
  title,
  groups,
}: {
  title: string;
  groups: ReturnType<typeof cheatSheetGroups>;
}) {
  if (groups.length === 0) {
    return (
      <div>
        <h3 className="text-base font-semibold mb-3">{title}</h3>
        <p className="text-sm text-text-secondary">No cards in this bucket yet.</p>
      </div>
    );
  }
  return (
    <div>
      <h3 className="text-base font-semibold mb-3">{title}</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 print:grid-cols-3">
        {groups.map((g) => (
          <div
            key={g.label}
            className={`bg-surface border rounded-xl p-3 print:break-inside-avoid ${
              GROUP_STYLE[g.color] ?? "border-border"
            }`}
          >
            <p
              className={`text-xs font-mono uppercase font-semibold mb-2 ${
                GROUP_TEXT[g.color] ?? "text-text-secondary"
              }`}
            >
              {g.label === "" ? "Multi / Colorless" : g.label}
            </p>
            <ol className="space-y-1.5">
              {g.rows.map((row, i) => (
                <li key={row.card} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="text-text-secondary tabular-nums text-xs w-3 shrink-0">
                      {i + 1}
                    </span>
                    <span className="truncate">{row.card}</span>
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] text-text-secondary tabular-nums">
                      {formatWinRate(row.gih_wr)}
                    </span>
                    <MtgDraftGradeBadge grade={row.grade} size="sm" />
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
