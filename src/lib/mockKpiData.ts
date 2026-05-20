export const mockKpiData = {
  active_studies: {
    count: 30,
  },
  on_track: {
    percentage: 26.67,
    count: 8,
  },
  off_track_or_at_risk: {
    percentage: 73.33,
    count: 22,
  },
  enrollment_vs_target: {
    percentage: 16.13,
    sum_actual: 12788,
    sum_target: 79273,
  },
  velocity_vs_plan: {
    average: 85.2,
  },
} as const;

export const fallbackScheduleAdherence = {
  percentage: 90.1,
  completed: 12416,
  planned: 13782,
} as const;
