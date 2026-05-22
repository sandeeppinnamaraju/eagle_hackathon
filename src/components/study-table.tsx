import { Link } from "@tanstack/react-router";
import { ChevronsUpDown, Columns3 } from "lucide-react";
import type { Study } from "@/lib/data";
import type { StudySortDirection, StudySortKey } from "@/lib/study-sorting";
import { PriorityBadge, PerformanceBadge } from "./badges";

interface Props {
  studies: Study[];
  totalCount?: number;
  visibleCount?: number;
  /** When provided, footer shows "{visibleCount} loaded • {totalCount} total" instead of page range. */
  useInfiniteScrollDisplay?: boolean;
  sortBy?: StudySortKey | null;
  sortDirection?: StudySortDirection;
  onSortChange?: (key: StudySortKey) => void;
}

export function StudyTable({
  studies,
  totalCount,
  visibleCount,
  useInfiniteScrollDisplay = false,
  sortBy,
  sortDirection = "asc",
  onSortChange,
}: Props) {
  const rowsPerPage = 25;
  const total = totalCount ?? studies.length;
  const visible = visibleCount ?? studies.length;
  const start = total === 0 ? 0 : 1;
  const end = Math.min(visible, total);
  const currentPage = total === 0 ? 0 : Math.max(1, Math.ceil(end / rowsPerPage));
  const totalPages = total === 0 ? 0 : Math.max(1, Math.ceil(total / rowsPerPage));
  const columnCount = 13;
  const toRowTestId = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <div className="rounded-xl border border-border bg-card shadow-card" data-testid="studies-table-container">
      {/* <div className="flex items-center justify-end border-b border-border px-4 py-2.5">
        <button data-testid="studies-table-columns-button" className="inline-flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted">
          <Columns3 className="h-3.5 w-3.5" />
          Columns
        </button>
      </div> */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="studies-table">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {[
                { label: "Study ID", sortKey: "id" as const },
                { label: "Phase", sortKey: "phase" as const },
                { label: "Therapeutic Area", sortKey: "therapeuticArea" as const },
                { label: "Indication", sortKey: "indication" as const },
                { label: "Portfolio / Program", sortKey: "portfolioProgram" as const },
                { label: "Status", sortKey: "status" as const },
                { label: "Priority", sortKey: "priority" as const },
                { label: "Target", sortKey: "target" as const },
                { label: "Actual", sortKey: "actual" as const },
                { label: "% vs Plan", sortKey: "percentVsPlan" as const },
                { label: "Countries", sortKey: "countries" as const },
                { label: "Sites", sortKey: "sites" as const },
                { label: "Performance", sortKey: "performance" as const },
              ].map((header) => {
                const sortable = Boolean(header.sortKey && onSortChange);
                const isActive = header.sortKey != null && sortBy === header.sortKey;
                return (
                  <th key={header.label} className="whitespace-nowrap px-4 py-3 align-middle font-semibold">
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => onSortChange?.(header.sortKey!)}
                        data-testid={`studies-table-sort-${header.sortKey}`}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        {header.label}
                        <ChevronsUpDown className="h-3 w-3" />
                        {isActive && <span className="text-[10px]">{sortDirection === "asc" ? "▲" : "▼"}</span>}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        {header.label}
                        {header.sortKey && <ChevronsUpDown className="h-3 w-3" />}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {total === 0 ? (
              <tr data-testid="studies-table-empty-state">
                <td colSpan={columnCount} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No Studies Found
                </td>
              </tr>
            ) : (
              studies.map((s, index) => (
                <tr
                  key={`${s.id}-${index}`}
                  data-testid={`study-row-${toRowTestId(s.id)}`}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                >
                  <td data-testid={`study-row-${toRowTestId(s.id)}-id`} className="whitespace-nowrap px-4 py-3 align-middle font-mono text-xs font-semibold text-primary">
                    <Link to="/studies/$studyId" params={{ studyId: s.id }} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {s.id}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 align-middle text-foreground">{s.phase}</td>
                  <td className="whitespace-nowrap px-4 py-3 align-middle text-foreground">{s.therapeuticArea}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 align-middle text-foreground" title={s.indication}>
                    {s.indication}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 align-middle text-muted-foreground">
                    {s.portfolio} / <span className="font-mono text-xs">{s.program}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 align-middle text-foreground">{s.status}</td>
                  <td className="whitespace-nowrap px-4 py-3 align-middle"><PriorityBadge value={s.priority} /></td>
                  <td className="px-4 py-3 align-middle text-right tabular-nums text-foreground">{s.target.toLocaleString()}</td>
                  <td className="px-4 py-3 align-middle text-right tabular-nums text-foreground">{s.actual.toLocaleString()}</td>
                  <td className="px-4 py-3 align-middle text-right font-semibold tabular-nums text-foreground">
                    {s.percentVsPlan != null ? `${s.percentVsPlan}%` : "—"}
                  </td>
                  <td className="px-4 py-3 align-middle text-center tabular-nums text-foreground">{s.countries}</td>
                  <td className="px-4 py-3 align-middle text-center tabular-nums text-foreground">{s.sites}</td>
                  <td className="whitespace-nowrap px-4 py-3 align-middle"><PerformanceBadge value={s.performance} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
        <p className="text-muted-foreground" data-testid="studies-table-range">
          {useInfiniteScrollDisplay
            ? <>{end.toLocaleString()} loaded &bull; {total.toLocaleString()} total</>
            : <>{start}–{end} of {total}</>}
        </p>
      </div>
    </div>
  );
}
