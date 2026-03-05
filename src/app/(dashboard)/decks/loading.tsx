import { Skeleton } from "@/components/ui/skeleton";

export default function DecksLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-40 bg-muted/50" />
          <Skeleton className="h-4 w-64 mt-2 bg-muted/30" />
        </div>
        <Skeleton className="h-10 w-[140px] bg-muted/30" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl bg-muted/30" />
        ))}
      </div>
    </div>
  );
}
