import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import PageTransition from "@/components/layout/PageTransition";

function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`animate-pulse rounded bg-border/60 ${className ?? ""}`} style={style} />
  );
}

export default function PacientesLoading() {
  return (
    <>
      <Header />

      <PageTransition>
        <main className="flex-1 pb-safe">
          <div className="px-4 pt-4 pb-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>

            {/* Search bar */}
            <Skeleton className="h-10 w-full rounded-lg mb-3" />

            {/* Filter pills */}
            <div className="flex gap-2 mb-4">
              {[55, 65, 60, 80].map((w, i) => (
                <Skeleton
                  key={i}
                  className="h-7 rounded-full shrink-0"
                  style={{ width: `${w}px` } as React.CSSProperties}
                />
              ))}
            </div>
          </div>

          {/* Patient rows */}
          <div className="px-4 space-y-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-background p-3.5 flex items-center gap-3"
              >
                <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Skeleton className="h-4 w-12 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </PageTransition>

      <BottomNav />
    </>
  );
}
