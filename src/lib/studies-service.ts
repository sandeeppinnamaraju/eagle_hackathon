import { apiStudiesService } from "@/lib/api-studies-service";
import { mockStudiesService } from "@/lib/mock-studies-service";
import type { IStudiesService } from "@/lib/studies-service-types";

/**
 * Central service router.
 *
 * Set VITE_USE_MOCK_DATA=true in your environment to force mock data.
 * Everything else — hooks, components, routes — remains unchanged.
 */
const useMockData = import.meta.env.VITE_USE_MOCK_DATA === "true";

export const studiesService: IStudiesService = useMockData ? mockStudiesService : apiStudiesService;
