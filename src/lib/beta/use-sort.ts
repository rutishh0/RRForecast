// V5/src/lib/beta/use-sort.ts
//
// Generic table sort hook. Caller passes the raw row array, an initial sort
// key (optional), and an `accessors` map that turns each row into the
// comparable scalar for that key. The hook returns a memoized sorted array
// plus a stable `toggle(key)` that flips asc → desc → asc on repeated clicks
// of the same column, or jumps to a new column with the default direction.
//
// Why not just sort inline? Because every table in the app needs identical
// click-to-toggle UX with a tri-state visual indicator. Centralising the
// state machine here keeps EnginesTable / ForecastTable / FamilyTable /
// LessorTable behaviourally consistent.

import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

export interface SortState<K extends string> {
  key: K;
  dir: SortDir;
}

export type Accessor<T> = (row: T) => string | number | null | undefined;

export interface UseSortResult<T, K extends string> {
  sorted: T[];
  sort: SortState<K>;
  toggleSort: (key: K) => void;
  /** Helper: returns "asc" | "desc" if active, else null. Useful for chevrons. */
  dirFor: (key: K) => SortDir | null;
}

export function useSort<T, K extends string>(
  rows: T[],
  accessors: Record<K, Accessor<T>>,
  initial: SortState<K>,
): UseSortResult<T, K> {
  const [sort, setSort] = useState<SortState<K>>(initial);

  const sorted = useMemo(() => {
    const acc = accessors[sort.key];
    if (!acc) return rows;
    const dirFactor = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = acc(a);
      const vb = acc(b);
      // null/undefined always sort last regardless of direction
      const aMissing = va == null || va === "";
      const bMissing = vb == null || vb === "";
      if (aMissing && bMissing) return 0;
      if (aMissing) return 1;
      if (bMissing) return -1;
      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * dirFactor;
      }
      return String(va).localeCompare(String(vb)) * dirFactor;
    });
    // accessors object identity is stable within a render — depending on it
    // would force re-sort every render. Key + dir fully describe the sort.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort.key, sort.dir]);

  function toggleSort(key: K) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: defaultDirFor(accessors[key], rows) },
    );
  }

  function dirFor(key: K): SortDir | null {
    return sort.key === key ? sort.dir : null;
  }

  return { sorted, sort, toggleSort, dirFor };
}

// Pick a sensible default direction the first time a column is clicked:
// numeric columns start descending (largest first — what users usually want),
// string columns start ascending (alphabetical).
function defaultDirFor<T>(acc: Accessor<T> | undefined, rows: T[]): SortDir {
  if (!acc) return "asc";
  for (const r of rows) {
    const v = acc(r);
    if (v == null || v === "") continue;
    return typeof v === "number" ? "desc" : "asc";
  }
  return "asc";
}
