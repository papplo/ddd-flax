import { useEffect, useState } from "react";
import { AreaChart } from "@/components/charts/area-chart";
import { Area } from "@/components/charts/area";
import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { Grid } from "@/components/charts/grid";
import { XAxis } from "@/components/charts/x-axis";
import { fetchMockIgmSeries } from "@/data/sources/mock-igm";
import { toChartData } from "@/data/transforms/igm";
import { useOptionalDocumentScope } from "@/document-runtime/document-scope";
import { defaultDateRange } from "@/data/sources/mock-igm";
import type { DateRange } from "@/types/igm";

export interface ChartBlockProps {
  /** Which IGM source to read from. */
  igm: string;
  /** Property/measurement to plot. */
  prop: string;
  /**
   * Chart type. Default: "area".
   *
   * "bar" renders Bklit's categorical BarChart, which expects one data point
   * per x-axis label — dense hourly series (like our mock IGM data) collide
   * onto the same day label and crash its scale. Only use "bar" with data
   * that's already aggregated to one point per label (e.g. daily/weekly).
   */
  kind?: "area" | "bar";
  /** Display label (defaults to `prop`). */
  label?: string;
  /**
   * Explicit range for this block. When omitted, the block subscribes to the
   * shared document scope (set by a `DateRangeBlock`) if one is present.
   */
  from?: string;
  to?: string;
}

export function ChartBlock({ igm, prop, kind = "area", label, from, to }: ChartBlockProps) {
  const scope = useOptionalDocumentScope();
  const range: DateRange = from && to ? { from, to } : scope?.range ?? defaultDateRange();

  const [data, setData] = useState<Array<{ date: Date; value: number }>>([]);
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    fetchMockIgmSeries({ igmId: igm, propName: prop, range }).then((series) => {
      if (cancelled) return;
      setData(toChartData(series));
      setStatus("ready");
    });

    return () => {
      cancelled = true;
    };
  }, [igm, prop, range.from, range.to]);

  const chartData = data as unknown as Record<string, unknown>[];

  return (
    <div className="not-prose my-4 rounded-lg border p-4">
      <div className="mb-2 text-sm font-medium text-fd-muted-foreground">{label ?? prop}</div>
      {data.length === 0 ? (
        // The chart shell's scales need at least one data point — render our
        // own placeholder until the first fetch resolves, rather than an
        // empty `data={[]}` chart (its XAxis crashes with no domain).
        <div
          className="flex animate-pulse items-center justify-center rounded-md bg-fd-muted text-sm text-fd-muted-foreground"
          style={{ aspectRatio: "2 / 1" }}
        >
          Laddar diagram…
        </div>
      ) : kind === "bar" ? (
        <BarChart data={chartData} xDataKey="date" status={status}>
          <Grid />
          <XAxis />
          <Bar dataKey="value" />
        </BarChart>
      ) : (
        <AreaChart data={chartData} xDataKey="date" status={status}>
          <Grid />
          <XAxis />
          <Area dataKey="value" />
        </AreaChart>
      )}
    </div>
  );
}
