import { Skeleton } from "@/components/ui/skeleton";

export default function TournamentsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-40 bg-muted/50" />
          <Skeleton className="h-4 w-64 mt-2 bg-muted/30" />
        </div>
        <Skeleton className="h-8 w-28 bg-muted/30" />
      </div>
      <div className="rounded-xl border border-border/30 p-4 space-y-3">
        <Skeleton className="h-3 w-32 bg-muted/20" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg bg-muted/30" />
        ))}
      </div>
    </div>
  );
}
