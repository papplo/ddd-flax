import type { Plugin } from 'vite';
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';

const VIRTUAL_ID = 'virtual:doc-diffs';
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID;

/** Git's well-known empty-tree hash — diffing against it shows a brand-new file as fully added. */
const EMPTY_TREE_HASH = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';

export interface DocDiff {
  hash: string;
  date: string;
  diff: string;
}

function git(args: string[], cwd: string): string {
  return execFileSync('git', args, { cwd, encoding: 'utf-8' });
}

function findRepoRoot(cwd: string): string | null {
  try {
    return git(['rev-parse', '--show-toplevel'], cwd).trim();
  } catch {
    return null;
  }
}

function findMdxFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.mdx'))
    .map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name)));
}

/** Latest commit's diff for one file, relative to the previous commit that touched it (or the empty tree, if it's new). */
function getLatestDiff(repoRoot: string, relPathFromRepoRoot: string): DocDiff | null {
  try {
    const log = git(['log', '--format=%H %aI', '--', relPathFromRepoRoot], repoRoot).trim();
    if (!log) return null;

    const [latestLine, previousLine] = log.split('\n');
    const [hash, ...dateParts] = latestLine.split(' ');
    const date = dateParts.join(' ');
    const base = previousLine ? previousLine.split(' ')[0] : EMPTY_TREE_HASH;

    const diff = git(['diff', base, hash, '--', relPathFromRepoRoot], repoRoot);
    return { hash, date, diff };
  } catch {
    return null;
  }
}

/**
 * Exposes `virtual:doc-diffs` — a build-time-computed map of each `.mdx`
 * file (path relative to `dir`, matching Fumadocs' `page.path`) to its most
 * recent commit's diff. Runs `git log`/`git diff` only inside this plugin's
 * `load()` hook (Vite/Node side), so nothing git-related ends up in the
 * client bundle — same constraint that broke the fs.stat-based
 * `lastModified` attempt in app/lib/source.ts.
 */
export function docDiffs(options: { dir: string }): Plugin {
  return {
    name: 'doc-diffs',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) return;

      const repoRoot = findRepoRoot(process.cwd());
      const absDir = path.resolve(process.cwd(), options.dir);
      const result: Record<string, DocDiff | null> = {};

      if (repoRoot) {
        for (const file of findMdxFiles(absDir)) {
          const relFromRepoRoot = path.relative(repoRoot, path.join(absDir, file));
          result[file] = getLatestDiff(repoRoot, relFromRepoRoot);
        }
      }

      return `export default ${JSON.stringify(result)};`;
    },
  };
}
