declare module 'virtual:doc-diffs' {
  import type { DocDiff } from './doc-diffs';

  const diffs: Record<string, DocDiff | null>;
  export default diffs;
}
