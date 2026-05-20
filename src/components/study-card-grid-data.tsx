import { studies as fallbackStudies, type Study } from "@/lib/data";
import { useStudiesData } from "../hooks/use-studies-data";
import { StudyCardGrid } from "./study-card-grid";

interface StudyCardGridDataProps {
  limit?: number;
}

export function StudyCardGridData({ limit }: StudyCardGridDataProps) {
  const { studies, isLoading, error } = useStudiesData({ fallbackStudies });
  const visibleStudies: Study[] = typeof limit === "number" ? studies.slice(0, limit) : studies;

  return (
    <section aria-busy={isLoading} data-testid="study-card-grid-data">
      <span className="sr-only" role="status">
        {isLoading ? "Loading studies" : error ? "Showing fallback studies data" : "Studies loaded"}
      </span>
      <StudyCardGrid studies={visibleStudies} />
    </section>
  );
}
