// V5/src/pages/beta/EnginesPage.tsx
//
// Beta replacement for ShopVisitTracker — a clean filterable engines table.
import { useMemo } from "react";
import { useAppData } from "@/src/context/AppDataContext";
import { toEngineRecords } from "@/src/lib/beta/adapters";
import { PageShell } from "@/src/components/beta/PageShell";
import { EnginesTable } from "@/src/components/beta/engines/EnginesTable";

export default function BetaEnginesPage() {
  const { shopVisits, forecasts } = useAppData();
  const engines = useMemo(
    () => toEngineRecords(shopVisits as never, forecasts as never),
    [shopVisits, forecasts],
  );

  if (engines.length === 0) {
    return (
      <PageShell title="Shop Visits" description="Active engine shop-visit pipeline.">
        <div className="rounded-lg border border-dashed border-border bg-surface-muted px-6 py-16 text-center">
          <p className="text-[13px] text-muted-foreground">
            No engine data loaded yet. Click <span className="font-semibold text-foreground">Upload</span> in the
            top bar to import the latest workbook.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Shop Visits"
      description="Active engine shop-visit pipeline — filter by family, stage, or free-text search."
    >
      <EnginesTable engines={engines} />
    </PageShell>
  );
}
