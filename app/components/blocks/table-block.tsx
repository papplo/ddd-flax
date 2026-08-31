import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchMockIgmSeries, defaultDateRange } from "@/data/sources/mock-igm";
import { igmPointTimestamp } from "@/data/transforms/igm";
import { useOptionalDocumentScope } from "@/document-runtime/document-scope";
import type { DateRange, IgmDataPoint } from "@/types/igm";

export interface TableBlockProps {
  igm: string;
  prop: string;
  label?: string;
  from?: string;
  to?: string;
  /** Max rows to display. Default: 50 (most recent). */
  limit?: number;
}

export function TableBlock({ igm, prop, label, from, to, limit = 50 }: TableBlockProps) {
  const scope = useOptionalDocumentScope();
  const range: DateRange = from && to ? { from, to } : scope?.range ?? defaultDateRange();

  const [points, setPoints] = useState<IgmDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchMockIgmSeries({ igmId: igm, propName: prop, range }).then((series) => {
      if (cancelled) return;
      setPoints(series.points.slice(-limit));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [igm, prop, range.from, range.to, limit]);

  return (
    <div className="not-prose my-4 rounded-lg border">
      <div className="border-b p-3 text-sm font-medium text-fd-muted-foreground">{label ?? prop}</div>
      <div className="max-h-96 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tid</TableHead>
              <TableHead className="text-right">{prop}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-fd-muted-foreground">
                  Laddar…
                </TableCell>
              </TableRow>
            ) : (
              points.map((point) => (
                <TableRow key={`${point.edd}-${point.mtu}`}>
                  <TableCell>{igmPointTimestamp(point).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{point[prop]}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
