import diffs from 'virtual:doc-diffs';
import { parseDiffLines, previewDiffLines, type DiffLine } from '@/lib/diff';

export { diffs };

const LINE_STYLES: Record<DiffLine['type'], string> = {
  add: 'bg-green-500/15 text-green-700 dark:text-green-400',
  del: 'bg-red-500/15 text-red-700 dark:text-red-400',
  hunk: 'text-fd-muted-foreground',
  context: 'text-fd-muted-foreground',
};

const LINE_PREFIX: Partial<Record<DiffLine['type'], string>> = {
  add: '+',
  del: '-',
};

function DiffLines({ lines }: { lines: DiffLine[] }) {
  return (
    <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
      <code>
        {lines.map((line, i) => (
          <div key={i} className={`whitespace-pre px-2 ${LINE_STYLES[line.type]}`}>
            {(LINE_PREFIX[line.type] ?? ' ') + line.text}
          </div>
        ))}
      </code>
    </pre>
  );
}

/** Footer "changelog" section for a document page: the latest commit's diff, anchored so it can be linked to. */
export function DocChangelog({ path }: { path: string }) {
  const entry = diffs[path];
  if (!entry) return null;

  const lines = parseDiffLines(entry.diff);
  if (lines.length === 0) return null;

  return (
    <section id="andringar" className="not-prose mt-10 scroll-mt-20 border-t pt-6">
      <h2 className="mb-1 text-lg font-semibold">Ändringar</h2>
      <p className="mb-3 text-sm text-fd-muted-foreground">
        Senaste ändring: {new Date(entry.date).toLocaleString('sv-SE')}
      </p>
      <div className="rounded-lg border">
        <DiffLines lines={lines} />
      </div>
    </section>
  );
}

/** Compact changed-lines preview for a document, used on the dashboard. */
export function DocDiffPreview({ path, limit = 3 }: { path: string; limit?: number }) {
  const entry = diffs[path];
  if (!entry) return null;

  const preview = previewDiffLines(parseDiffLines(entry.diff), limit);
  if (preview.length === 0) return null;

  return (
    <div className="rounded-md border bg-fd-muted/30">
      <DiffLines lines={preview} />
    </div>
  );
}
