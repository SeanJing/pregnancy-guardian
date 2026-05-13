export function SkeletonLine({ className = '' }) {
  return <div className={`h-4 bg-gray-200 rounded animate-pulse ${className}`} />
}

export function SkeletonBlock({ className = '' }) {
  return <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`} />
}

export function CalendarSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-16 rounded-lg" />
        ))}
      </div>
      <SkeletonBlock className="h-48 rounded-xl" />
    </div>
  )
}

export function GallerySkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonLine className="w-24" />
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonBlock key={i} className="aspect-square" />
        ))}
      </div>
    </div>
  )
}

export function DocumentsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <SkeletonBlock className="w-8 h-8" />
          <div className="flex-1 space-y-1.5">
            <SkeletonLine className="w-3/4" />
            <SkeletonLine className="w-1/3 h-3" />
          </div>
        </div>
      ))}
    </div>
  )
}
