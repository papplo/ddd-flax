import { loader } from 'fumadocs-core/source';
import { defineDocs } from 'fumadocs-mdx/macro';
import { docsContentRoute, docsRoute } from './shared';

export const docs = defineDocs({
  dir: 'docs',
  docs: {
    async: true,
    postprocess: {
      includeProcessedMarkdown: true,
    },
    // Drives "recently updated" on the dashboard (REQUIREMENTS.md §4), from
    // git history at build time. Requires `git`; on a repo with no commits
    // yet this resolves to no dates, so the dashboard section shows empty
    // until the repo has git history. (A custom fs.stat-based function was
    // tried first, but even though it only needs to run at build time, this
    // module is also imported by client-rendered routes — bundling that
    // closure pulled `node:fs/promises` into the browser bundle and broke
    // the SPA build. `true` stays server/build-side only.)
    lastModified: true,
  },
});

export const source = loader({
  source: docs.toFumadocsSource(),
  baseUrl: docsRoute,
});

export function getPageMarkdownUrl(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'content.md'];

  return {
    segments,
    url: '/' + [page.locale, ...docsContentRoute.split('/'), ...segments].filter(Boolean).join('/'),
  };
}

export async function getLLMText(page: (typeof source)['$inferPage']) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})

${processed}`;
}
