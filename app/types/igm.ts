/**
 * Mock-only shape for IGM ("individual model") time-series data, per REQUIREMENTS.md §6.
 * Not the real data contract — the actual data layer is a separate, later concern.
 */
export interface IgmDataPoint {
  /** Epoch date, format YYYYMMDD */
  edd: string;
  /** Market time unit — hour index within the epoch, 1..25 (25 covers DST fallback days) */
  mtu: number;
  [propName: string]: string | number;
}

export interface IgmSeries {
  igmId: string;
  propName: string;
  points: IgmDataPoint[];
}

export interface DateRange {
  from: string;
  to: string;
}
