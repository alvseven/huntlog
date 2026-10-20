import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface SparklinePoint {
  date: string;
  count: number;
}

function formatDay(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function SparklineBars({ data, className }: { data: SparklinePoint[]; className?: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className={cn("flex items-end gap-0.5", className)}>
      {data.map((d) => (
        <Tooltip key={d.date}>
          <TooltipTrigger asChild>
            <div
              className="min-h-[3px] flex-1 cursor-default rounded-[1.5px] bg-accent-2/70 transition-[height] duration-500 ease-out hover:bg-accent-2"
              style={{ height: `${Math.max(6, (d.count / max) * 100)}%` }}
            />
          </TooltipTrigger>
          <TooltipContent>
            {formatDay(d.date)}: {d.count} applied
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
