export type ChartPeriod =
  | "hour"
  | "day"
  | "week"
  | "month"
  | "3months"
  | "6months"
  | "year"
  | "5years"
  | "max";

export const DEFAULT_CHART_PERIOD: ChartPeriod = "week";
