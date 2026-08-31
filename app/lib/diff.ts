export type DiffLineType = 'add' | 'del' | 'context' | 'hunk';

export interface DiffLine {
  type: DiffLineType;
  text: string;
}

/** Parses a unified diff (as produced by `git diff`) into renderable lines, dropping the file-header noise. */
export function parseDiffLines(diffText: string): DiffLine[] {
  const lines: DiffLine[] = [];

  for (const raw of diffText.split('\n')) {
    if (
      raw.startsWith('diff --git') ||
      raw.startsWith('index ') ||
      raw.startsWith('--- ') ||
      raw.startsWith('+++ ')
    ) {
      continue;
    }

    if (raw.startsWith('@@')) lines.push({ type: 'hunk', text: raw });
    else if (raw.startsWith('+')) lines.push({ type: 'add', text: raw.slice(1) });
    else if (raw.startsWith('-')) lines.push({ type: 'del', text: raw.slice(1) });
    else if (raw.startsWith(' ')) lines.push({ type: 'context', text: raw.slice(1) });
  }

  return lines;
}

/** The first `limit` changed (added/removed) lines, for a compact preview. */
export function previewDiffLines(lines: DiffLine[], limit: number): DiffLine[] {
  return lines.filter((line) => line.type === 'add' || line.type === 'del').slice(0, limit);
}
