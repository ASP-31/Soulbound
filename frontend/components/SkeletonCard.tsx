export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 rounded bg-zinc-800" />
        <div className="h-6 w-16 rounded-full bg-zinc-800" />
      </div>
      <div className="mt-5 space-y-3">
        <div className="h-7 w-3/4 rounded bg-zinc-800" />
        <div className="h-4 w-1/2 rounded bg-zinc-800/80" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="h-12 rounded-lg bg-zinc-800/70" />
          <div className="h-12 rounded-lg bg-zinc-800/70" />
          <div className="h-12 rounded-lg bg-zinc-800/70" />
          <div className="h-12 rounded-lg bg-zinc-800/70" />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-zinc-800 pt-4">
        <div className="h-4 w-40 rounded bg-zinc-800/70" />
        <div className="h-4 w-24 rounded bg-zinc-800/70" />
      </div>
    </div>
  );
}