import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { protocolResults } from "@/lib/data";
import {
  AIInsightsSection,
  CriteriaSections,
  EnrollmentOutcomesSection,
  LessonsLearnedSection,
  ProtocolHeaderSection,
  SitesUsedSection,
} from "@/components/protocol-search/detail-sections";
import {
  DETAIL_ENROLLMENT,
  DETAIL_EXCLUSION_ITEMS,
  DETAIL_INCLUSION_ITEMS,
  DETAIL_SITES,
} from "@/components/protocol-search/constants";
import {
  ProtocolSearchModeLink,
  ProtocolSearchPageShell,
} from "@/components/protocol-search/shared";

interface ProtocolSearchDetailViewProps {
  id?: string;
}

export function ProtocolSearchDetailView({ id }: ProtocolSearchDetailViewProps) {
  const result = useMemo(() => protocolResults.find((p) => p.id === id) ?? protocolResults[0], [id]);

  return (
    <ProtocolSearchPageShell compact>
      <ProtocolSearchModeLink
        mode="results"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to results
      </ProtocolSearchModeLink>

      <ProtocolHeaderSection result={result} />

      <AIInsightsSection />

      <CriteriaSections
        inclusionItems={[...DETAIL_INCLUSION_ITEMS]}
        exclusionItems={[...DETAIL_EXCLUSION_ITEMS]}
      />

      <EnrollmentOutcomesSection
        enrolled={DETAIL_ENROLLMENT.enrolled}
        target={DETAIL_ENROLLMENT.target}
      />

      <SitesUsedSection sites={[...DETAIL_SITES]} />

      <LessonsLearnedSection />
    </ProtocolSearchPageShell>
  );
}
