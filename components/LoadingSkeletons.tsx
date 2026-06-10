// Loading skeleton components untuk better UX

export function CalendarSkeleton() {
  return (
    <div className="glass rounded-3xl p-7 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="w-9 h-9 rounded-full bg-white/5" />
        <div className="h-6 bg-white/10 rounded w-40" />
        <div className="w-9 h-9 rounded-full bg-white/5" />
      </div>

      {/* Days header */}
      <div className="grid grid-cols-7 mb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-4 bg-white/5 rounded mx-auto w-8" />
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-white/5 rounded-xl"
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-white/10">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-white/5" />
            <div className="h-3 bg-white/5 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PackageCardSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden animate-pulse">
      <div className="h-48 bg-white/5" />
      <div className="p-6 space-y-4">
        <div className="h-6 bg-white/10 rounded w-3/4" />
        <div className="h-4 bg-white/5 rounded w-full" />
        <div className="h-4 bg-white/5 rounded w-5/6" />
        <div className="flex items-center gap-4">
          <div className="h-4 bg-white/5 rounded w-20" />
          <div className="h-4 bg-white/5 rounded w-20" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 bg-white/5 rounded w-full" />
          ))}
        </div>
        <div className="flex items-end justify-between pt-4">
          <div className="space-y-2">
            <div className="h-3 bg-white/5 rounded w-16" />
            <div className="h-8 bg-white/10 rounded w-32" />
          </div>
          <div className="h-10 bg-white/10 rounded-full w-24" />
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="glass rounded-3xl overflow-hidden animate-pulse">
      <div className="h-64 bg-white/5" />
      <div className="p-6 space-y-3">
        <div className="h-3 bg-white/5 rounded w-20" />
        <div className="h-7 bg-white/10 rounded w-3/4" />
        <div className="h-4 bg-white/5 rounded w-full" />
        <div className="h-4 bg-white/5 rounded w-5/6" />
        <div className="space-y-2 py-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-3 bg-white/5 rounded w-full" />
          ))}
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-8 bg-white/10 rounded w-28" />
          <div className="h-4 bg-white/5 rounded w-20" />
        </div>
        <div className="h-12 bg-white/10 rounded-xl w-full" />
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative h-screen min-h-[600px] bg-ocean-deep animate-pulse">
      <div className="absolute inset-0 bg-white/5" />
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-6xl mx-auto px-8 sm:px-14 lg:px-24 w-full">
          <div className="max-w-2xl space-y-6">
            <div className="h-4 bg-white/10 rounded w-40" />
            <div className="space-y-3">
              <div className="h-16 bg-white/10 rounded w-full" />
              <div className="h-16 bg-white/10 rounded w-5/6" />
            </div>
            <div className="space-y-2">
              <div className="h-5 bg-white/5 rounded w-full" />
              <div className="h-5 bg-white/5 rounded w-4/5" />
            </div>
            <div className="flex gap-4">
              <div className="h-12 bg-white/10 rounded-full w-40" />
              <div className="h-12 bg-white/10 rounded-full w-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TestimonialSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 animate-pulse">
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-4 h-4 bg-white/10 rounded" />
        ))}
      </div>
      <div className="space-y-2 mb-6">
        <div className="h-4 bg-white/5 rounded w-full" />
        <div className="h-4 bg-white/5 rounded w-full" />
        <div className="h-4 bg-white/5 rounded w-3/4" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/10" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-white/10 rounded w-32" />
          <div className="h-3 bg-white/5 rounded w-24" />
        </div>
      </div>
    </div>
  );
}
