import { MtgDraftGradeBadge } from "@/components/MtgDraftGradeBadge";
import { MtgCardHover } from "@/components/MtgCardHover";
import { cheatSheetGroups, formatWinRate, type DraftCardRow } from "@/lib/mtgDraftView";

/** Lane accents in the hub's desaturated mana tones (same family as the
 * .mtg-spectrum signature rule) — the lane IS the color, no neon. */
const GROUP_BORDER: Record<string, string> = {
  W: "border-t-[#b0a884]",
  U: "border-t-[#46759e]",
  B: "border-t-[#6d5f80]",
  R: "border-t-[#a8543f]",
  G: "border-t-[#4d7f5c]",
  "": "border-t-brass/60",
};

const GROUP_TEXT: Record<string, string> = {
  W: "text-[#c5bd97]",
  U: "text-[#7da3c4]",
  B: "text-[#9d8fb3]",
  R: "text-[#c47862]",
  G: "text-[#79a888]",
  "": "text-brass",
};

const GROUP_NAME: Record<string, string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
  "": "Multi / Colorless",
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
        <h3 className="mtg-display text-xl mb-3">{title}</h3>
        <p className="text-sm text-text-secondary">No cards in this bucket yet.</p>
      </div>
    );
  }
  return (
    <div>
      <h3 className="mtg-display text-xl mb-3">{title}</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 print:grid-cols-3">
        {groups.map((g) => (
          <div
            key={g.label}
            className={`bg-surface border border-border border-t-2 rounded-lg p-3 print:break-inside-avoid ${
              GROUP_BORDER[g.color] ?? "border-t-border"
            }`}
          >
            <p
              className={`font-mono text-[11px] uppercase tracking-widest font-semibold mb-2 ${
                GROUP_TEXT[g.color] ?? "text-text-secondary"
              }`}
            >
              {GROUP_NAME[g.color] ?? g.label}
            </p>
            <ol className="space-y-1.5">
              {g.rows.map((row, i) => (
                <li key={row.card} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="text-text-secondary font-mono tabular-nums text-xs w-3 shrink-0">
                      {i + 1}
                    </span>
                    <MtgCardHover cardName={row.card} imageUrl={row.image_normal} className="truncate">
                      {row.card}
                    </MtgCardHover>
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
