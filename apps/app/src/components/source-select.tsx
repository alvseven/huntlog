import { SOURCES, SOURCE_LABELS, type Source } from "@huntlog/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SOURCE_ICONS } from "@/components/source-icon";

const NONE = "__none__";

export function SourceSelect({
  value,
  onChange,
  allowNone = true,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  allowNone?: boolean;
}) {
  return (
    <Select value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : v)}>
      <SelectTrigger>
        <SelectValue placeholder="Select source" />
      </SelectTrigger>
      <SelectContent>
        {allowNone && <SelectItem value={NONE}>—</SelectItem>}
        {SOURCES.map((s) => {
          const Icon = SOURCE_ICONS[s];
          return (
            <SelectItem key={s} value={s}>
              <span className="flex items-center gap-2">
                <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                {SOURCE_LABELS[s as Source]}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
