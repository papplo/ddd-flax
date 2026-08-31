import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { useDocumentScope } from "@/document-runtime/document-scope";

export interface DateRangeBlockProps {
  /** Earliest selectable date (ISO, YYYY-MM-DD). Default: 90 days ago. */
  min?: string;
  /** Latest selectable date (ISO, YYYY-MM-DD). Default: today. */
  max?: string;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

function clamp(value: string, min: string, max: string): string {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Shared time-window control for a document (REQUIREMENTS.md §7/§8). Declares
 * per-document min/max bounds and drives the shared document scope that
 * `ChartBlock`/`TableBlock` read from by default.
 */
export function DateRangeBlock({ min, max }: DateRangeBlockProps) {
  const { range, setRange } = useDocumentScope();

  const bounds = useMemo(() => {
    const boundMax = max ?? isoDate(new Date());
    const boundMin = min ?? addDays(boundMax, -90);
    return { min: boundMin, max: boundMax };
  }, [min, max]);

  const totalDays = daysBetween(bounds.min, bounds.max);

  const [scrubValue, setScrubValue] = useState<[number, number]>([
    daysBetween(bounds.min, clamp(range.from, bounds.min, bounds.max)),
    daysBetween(bounds.min, clamp(range.to, bounds.min, bounds.max)),
  ]);

  function commitScrub(value: number | readonly number[]) {
    const [fromIdx, toIdx] = value as [number, number];
    setRange({
      from: addDays(bounds.min, Math.min(fromIdx, toIdx)),
      to: addDays(bounds.min, Math.max(fromIdx, toIdx)),
    });
  }

  return (
    <div className="not-prose my-4 flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          Från
          <input
            type="date"
            className="rounded-md border bg-fd-background px-2 py-1 text-sm"
            value={range.from}
            min={bounds.min}
            max={range.to}
            onChange={(e) => {
              const from = clamp(e.target.value, bounds.min, range.to);
              setRange({ from, to: range.to });
              setScrubValue([daysBetween(bounds.min, from), scrubValue[1]]);
            }}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          Till
          <input
            type="date"
            className="rounded-md border bg-fd-background px-2 py-1 text-sm"
            value={range.to}
            min={range.from}
            max={bounds.max}
            onChange={(e) => {
              const to = clamp(e.target.value, range.from, bounds.max);
              setRange({ from: range.from, to });
              setScrubValue([scrubValue[0], daysBetween(bounds.min, to)]);
            }}
          />
        </label>
        <span className="text-xs text-fd-muted-foreground">
          Tillåtet intervall: {bounds.min} – {bounds.max}
        </span>
      </div>
      <Slider
        min={0}
        max={totalDays}
        step={1}
        value={scrubValue}
        onValueChange={(value) => setScrubValue(value as [number, number])}
        onValueCommitted={commitScrub}
      />
    </div>
  );
}
