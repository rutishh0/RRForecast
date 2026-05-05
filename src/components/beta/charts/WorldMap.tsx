// V5/src/components/beta/charts/WorldMap.tsx
//
// Lightweight Leaflet-backed world map with proportional bubble markers.
// Used by OperatorMap (operator hubs) and could be reused for any
// geo-anchored chart. Tile layer uses CartoDB's free Voyager basemap
// which matches the warm-paper aesthetic better than OSM's blue/green.

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  radius: number;
  color: string;
  label: string;
  /** HTML allowed inside Leaflet tooltips. */
  tooltipHtml?: string;
}

const CARTO_VOYAGER = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export function WorldMap({ markers, height = 360 }: { markers: MapMarker[]; height?: number }) {
  // Force Leaflet to recalc size on mount in case the container animates in
  useEffect(() => {
    const id = setTimeout(() => window.dispatchEvent(new Event("resize")), 50);
    return () => clearTimeout(id);
  }, []);

  return (
    <div style={{ height }} className="w-full overflow-hidden">
      <MapContainer
        center={[20, 10]}
        zoom={2}
        minZoom={2}
        maxZoom={6}
        scrollWheelZoom={false}
        worldCopyJump
        style={{ height: "100%", width: "100%", background: "var(--surface-subtle)" }}
        attributionControl={false}
      >
        <TileLayer url={CARTO_VOYAGER} attribution={ATTRIBUTION} />
        {markers.map((m) => (
          <CircleMarker
            key={m.id}
            center={[m.lat, m.lng]}
            radius={m.radius}
            pathOptions={{
              color: m.color,
              fillColor: m.color,
              fillOpacity: 0.55,
              weight: 1.5,
            }}
          >
            <LeafletTooltip direction="top" offset={[0, -m.radius]} opacity={1} sticky>
              {m.tooltipHtml ? (
                <span dangerouslySetInnerHTML={{ __html: m.tooltipHtml }} />
              ) : (
                <span>{m.label}</span>
              )}
            </LeafletTooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
