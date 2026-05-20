import { apiStudiesService } from "@/lib/api-studies-service";
import { mockStudiesService } from "@/lib/mock-studies-service";
import type { IStudiesService } from "@/lib/studies-service-types";

/**
 * Central service router.
 *
 * Set VITE_USE_MOCK_DATA=false in your environment to switch to the real API.
 * Everything else — hooks, components, routes — remains unchanged.
 */
const useMockData = import.meta.env.VITE_USE_MOCK_DATA !== "false";

export const studiesService: IStudiesService = useMockData ? mockStudiesService : apiStudiesService;
