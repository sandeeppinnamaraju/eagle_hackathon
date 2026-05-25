import type { SiteRow } from "@/components/protocol-search/types";
import type { ProtocolResult } from "@/lib/data";

export interface ProtocolDetailApiResponse {
  protocol?: Record<string, unknown> | null;
  protocol_details?: Record<string, unknown> | null;
  kpis?: Record<string, unknown> | null;
  enrollment?: Record<string, unknown> | null;
  criteria?: Record<string, unknown> | null;
  sites?: unknown;
  ai_insights?: Record<string, unknown> | unknown[] | null;
  aiInsights?: Record<string, unknown> | unknown[] | null;
  api_insights?: Record<string, unknown> | unknown[] | null;
  insights?: Record<string, unknown> | unknown[] | null;
  lessons_learned?: string | null;
  lesson_learned?: string | null;
}

export interface ProtocolDetailData {
  result: ProtocolResult;
  therapeuticArea: string;
  summary: string;
  plannedStart: string;
  actualEnd: string;
  plannedDuration: string;
  actualDuration: string;
  inclusionItems: string[];
  exclusionItems: string[];
  enrollment: {
    enrolled: number;
    target: number;
  };
  sites: SiteRow[];
  insights: {
    enrollmentRisk: string;
    recommendation: string;
    comparableTrials: string;
    operationalSignal: string;
  };
  lessonLearned: string;
}

export interface ProtocolDetailResult {
  data: ProtocolDetailData;
  source: "api" | "mock";
  error: Error | null;
}
