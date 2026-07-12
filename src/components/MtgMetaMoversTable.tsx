import { TrendingDown, TrendingUp } from "lucide-react";
import { MtgHonestPanel } from "@/components/MtgHonestPanel";
import { MtgTierPlate } from "@/components/MtgTierPlate";
import {
  formatFreshness,
  formatLabel,
  type BanlistChangeRow,
  type CommanderMoverRow,
  type DraftGradeChangeRow,
  type MetaMoverRow,
  type ModuleStatus,
  type NewSetMoverRow,
} from "@/lib/mtg";

function formatSignedCount(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

/**
 * The hub's "what changed" headline — a pure day-over-day diff of THIS
 * hub's own two most recently published runs (see lib/mtg.ts's MetaMoverRow
 * doc; never an external source, never a guessed delta). Renders only the
 * kinds this run's payload actually shipped. Rises/falls read brass-up /
 * steel-down — no red/green candy, per the hub's flat design law. A
 * genuinely quiet run (status "published", zero rows) reads as one honest
 * line rather than an empty table; a first-ever publish (status
 * "pending_history" — no previous payload exists to diff against) gets the
 * full honest panel instead.
 */
export function MtgMetaMoversTable({
  status,
  computedAt,
  rows,
}: {
  status: ModuleStatus;
  computedAt: string;
  rows: MetaMoverRow[];
}) {
  if (status === "pending_history") {
    return (
      <MtgHonestPanel title="No publish history yet">
        Meta movers diffs this hub&rsquo;s own two most recently published
        runs — there&rsquo;s no previous payload in games-hub to compare
        against yet (the first publish since this module shipped, or a dry
        run that never reads history). Real day-over-day movement appears
        automatically the moment a second published run exists.
      </MtgHonestPanel>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        No movement since the previous publish — last compared{" "}
        {formatFreshness(computedAt)}.
      </p>
    );
  }

  const risers = rows.filter(
    (r): r is CommanderMoverRow => r.kind === "commander_riser"
  );
  const fallers = rows.filter(
    (r): r is CommanderMoverRow => r.kind === "commander_faller"
  );
  const gradeChanges = rows.filter(
    (r): r is DraftGradeChangeRow => r.kind === "draft_grade_change"
  );
  const banAdds = rows.filter(
    (r): r is BanlistChangeRow => r.kind === "banlist_add"
  );
  const banRemoves = rows.filter(
    (r): r is BanlistChangeRow => r.kind === "banlist_remove"
  );
  const newSets = rows.filter(
    (r): r is NewSetMoverRow => r.kind === "new_set"
  );

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {(risers.length > 0 || fallers.length > 0) && (
        <Group title="Commander movers">
          {risers.map((r, i) => (
            <CommanderMoverItem key={`riser-${i}`} row={r} direction="up" />
          ))}
          {fallers.map((r, i) => (
            <CommanderMoverItem key={`faller-${i}`} row={r} direction="down" />
          ))}
        </Group>
      )}

      {gradeChanges.length > 0 && (
        <Group title="Draft grade changes">
          {gradeChanges.map((r, i) => (
            <DraftGradeChangeItem key={i} row={r} />
          ))}
        </Group>
      )}

      {(banAdds.length > 0 || banRemoves.length > 0) && (
        <Group title="Ban list changes">
          {banAdds.map((r, i) => (
            <BanlistChangeItem key={`add-${i}`} row={r} action="add" />
          ))}
          {banRemoves.map((r, i) => (
            <BanlistChangeItem key={`remove-${i}`} row={r} action="remove" />
          ))}
        </Group>
      )}

      {newSets.length > 0 && (
        <Group title="New sets">
          {newSets.map((r, i) => (
            <NewSetItem key={i} row={r} />
          ))}
        </Group>
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-text-secondary mb-2">
        {title}
      </p>
      <ul>{children}</ul>
    </div>
  );
}

function CommanderMoverItem({
  row,
  direction,
}: {
  row: CommanderMoverRow;
  direction: "up" | "down";
}) {
  const isUp = direction === "up";
  return (
    <li className="flex items-center justify-between gap-3 py-1.5 border-b border-border last:border-0 text-sm">
      <span className="flex items-center gap-2 min-w-0">
        {isUp ? (
          <TrendingUp size={13} className="text-brass shrink-0" />
        ) : (
          <TrendingDown size={13} className="text-text-secondary shrink-0" />
        )}
        <span className="truncate">{row.commander}</span>
        <span className="font-mono text-[10px] text-text-secondary shrink-0 whitespace-nowrap">
          {formatLabel(row.format)}
        </span>
      </span>
      <span className="flex items-center gap-1.5 shrink-0">
        <MtgTierPlate letter={row.previous_tier} size="sm" />
        <span className="text-text-secondary" aria-hidden>
          &rarr;
        </span>
        <MtgTierPlate letter={row.current_tier} size="sm" />
        <span
          className={`font-mono text-xs tabular-nums whitespace-nowrap ${isUp ? "text-brass" : "text-text-secondary"}`}
        >
          {row.previous_deck_count}&rarr;{row.current_deck_count} (
          {formatSignedCount(row.delta_deck_count)})
        </span>
      </span>
    </li>
  );
}

function DraftGradeChangeItem({ row }: { row: DraftGradeChangeRow }) {
  return (
    <li className="flex items-center justify-between gap-3 py-1.5 border-b border-border last:border-0 text-sm">
      <span className="flex items-center gap-2 min-w-0">
        <span className="truncate">{row.card}</span>
        <span className="font-mono text-[10px] text-text-secondary shrink-0">
          {row.set_code}
        </span>
      </span>
      <span className="flex items-center gap-1.5 shrink-0">
        <MtgTierPlate letter={row.previous_grade} size="sm" />
        <span className="text-text-secondary" aria-hidden>
          &rarr;
        </span>
        <MtgTierPlate letter={row.current_grade} size="sm" />
      </span>
    </li>
  );
}

function BanlistChangeItem({
  row,
  action,
}: {
  row: BanlistChangeRow;
  action: "add" | "remove";
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-1.5 border-b border-border last:border-0 text-sm">
      <span className="truncate">{row.card}</span>
      <span className="flex items-center gap-2 shrink-0 font-mono text-[10px] uppercase tracking-wide whitespace-nowrap">
        <span className="text-text-secondary">{formatLabel(row.format)}</span>
        <span className={action === "add" ? "text-brass" : "text-text-secondary"}>
          {action === "add" ? "banned" : "unbanned"}
        </span>
      </span>
    </li>
  );
}

function NewSetItem({ row }: { row: NewSetMoverRow }) {
  return (
    <li className="flex items-center gap-2 py-1.5 border-b border-border last:border-0 text-sm">
      <span className="font-mono text-[10px] border border-border rounded px-1.5 py-0.5 text-text-secondary shrink-0">
        {row.set_code}
      </span>
      <span className="truncate">{row.set_name}</span>
    </li>
  );
}
