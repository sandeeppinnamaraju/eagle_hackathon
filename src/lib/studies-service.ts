import { apiStudiesService } from "@/lib/api-studies-service";
import type { IStudiesService } from "@/lib/studies-service-types";

export const studiesService: IStudiesService = apiStudiesService;
