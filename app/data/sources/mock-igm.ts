import type { DateRange, IgmDataPoint, IgmSeries } from "@/types/igm";

/**
 * Mock IGM data source. Stands in for the real data layer (out of scope — see
 * REQUIREMENTS.md §6/§13) so the block components and document-runtime have
 * something real to render against while the actual dataProvider is designed.
 */

function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function toEdd(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function eachDate(from: string, to: string): Date[] {
  const start = new Date(from);
  const end = new Date(to);
  const dates: Date[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  return dates;
}

/** mtu 1..24 for a normal day, 25 to cover a DST fallback day. */
function mtuCountFor(): number {
  return 24;
}

export interface MockIgmOptions {
  igmId: string;
  propName: string;
  range: DateRange;
  /** Base level the series oscillates around. */
  baseValue?: number;
  /** Amplitude of daily/hourly variation. */
  amplitude?: number;
}

export function generateMockIgmSeries({
  igmId,
  propName,
  range,
  baseValue = 100,
  amplitude = 30,
}: MockIgmOptions): IgmSeries {
  const points: IgmDataPoint[] = [];

  for (const date of eachDate(range.from, range.to)) {
    const edd = toEdd(date);
    const mtuCount = mtuCountFor();

    for (let mtu = 1; mtu <= mtuCount; mtu++) {
      const rand = seededRandom(`${igmId}:${propName}:${edd}:${mtu}`);
      const hourOfDay = mtu - 1;
      const dailyCurve = Math.sin((hourOfDay / 24) * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;
      const noise = (rand() - 0.5) * 0.3;
      const value = Math.max(0, baseValue + amplitude * dailyCurve + amplitude * noise);

      points.push({
        edd,
        mtu,
        [propName]: Math.round(value * 100) / 100,
      });
    }
  }

  return { igmId, propName, points };
}

/** Simulates a live fetch against the data layer, including latency, for loading-state UX. */
export async function fetchMockIgmSeries(options: MockIgmOptions): Promise<IgmSeries> {
  const delay = 250 + Math.random() * 400;
  await new Promise((resolve) => setTimeout(resolve, delay));
  return generateMockIgmSeries(options);
}

export function defaultDateRange(days = 7): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - (days - 1));
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}
