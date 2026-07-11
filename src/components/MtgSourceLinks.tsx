import type { MtgSource } from "@/lib/mtg";

/** Per-row citation links — cite-and-link, never re-hosted numbers. */
export function MtgSourceLinks({ sources }: { sources: MtgSource[] }) {
  if (sources.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {sources.map((s) => (
        <a
          key={s.url}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] leading-none rounded px-1.5 py-0.5 border border-border text-text-secondary hover:text-cyan hover:border-cyan/40 transition-colors"
        >
          {s.name}
        </a>
      ))}
    </span>
  );
}
