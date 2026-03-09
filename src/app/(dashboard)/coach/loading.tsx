import { Skeleton } from "@/components/ui/skeleton";

export default function CoachLoading() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <Skeleton className="h-7 w-28 bg-muted/50" />
        <Skeleton className="h-4 w-72 mt-2 bg-muted/30" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-24 bg-muted/30" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-16 bg-muted/20" />
          <Skeleton className="h-7 w-16 bg-muted/20" />
        </div>
      </div>
      <Skeleton className="h-[calc(100vh-18rem)] rounded-xl bg-muted/30" />
      <Skeleton className="h-10 rounded-lg bg-muted/20" />
    </div>
  );
}
