export interface ProtocolsSummaryApiResponse {
  success?: unknown;
  protocolCount?: unknown;
  distinctTherapeuticAreaCount?: unknown;
}

export interface ProtocolsSummaryData {
  protocolCount: number;
  distinctTherapeuticAreaCount: number;
}

export interface ProtocolsSummaryResult {
  data: ProtocolsSummaryData;
  source: "api" | "mock";
  error: Error | null;
}
