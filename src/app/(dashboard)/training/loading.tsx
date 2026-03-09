import { Skeleton } from "@/components/ui/skeleton";

export default function TrainingLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-32 bg-muted/50" />
          <Skeleton className="h-4 w-56 mt-2 bg-muted/30" />
        </div>
        <Skeleton className="h-8 w-24 bg-muted/30" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40 rounded-xl bg-muted/30" />
        <Skeleton className="h-40 rounded-xl bg-muted/30" />
        <Skeleton className="h-40 rounded-xl bg-muted/30" />
      </div>
      <Skeleton className="h-64 rounded-xl bg-muted/30" />
    </div>
  );
}
