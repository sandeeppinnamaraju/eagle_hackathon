import { useQuery } from "@tanstack/react-query";
import type { Study } from "@/lib/data";
import { fetchStudiesFromApi } from "@/lib/studies-api";

interface UseStudiesDataOptions {
  fallbackStudies: Study[];
}

export function useStudiesData({ fallbackStudies }: UseStudiesDataOptions) {
  const query = useQuery({
    queryKey: ["studies"],
    queryFn: ({ signal }) => fetchStudiesFromApi(signal),
    staleTime: 60_000,
  });

  const studies = Array.isArray(query.data) && query.data.length > 0 ? query.data : fallbackStudies;
  const error = query.error ?? null;

  return {
    studies,
    isLoading: query.isLoading,
    error,
  };
}
