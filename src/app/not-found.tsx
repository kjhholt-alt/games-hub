import Link from "next/link";
import { NotFoundTracker } from "@/components/NotFoundTracker";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-6 py-20">
      <NotFoundTracker />
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-neutral-500">404</p>
      <h1 className="mb-4 text-3xl font-bold tracking-tight">That page isn&apos;t here</h1>
      <p className="mb-8 text-neutral-400">
        It may have moved, or it may never have existed. Either way the miss was logged,
        so if enough people look for it, it gets built.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className="rounded border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-500">
          Home
        </Link>
        <Link href="/mtg" className="rounded border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-500">
          MTG
        </Link>
        <Link href="/tier-lists" className="rounded border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-500">
          Tier lists
        </Link>
      </div>
    </main>
  );
}
