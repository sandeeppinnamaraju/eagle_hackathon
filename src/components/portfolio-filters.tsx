import { Search, Calendar, ChevronDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const toTestIdSegment = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type MultiSelectFilterProps = {
  label: string;
  options: string[];
  selected: string[];
  onToggle?: (value: string) => void;
  onClear?: () => void;
  widthClassName?: string;
};

function MultiSelectFilter({
  label,
  options,
  selected,
  onToggle,
  onClear,
  widthClassName = "w-64",
}: MultiSelectFilterProps) {
  const displayLabel = selected.length === 0 ? label : `${label} (${selected.length})`;
  const filterId = toTestIdSegment(label);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid={`studies-filter-${filterId}-trigger`}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-input bg-card px-3 text-sm text-foreground hover:bg-muted"
        >
          {displayLabel}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        data-testid={`studies-filter-${filterId}-menu`}
        className={`z-20 rounded-lg border border-input bg-card p-2 shadow-card ${widthClassName}`}
      >
        {selected.length > 0 && (
          <div className="mb-2 flex items-center justify-end border-b border-border pb-2">
            <button
              type="button"
              onClick={() => onClear?.()}
              data-testid={`studies-filter-${filterId}-clear`}
              className="text-xs font-medium text-primary hover:underline"
            >
              Clear
            </button>
          </div>
        )}
        <div className="max-h-60 overflow-auto">
          {options.map((option) => {
            const checked = selected.includes(option);
            return (
              <button
                type="button"
                key={option}
                data-testid={`studies-filter-${filterId}-option-${toTestIdSegment(option)}`}
                className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
                onClick={() => onToggle?.(option)}
              >
                <span>{option}</span>
                <Check className={`h-4 w-4 ${checked ? "text-primary" : "invisible"}`} />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface PortfolioFiltersProps {
  total: number;
  /** Number of records currently loaded into the UI (for infinite scroll display). */
  loadedCount?: number;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  therapeuticAreas?: string[];
  selectedTherapeuticAreas?: string[];
  onToggleTherapeuticArea?: (area: string) => void;
  onClearTherapeuticAreas?: () => void;
  phases?: string[];
  selectedPhases?: string[];
  onTogglePhase?: (phase: string) => void;
  onClearPhases?: () => void;
  statuses?: string[];
  selectedStatuses?: string[];
  onToggleStatus?: (status: string) => void;
  onClearStatuses?: () => void;
  portfolios?: string[];
  selectedPortfolios?: string[];
  onTogglePortfolio?: (portfolio: string) => void;
  onClearPortfolios?: () => void;
  programs?: string[];
  selectedPrograms?: string[];
  onToggleProgram?: (program: string) => void;
  onClearPrograms?: () => void;
  regions?: string[];
  selectedRegions?: string[];
  onToggleRegion?: (region: string) => void;
  onClearRegions?: () => void;
}

export function PortfolioFilters({
  total,
  loadedCount,
  searchQuery = "",
  onSearchQueryChange,
  therapeuticAreas = [],
  selectedTherapeuticAreas = [],
  onToggleTherapeuticArea,
  onClearTherapeuticAreas,
  phases = [],
  selectedPhases = [],
  onTogglePhase,
  onClearPhases,
  statuses = [],
  selectedStatuses = [],
  onToggleStatus,
  onClearStatuses,
  portfolios = [],
  selectedPortfolios = [],
  onTogglePortfolio,
  onClearPortfolios,
  programs = [],
  selectedPrograms = [],
  onToggleProgram,
  onClearPrograms,
  regions = [],
  selectedRegions = [],
  onToggleRegion,
  onClearRegions,
}: PortfolioFiltersProps) {
  return (
    <div className="space-y-3" data-testid="studies-filters">
      <div className="flex items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by ID, title..."
            value={searchQuery}
            onChange={(event) => onSearchQueryChange?.(event.target.value)}
            data-testid="studies-search-input"
            className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <p className="text-sm text-muted-foreground" data-testid="studies-results-count">
          {loadedCount != null ? (
            <>
              <span className="font-semibold text-foreground">{loadedCount.toLocaleString()}</span> loaded &bull;{" "}
              <span className="font-semibold text-foreground">{total.toLocaleString()}</span> total
            </>
          ) : (
            <>
              <span className="font-semibold text-foreground">{total.toLocaleString()}</span> studies
            </>
          )}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <MultiSelectFilter
          label="Therapeutic Area"
          options={therapeuticAreas}
          selected={selectedTherapeuticAreas}
          onToggle={onToggleTherapeuticArea}
          onClear={onClearTherapeuticAreas}
        />
        <MultiSelectFilter
          label="Phase"
          options={phases}
          selected={selectedPhases}
          onToggle={onTogglePhase}
          onClear={onClearPhases}
          widthClassName="w-52"
        />
        <MultiSelectFilter
          label="Study Status"
          options={statuses}
          selected={selectedStatuses}
          onToggle={onToggleStatus}
          onClear={onClearStatuses}
          widthClassName="w-56"
        />
        <MultiSelectFilter
          label="Portfolio"
          options={portfolios}
          selected={selectedPortfolios}
          onToggle={onTogglePortfolio}
          onClear={onClearPortfolios}
        />
        <MultiSelectFilter
          label="Program"
          options={programs}
          selected={selectedPrograms}
          onToggle={onToggleProgram}
          onClear={onClearPrograms}
          widthClassName="w-56"
        />
        <MultiSelectFilter
          label="Region"
          options={regions}
          selected={selectedRegions}
          onToggle={onToggleRegion}
          onClear={onClearRegions}
          widthClassName="w-56"
        />
        <button data-testid="studies-filter-fpi-lpo-trigger" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-input bg-card px-3 text-sm text-foreground hover:bg-muted">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          FPI / LPO
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
