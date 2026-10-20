import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export function TagsInput({
  value,
  onChange,
  suggestions,
}: {
  value: string[];
  onChange: (names: string[]) => void;
  suggestions: string[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const available = suggestions.filter(
    (s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())
  );
  const filtered = normalizedQuery
    ? available.filter((s) => s.toLowerCase().includes(normalizedQuery))
    : available;
  const exactMatch = available.some((s) => s.toLowerCase() === normalizedQuery);
  const canCreate = normalizedQuery.length > 0 && !exactMatch;

  const add = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...value, trimmed]);
    setQuery("");
  };

  const remove = (name: string) => onChange(value.filter((v) => v !== name));

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring"
        onClick={() => setOpen(true)}
      >
        {value.map((name) => (
          <span
            key={name}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
          >
            {name}
            <button
              type="button"
              aria-label={`Remove tag ${name}`}
              onClick={(e) => {
                e.stopPropagation();
                remove(name);
              }}
              className="rounded-full opacity-60 outline-none transition-opacity hover:opacity-100 focus-visible:opacity-100"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered[0]) add(filtered[0]);
              else if (canCreate) add(query);
            } else if (e.key === "Backspace" && !query && value.length > 0) {
              remove(value[value.length - 1]);
            }
          }}
          placeholder={value.length === 0 ? "Add tags…" : ""}
          className="min-w-24 flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {open && (filtered.length > 0 || canCreate) && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground">
          {filtered.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => add(name)}
              className="flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            >
              {name}
            </button>
          ))}
          {canCreate && (
            <button
              type="button"
              onClick={() => add(query)}
              className="flex w-full items-center gap-1 rounded-sm px-2 py-1.5 text-left text-sm text-primary outline-none hover:bg-accent"
            >
              Create tag "{query.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
