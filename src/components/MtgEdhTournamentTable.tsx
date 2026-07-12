import { ExternalLink } from "lucide-react";
import { formatDate, type EdhTournamentRow, type EdhTournamentStanding } from "@/lib/mtg";

/**
 * Real cEDH tournament results from topdeck.gg (Module 3 addendum) — one
 * event per card, most-recent-first (the engine already sorts + caps to 40
 * events server-side, so no further slicing happens here). `top_standings`
 * is the engine's OWN sort by win differential, not the event's official
 * final standings (topdeck.gg's API carries no organizer-tagged placement
 * field) — every event links back to the real event on topdeck.gg, and
 * every standing shows its real W-L-D plus a real commander name ONLY when
 * topdeck.gg's structured decklist import provided one.
 */
export function MtgEdhTournamentTable({ rows }: { rows: EdhTournamentRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        No cEDH tournament results recorded this run.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <EventCard key={row.tid} row={row} />
      ))}
      <p className="text-xs text-text-secondary max-w-3xl">
        Top standings are ranked by win differential (wins minus losses,
        ties broken by wins) —{" "}
        <a
          href="https://topdeck.gg"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brass hover:text-brass-bright transition-colors"
        >
          topdeck.gg
        </a>
        &rsquo;s real API carries no organizer-tagged placement field, so
        this is not each event&rsquo;s official final standings. Commander
        names appear only when topdeck.gg&rsquo;s structured decklist import
        provided one — never inferred from an unparsed decklist.
      </p>
    </div>
  );
}

function EventCard({ row }: { row: EdhTournamentRow }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-surface px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-wide text-text-secondary tabular-nums shrink-0">
            {formatDate(row.date)}
          </span>
          {row.event_url ? (
            <a
              href={row.event_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-sm truncate hover:text-brass transition-colors"
            >
              {row.name}
              <ExternalLink size={11} className="text-text-secondary shrink-0" />
            </a>
          ) : (
            <span className="font-medium text-sm truncate">{row.name}</span>
          )}
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wide text-text-secondary shrink-0">
          {row.player_count} players
        </span>
      </div>
      <ol className="divide-y divide-border">
        {row.top_standings.map((standing, i) => (
          <StandingRow key={`${row.tid}-${i}`} rank={i + 1} standing={standing} />
        ))}
      </ol>
    </div>
  );
}

function StandingRow({
  rank,
  standing,
}: {
  rank: number;
  standing: EdhTournamentStanding;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-1.5 text-sm">
      <span className="flex items-center gap-2 min-w-0">
        <span className="font-mono text-[10px] text-text-secondary tabular-nums w-4 text-right shrink-0">
          {rank}
        </span>
        <span className="truncate">{standing.player}</span>
      </span>
      <span className="flex items-center gap-2 shrink-0">
        <span className="font-mono text-xs tabular-nums text-text-secondary">
          {standing.wins}-{standing.losses}-{standing.draws}
        </span>
        {standing.commanders && standing.commanders.length > 0 ? (
          <span className="text-xs text-brass truncate max-w-[14rem]">
            {standing.commanders.join(" / ")}
          </span>
        ) : (
          <span className="text-[11px] text-text-secondary italic whitespace-nowrap">
            record only (no commander data)
          </span>
        )}
      </span>
    </li>
  );
}
