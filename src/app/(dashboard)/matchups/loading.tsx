import { Skeleton } from "@/components/ui/skeleton";

export default function MatchupsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-44 bg-muted/50" />
          <Skeleton className="h-4 w-72 mt-2 bg-muted/30" />
        </div>
        <Skeleton className="h-10 w-[140px] bg-muted/30" />
      </div>
      <Skeleton className="h-80 rounded-xl bg-muted/30" />
    </div>
  );
}
