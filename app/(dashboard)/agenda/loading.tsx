import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import PageTransition from "@/components/layout/PageTransition";

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-border/60 ${className ?? ""}`} />
  );
}

export default function AgendaLoading() {
  return (
    <>
      <Header />

      <PageTransition>
        {/* DateStrip skeleton */}
        <div className="flex gap-2 px-4 py-3 border-b border-border overflow-hidden">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex shrink-0 flex-col items-center gap-1">
              <Skeleton className="h-3 w-6" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          ))}
        </div>

        {/* Setup card skeleton */}
        <div className="mx-3 mt-3 mb-3 rounded-[14px] border border-border bg-surface overflow-hidden">
          <div className="px-4 pt-4 pb-3 flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-52" />
            </div>
          </div>
          <div className="px-4 pb-3">
            <Skeleton className="h-1.5 w-full rounded-full" />
            <Skeleton className="h-2.5 w-24 mt-1.5" />
          </div>
          <div className="border-t border-border">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border/60 last:border-b-0 bg-background">
                <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2.5 w-40" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Appointment cards skeleton */}
        <main className="flex-1 pb-safe px-4 pt-1 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-background p-4 flex gap-4 items-start"
            >
              <div className="flex flex-col items-center gap-1 shrink-0">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-3 w-10" />
              </div>
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </main>
      </PageTransition>

      <BottomNav />
    </>
  );
}
