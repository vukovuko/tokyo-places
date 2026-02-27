import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesLoading() {
  return (
    <>
      <div className="flex items-center justify-between border-b px-6 py-4">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="p-6">
        <div className="rounded-md border">
          <div className="border-b px-4 py-3">
            <div className="flex gap-16">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="border-b px-4 py-3">
              <div className="flex items-center gap-16">
                <Skeleton className="h-4 w-28" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
