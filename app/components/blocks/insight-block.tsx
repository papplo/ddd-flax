import type { ReactNode } from "react";
import { Callout } from "fumadocs-ui/components/callout";

export interface InsightBlockProps {
  title?: ReactNode;
  children: ReactNode;
}

/** A conclusion/finding drawn from the data above. */
export function InsightBlock({ title, children }: InsightBlockProps) {
  return (
    <Callout type="idea" title={title}>
      {children}
    </Callout>
  );
}

/** A caveat, limitation, or data-quality concern the reader should know about. */
export function WarningBlock({ title, children }: InsightBlockProps) {
  return (
    <Callout type="warning" title={title}>
      {children}
    </Callout>
  );
}
