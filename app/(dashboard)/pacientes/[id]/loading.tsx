import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import PageTransition from "@/components/layout/PageTransition";

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-border/60 ${className ?? ""}`} />
  );
}

export default function PacienteDetalleLoading() {
  return (
    <>
      <Header />

      <PageTransition>
        <main className="flex-1 pb-safe px-4 pt-4">
          <Skeleton className="h-8 w-24 rounded-lg mb-4" />

          <div className="rounded-xl border border-border bg-background p-4 mb-4 flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-[10px] border border-border bg-surface p-3 space-y-1"
              >
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>

          <Skeleton className="h-4 w-24 mb-3" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-background p-3.5 flex items-center gap-3"
              >
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </main>
      </PageTransition>

      <BottomNav />
    </>
  );
}
