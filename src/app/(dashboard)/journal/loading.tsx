import { Skeleton } from "@/components/ui/skeleton";

export default function JournalLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-40 bg-muted/50" />
          <Skeleton className="h-4 w-64 mt-2 bg-muted/30" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 bg-muted/30" />
          <Skeleton className="h-8 w-24 bg-muted/30" />
        </div>
      </div>
      <Skeleton className="h-64 rounded-xl bg-muted/30" />
    </div>
  );
}
