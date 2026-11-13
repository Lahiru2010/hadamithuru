// app/browse/loading.tsx
export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1600px] px-4 py-8">
        <div className="h-10 w-64 bg-muted rounded-md animate-pulse mb-8" />
        <div className="flex gap-8">
          {/* Sidebar Skeleton */}
          <div className="w-72 h-96 bg-muted rounded-2xl animate-pulse hidden lg:block shrink-0" />
          
          {/* Grid Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 flex-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(i => (
              <div key={i} className="rounded-2xl bg-background border border-border overflow-hidden">
                <div className="h-48 w-full bg-muted animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-5 w-3/4 bg-muted rounded-md animate-pulse" />
                  <div className="h-4 w-1/2 bg-muted rounded-md animate-pulse" />
                  <div className="h-8 w-full bg-muted rounded-lg animate-pulse mt-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}