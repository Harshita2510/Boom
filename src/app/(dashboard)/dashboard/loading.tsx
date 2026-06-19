export default function DashboardLoading() {
  return (
    <main className="space-y-5 sm:space-y-6">
      <section className="rounded-[24px] border border-white/70 bg-[linear-gradient(135deg,#f8fafc_0%,#ecfeff_52%,#fff7ed_100%)] p-4 shadow-sm sm:rounded-[32px] sm:p-7">
        <div className="flex items-center justify-between gap-5">
          <div className="space-y-3">
            <div className="h-8 w-48 animate-pulse rounded-full bg-white/80 sm:h-10 sm:w-72" />
            <div className="h-4 w-64 max-w-full animate-pulse rounded-full bg-white/70" />
          </div>
          <div className="hidden size-16 animate-pulse rounded-[24px] bg-white/70 sm:block" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="min-h-[132px] rounded-[22px] border border-white/70 bg-white/80 p-4 shadow-sm sm:min-h-[148px] sm:rounded-[24px] sm:p-5"
          >
            <div className="size-12 animate-pulse rounded-2xl bg-muted" />
            <div className="mt-8 h-4 w-32 animate-pulse rounded-full bg-muted" />
            <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-muted" />
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[24px] border border-white/70 bg-white/85 p-4 shadow-sm sm:rounded-[28px] sm:p-6"
          >
            <div className="h-5 w-40 animate-pulse rounded-full bg-muted" />
            <div className="mt-5 space-y-3">
              <div className="h-4 w-full animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
