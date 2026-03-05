import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <Skeleton className="h-7 w-48 bg-muted/50" />
        <Skeleton className="h-4 w-72 mt-2 bg-muted/30" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg bg-muted/30" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg bg-muted/30" />
    </div>
  );
}
