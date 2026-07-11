/** Per-row citation text — the engine emits sources as plain strings (e.g.
 * "Decklists via Archidekt (archidekt.com)"), not {name,url} pairs, so these
 * render as citation chips rather than hyperlinks. Individual rows carry
 * their own real link where the engine gives one (deck_url on commander
 * rows, wizards_announcements_url on banlist rows) — those render as actual
 * <a> tags at the call site, not here. */
export function MtgSourceLinks({ sources }: { sources: string[] }) {
  if (sources.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {sources.map((s) => (
        <span
          key={s}
          className="text-[10px] leading-none rounded px-1.5 py-0.5 border border-border text-text-secondary"
        >
          {s}
        </span>
      ))}
    </span>
  );
}
