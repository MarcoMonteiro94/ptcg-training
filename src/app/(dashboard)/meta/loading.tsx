import { Skeleton } from "@/components/ui/skeleton";

export default function MetaLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Skeleton className="h-7 w-48 bg-muted/50" />
        <Skeleton className="h-4 w-72 mt-2 bg-muted/30" />
      </div>
      <Skeleton className="h-10 rounded-lg bg-muted/30" />
      <Skeleton className="h-80 rounded-lg bg-muted/30" />
      <Skeleton className="h-64 rounded-lg bg-muted/30" />
    </div>
  );
}
