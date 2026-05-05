// V5/src/components/beta/dashboard/OperatorMap.tsx
//
// Real Leaflet-backed operator hub map. Replaces the earlier placeholder.
// Tally engines per operator hub city; render proportional bubbles.

import { useMemo } from "react";
import type { EngineRecord } from "@/src/lib/beta/types";
import { lookupHub } from "@/src/lib/beta/operator-hubs";
import { WorldMap, type MapMarker } from "../charts/WorldMap";

export function OperatorMap({ engines, height = 360 }: { engines: EngineRecord[]; height?: number }) {
  const markers = useMemo<MapMarker[]>(() => {
    const tally = new Map<string, { count: number; lat: number; lng: number; ops: Set<string>; city: string; country: string }>();
    for (const e of engines) {
      const hub = lookupHub(e.operator);
      if (!hub) continue;
      const key = `${hub.city}-${hub.country}`;
      const cur = tally.get(key) ?? {
        count: 0, lat: hub.coords[0], lng: hub.coords[1], ops: new Set(), city: hub.city, country: hub.country,
      };
      cur.count += 1;
      cur.ops.add(e.operator);
      tally.set(key, cur);
    }

    return Array.from(tally.values()).map((info) => {
      const radius = Math.max(5, Math.min(22, 5 + Math.sqrt(info.count) * 2.4));
      const opsList = Array.from(info.ops).slice(0, 4).join(", ");
      return {
        id: `${info.city}-${info.country}`,
        lat: info.lat,
        lng: info.lng,
        radius,
        color: "#0e3a5f",
        label: info.city,
        tooltipHtml: `
          <div style="min-width: 150px; line-height: 1.4;">
            <div style="font-weight: 600; color: #0f172a; font-size: 12px;">${info.city}, ${info.country}</div>
            <div style="color: #6b6f78; font-size: 11px;">${info.count} engine${info.count === 1 ? "" : "s"} · ${info.ops.size} operator${info.ops.size === 1 ? "" : "s"}</div>
            <div style="color: #6b6f78; font-size: 11px; margin-top: 2px;">${opsList}</div>
          </div>
        `,
      } satisfies MapMarker;
    });
  }, [engines]);

  return <WorldMap markers={markers} height={height} />;
}
