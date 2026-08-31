import type { IgmDataPoint, IgmSeries } from "@/types/igm";

/** Combines an IGM point's epoch date (edd) and hour index (mtu) into a real timestamp. */
export function igmPointTimestamp(point: IgmDataPoint): Date {
  const year = Number(point.edd.slice(0, 4));
  const month = Number(point.edd.slice(4, 6)) - 1;
  const day = Number(point.edd.slice(6, 8));
  const hour = point.mtu - 1;
  return new Date(year, month, day, hour);
}

/** Converts an IGM series into the `{ date, value }[]` shape chart components expect. */
export function toChartData(series: IgmSeries): Array<{ date: Date; value: number }> {
  return series.points.map((point) => ({
    date: igmPointTimestamp(point),
    value: Number(point[series.propName]),
  }));
}
