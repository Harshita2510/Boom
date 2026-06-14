export default function DashboardLoading() {
  return (
    <main className="space-y-6">
      <div className="space-y-3">
        <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded-md bg-muted" />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-lg border bg-background p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
                <div className="h-4 w-44 animate-pulse rounded-md bg-muted" />
              </div>
              <div className="size-9 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="h-7 w-24 animate-pulse rounded-md bg-muted" />
            <div className="mt-4 h-4 w-full animate-pulse rounded-md bg-muted" />
            <div className="mt-2 h-4 w-2/3 animate-pulse rounded-md bg-muted" />
          </div>
        ))}
      </section>
    </main>
  );
}
