import { Skeleton } from "@/components/ui/skeleton";

export default function CoachLoading() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <Skeleton className="h-7 w-28 bg-muted/50" />
        <Skeleton className="h-4 w-72 mt-2 bg-muted/30" />
      </div>
      <Skeleton className="h-[calc(100vh-16rem)] rounded-xl bg-muted/30" />
    </div>
  );
}
