import type { Route } from './+types/home';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { Link } from 'react-router';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';
import { appName } from '@/lib/shared';
import type { Folder } from 'fumadocs-core/page-tree';
import { useEffect, useState } from 'react';
import { DocDiffPreview } from '@/components/doc-diff';

export function meta({}: Route.MetaArgs) {
  return [
    { title: appName },
    { name: 'description', content: 'Dokumentdriven analysplattform.' },
  ];
}

function isFolder(node: { type: string }): node is Folder {
  return node.type === 'folder';
}

interface RecentEntry {
  url: string;
  path: string;
  title: string;
  date: Date;
}

/** `lastModified` lives behind the async collection's `load()`, not on `getPages()` directly. */
function useRecentlyUpdated(limit = 5): { entries: RecentEntry[]; loading: boolean } {
  const [entries, setEntries] = useState<RecentEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      source.getPages().map(async (page) => {
        const loaded = await page.data.load();
        const lastModified = (loaded as { lastModified?: Date | string }).lastModified;
        const date = lastModified ? new Date(lastModified) : null;
        return { url: page.url, path: page.path, title: page.data.title, date };
      }),
    ).then((results) => {
      if (cancelled) return;
      const sorted = results
        .filter((r): r is RecentEntry => r.date !== null && !Number.isNaN(r.date.getTime()))
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, limit);
      setEntries(sorted);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { entries, loading };
}

export default function Home() {
  const tree = source.getPageTree();
  const domains = tree.children.filter(isFolder);
  const { entries: recent, loading } = useRecentlyUpdated();

  return (
    <HomeLayout {...baseOptions()}>
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <h1 className="mb-1 text-2xl font-bold">{appName}</h1>
        <p className="mb-8 text-fd-muted-foreground">Dokumentdriven analysplattform.</p>

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fd-muted-foreground">
            Domäner
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {domains.map((domain) => {
              const href = domain.index?.url ?? (domain.children.find((c) => c.type === 'page') as { url?: string } | undefined)?.url ?? '/docs';
              return (
                <Link
                  key={href}
                  to={href}
                  className="rounded-lg border p-4 transition-colors hover:bg-fd-accent"
                >
                  <div className="font-medium">{domain.name}</div>
                  {domain.description ? (
                    <div className="mt-1 text-sm text-fd-muted-foreground">{domain.description}</div>
                  ) : null}
                </Link>
              );
            })}
            {domains.length === 0 ? (
              <p className="text-sm text-fd-muted-foreground">Inga domäner ännu.</p>
            ) : null}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fd-muted-foreground">
            Senast uppdaterade dokument
          </h2>
          <ul className="divide-y rounded-lg border">
            {loading ? (
              <li className="p-3 text-sm text-fd-muted-foreground">Laddar…</li>
            ) : (
              <>
                {recent.map((entry) => (
                  <li key={entry.url}>
                    <Link to={`${entry.url}#andringar`} className="block p-3 transition-colors hover:bg-fd-accent">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span>{entry.title}</span>
                        <span className="shrink-0 text-fd-muted-foreground">
                          {entry.date.toLocaleDateString('sv-SE')}
                        </span>
                      </div>
                      <div className="mt-2">
                        <DocDiffPreview path={entry.path} />
                      </div>
                    </Link>
                  </li>
                ))}
                {recent.length === 0 ? (
                  <li className="p-3 text-sm text-fd-muted-foreground">Inga dokument ännu.</li>
                ) : null}
              </>
            )}
          </ul>
        </section>
      </div>
    </HomeLayout>
  );
}
