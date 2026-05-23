import { Check, ChevronDown, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function TherapeuticAreaSelect({
  allAreas,
  selected,
  open,
  onOpenChange,
  onToggleArea,
  onClearAll,
}: {
  allAreas: string[];
  selected: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleArea: (area: string) => void;
  onClearAll: () => void;
}) {
  const triggerLabel =
    selected.length === 0 ? "All Therapeutic Areas" : `${selected.length} selected`;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 min-w-[260px] items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 text-sm text-foreground hover:bg-muted"
        >
          {triggerLabel}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-[280px] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground">{selected.length} selected</span>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-medium text-primary hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="max-h-72 overflow-auto py-1">
          {allAreas.map((area) => {
            const checked = selected.includes(area);
            return (
              <button
                key={area}
                type="button"
                onClick={() => onToggleArea(area)}
                className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-1.5 text-left text-sm text-foreground hover:bg-muted"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded border",
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-card",
                  )}
                >
                  {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className="flex-1">{area}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function CountedTextarea({
  value,
  onChange,
  max,
  rows,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  max: number;
  rows: number;
  placeholder: string;
  className: string;
}) {
  const remaining = Math.max(0, max - value.length);

  return (
    <div className="relative mt-2">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, max))}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />
      <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-muted-foreground">
        {remaining} remaining
      </span>
    </div>
  );
}

export function SuggestionChips({
  suggestions,
  onSelect,
}: {
  suggestions: string[];
  onSelect: (value: string) => void;
}) {
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
      <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Sparkles className="h-3 w-3 text-primary" />
        Try:
      </span>
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs text-secondary-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}

export function ProtocolTextSectionLabel({
  icon: Icon,
  title,
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <span className="text-success-foreground">
      <Icon className="h-4 w-4" />
      {title}
    </span>
  );
}
