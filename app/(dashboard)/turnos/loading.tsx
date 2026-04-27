import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import PageTransition from "@/components/layout/PageTransition";

function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`animate-pulse rounded bg-border/60 ${className ?? ""}`} style={style} />
  );
}

export default function TurnosLoading() {
  return (
    <>
      <Header />

      <PageTransition>
        <main className="flex-1 pb-safe">
          <div className="px-4 pt-4 pb-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>

            {/* Stats 2x2 */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-[10px] border border-border bg-surface p-3 space-y-1"
                >
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 mb-3">
              {[60, 80, 70, 80].map((w, i) => (
                <Skeleton
                  key={i}
                  className="h-7 rounded-full shrink-0"
                  style={{ width: `${w}px` } as React.CSSProperties}
                />
              ))}
            </div>
          </div>

          {/* Day group + cards */}
          <div className="px-4 space-y-4">
            {[...Array(2)].map((_, g) => (
              <div key={g}>
                <div className="flex items-center gap-3 py-2 mb-1">
                  <Skeleton className="h-3 w-28 rounded" />
                  <div className="flex-1 h-px bg-border" />
                </div>
                {[...Array(g === 0 ? 3 : 2)].map((_, i) => (
                  <div
                    key={i}
                    className="mb-2 rounded-lg border border-border bg-background p-3.5 flex items-center gap-3"
                  >
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <Skeleton className="h-6 w-10" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-4 w-12 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </main>
      </PageTransition>

      <BottomNav />
    </>
  );
}
