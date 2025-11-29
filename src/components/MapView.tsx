// src/components/MapView.tsx
import React, { useEffect, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Rectangle,
  useMapEvents,
  useMap,
  GeoJSON
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useStore } from "../store/useStore";

type Point = { id: string | number; lat: number; lng: number };
type PolygonItem = { id: string; coords: [number, number][] };

const markerIcon = new L.Icon({
  iconUrl: "/marker-icon.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapFlyer() {
  const map = useMap();
  const marker = useStore((s) => s.markerPosition);

  useEffect(() => {
    if (marker && map) {
      map.flyTo([marker.lat, marker.lng], 13, { duration: 1.0 });
    }
  }, [marker, map]);

  return null;
}

function RectangleDrawer({
  drawing,
  onCreate,
}: {
  drawing: boolean;
  onCreate: (bounds: [number, number][]) => void;
}) {
  const map = useMap();
  const [start, setStart] = useState<L.LatLng | null>(null);
  const [tempBounds, setTempBounds] = useState<[number, number][] | null>(null);

  useMapEvents({
    mousedown(e) {
      if (!drawing) return;
      setStart(e.latlng);
      setTempBounds(null);
      map.dragging.disable();
    },
    mousemove(e) {
      if (!drawing || !start) return;
      setTempBounds([
        [start.lat, start.lng],
        [e.latlng.lat, e.latlng.lng],
      ]);
    },
    mouseup(e) {
      if (!drawing || !start) return;
      const end = e.latlng;
      const bounds: [number, number][] = [
        [start.lat, start.lng],
        [end.lat, end.lng],
      ];
      setTempBounds(bounds);
      setStart(null);
      map.dragging.enable();
      onCreate(bounds);
    },
  });

  return tempBounds ? (
    <Rectangle
      bounds={tempBounds as any}
      pathOptions={{ color: "red", weight: 2 }}
    />
  ) : null;
}

export default function MapView({
  points = [],
  polygons = [],
  drawing = false,
  onCreate,
}: {
  points?: Point[];
  polygons?: PolygonItem[];
  drawing?: boolean;
  onCreate: (bounds: [number, number][]) => void;
}) {
  const markerPos = useStore((s) => s.markerPosition);
  const aois = useStore((s) => s.aois); // <-- contains geometry from shapefile

  const center: [number, number] = markerPos
    ? [markerPos.lat, markerPos.lng]
    : [50.96, 6.95];

  return (
    <div className="w-full h-full">
      <MapContainer
        center={center}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        id="map"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapFlyer />
        <RectangleDrawer drawing={drawing} onCreate={onCreate} />

        {markerPos && (
          <Marker
            position={[markerPos.lat, markerPos.lng]}
            icon={markerIcon}
          />
        )}

        {/* Render simple points */}
        {points.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={markerIcon}
          />
        ))}

        {/* Render simple polygon rectangles */}
        {polygons.map((poly) => (
          <Rectangle
            key={poly.id}
            bounds={poly.coords as any}
            pathOptions={{ color: "#b66a3a", fillOpacity: 0.15 }}
          />
        ))}

        {/* ✅ Render uploaded Shapefile GeoJSON */}
        {aois.map(
          (aoi) =>
            aoi.geometry && (
              <GeoJSON
                key={aoi.id}
                data={aoi.geometry}
                style={() => ({
                  color: "#0077ff",
                  weight: 2,
                  fillOpacity: 0.2,
                })}
              />
            )
        )}
      </MapContainer>
    </div>
  );
}
