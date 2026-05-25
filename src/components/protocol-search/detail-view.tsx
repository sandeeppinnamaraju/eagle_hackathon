import { ArrowLeft } from "lucide-react";
import {
  AIInsightsSection,
  CriteriaSections,
  EnrollmentOutcomesSection,
  LessonsLearnedSection,
  ProtocolHeaderSection,
  SitesUsedSection,
} from "@/components/protocol-search/detail-sections";
import {
  ProtocolSearchModeLink,
  ProtocolSearchPageShell,
} from "@/components/protocol-search/shared";
import { useProtocolDetail } from "@/hooks/use-protocol-detail";

interface ProtocolSearchDetailViewProps {
  id?: string;
}

export function ProtocolSearchDetailView({ id }: ProtocolSearchDetailViewProps) {
  const { data, isLoading, error, isUsingFallback } = useProtocolDetail(id);

  return (
    <ProtocolSearchPageShell compact>
      <ProtocolSearchModeLink
        mode="results"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to results
      </ProtocolSearchModeLink>

      {isLoading ? (
        <div className="mt-4 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-card">
          Loading protocol details...
        </div>
      ) : !id || !data ? (
        <div className="mt-4 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-card">
          Protocol details are unavailable.
        </div>
      ) : (
        <>
          {(error || isUsingFallback) && (
            <div className="mt-4 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              Showing fallback protocol details because the API data is unavailable.
            </div>
          )}

          <ProtocolHeaderSection
            result={data.result}
            therapeuticArea={data.therapeuticArea}
            summary={data.summary}
            plannedStart={data.plannedStart}
            actualEnd={data.actualEnd}
            plannedDuration={data.plannedDuration}
            actualDuration={data.actualDuration}
          />

          <AIInsightsSection insights={data.insights} />

          <CriteriaSections
            inclusionItems={data.inclusionItems}
            exclusionItems={data.exclusionItems}
          />

          <EnrollmentOutcomesSection
            enrolled={data.enrollment.enrolled}
            target={data.enrollment.target}
          />

          <SitesUsedSection sites={data.sites} />

          <LessonsLearnedSection lesson={data.lessonLearned} />
        </>
      )}
    </ProtocolSearchPageShell>
  );
}
