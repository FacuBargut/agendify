import BottomNav from "@/components/layout/BottomNav";
import PageTransition from "@/components/layout/PageTransition";

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-border/60 ${className ?? ""}`} />
  );
}

function SectionSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 mb-3 space-y-3">
      <Skeleton className="h-4 w-28 mb-1" />
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default function PerfilLoading() {
  return (
    <>
      <PageTransition>
        <main className="flex-1 pb-safe">
          {/* Profile header */}
          <div className="flex flex-col items-center pt-8 pb-6 px-4">
            <Skeleton className="h-20 w-20 rounded-full mb-3" />
            <Skeleton className="h-5 w-36 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>

          <div className="px-4">
            <SectionSkeleton rows={2} />
            <SectionSkeleton rows={3} />
            <SectionSkeleton rows={2} />
            {/* Availability days */}
            <div className="rounded-xl border border-border bg-background p-4 mb-3">
              <Skeleton className="h-4 w-32 mb-3" />
              <div className="grid grid-cols-7 gap-1.5">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <Skeleton className="h-3 w-6" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </PageTransition>

      <BottomNav />
    </>
  );
}
