import { cn } from "@/lib/utils";
import { Table as TableIcon, LayoutGrid } from "lucide-react";

interface Props {
  value: "table" | "cards";
  onChange: (v: "table" | "cards") => void;
}

export function ViewToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-input bg-card p-1 shadow-card">
      
      <button
        onClick={() => onChange("cards")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          value === "cards"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted",
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Cards
      </button>
      <button
        onClick={() => onChange("table")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          value === "table"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted",
        )}
      >
        <TableIcon className="h-3.5 w-3.5" />
        Table
      </button>
    </div>
  );
}
