import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { fumadocsMdx } from 'fumadocs-mdx/vite';
import { docDiffs } from './vite-plugins/doc-diffs.ts';

export default defineConfig({
  plugins: [fumadocsMdx(), docDiffs({ dir: 'docs' }), tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
});
