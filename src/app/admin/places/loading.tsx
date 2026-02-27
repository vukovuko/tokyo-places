import { Skeleton } from "@/components/ui/skeleton";

export default function PlacesLoading() {
  return (
    <>
      <div className="flex items-center justify-between border-b px-6 py-4">
        <Skeleton className="h-7 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="space-y-4 p-6">
        {/* Search bar skeleton */}
        <Skeleton className="h-10 w-full" />
        {/* Filter row skeleton */}
        <div className="flex gap-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-36" />
        </div>
        {/* Table skeleton */}
        <div className="rounded-md border">
          <div className="border-b px-4 py-3">
            <div className="flex gap-8">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="border-b px-4 py-3">
              <div className="flex items-center gap-8">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-40" />
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
