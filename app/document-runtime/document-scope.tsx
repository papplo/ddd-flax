import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import type { DateRange } from "@/types/igm";
import { defaultDateRange } from "@/data/sources/mock-igm";

/**
 * Shared, per-document interaction scope (REQUIREMENTS.md §2/§7/§10).
 *
 * A `DateRangeBlock` writes into this scope; other blocks may read from it to
 * stay in sync, or ignore it and manage their own local range instead — both
 * modes are supported, neither is mandatory.
 */
interface DocumentScopeValue {
  range: DateRange;
  setRange: (range: DateRange) => void;
}

const DocumentScopeContext = createContext<DocumentScopeValue | null>(null);

const PARAM_FROM = "from";
const PARAM_TO = "to";

export function DocumentScopeProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const range: DateRange = useMemo(() => {
    const from = searchParams.get(PARAM_FROM);
    const to = searchParams.get(PARAM_TO);
    if (from && to) return { from, to };
    return defaultDateRange();
  }, [searchParams]);

  const setRange = useCallback(
    (next: DateRange) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set(PARAM_FROM, next.from);
          params.set(PARAM_TO, next.to);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const value = useMemo(() => ({ range, setRange }), [range, setRange]);

  return <DocumentScopeContext.Provider value={value}>{children}</DocumentScopeContext.Provider>;
}

/** Reads the shared document scope. Returns `null` when used outside a provider (isolated mode). */
export function useOptionalDocumentScope(): DocumentScopeValue | null {
  return useContext(DocumentScopeContext);
}

/** Reads the shared document scope, throwing if no `DocumentScopeProvider` is present. */
export function useDocumentScope(): DocumentScopeValue {
  const ctx = useContext(DocumentScopeContext);
  if (!ctx) throw new Error("useDocumentScope must be used within a DocumentScopeProvider");
  return ctx;
}
