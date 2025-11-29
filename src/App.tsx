// src/App.tsx
import React, { useMemo, useState, useRef } from "react";
import IconBar from "./components/IconBar";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import { useStore } from "./store/useStore";
import { v4 as uuidv4 } from "uuid";

export default function App() {
  const [drawing, setDrawing] = useState(false);
  const shapefileInputRef = useRef<HTMLInputElement>(null);

  // Placeholder data (you can load actual points/polygons later)
  const points: any[] = [];
  const polygons: any[] = [];

  const memoPoints = useMemo(() => points, [points]);
  const memoPolygons = useMemo(() => polygons, [polygons]);

  const addAOI = useStore((s) => s.addAOI);
  const clearAOIs = useStore((s) => s.clearAOIs);

  /** -----------------------------
   *  DRAWING HANDLERS
   * ----------------------------- */
  function handleStartDraw() {
    setDrawing((d) => !d);
  }

  function handleCreate(bounds: [number, number][]) {
    const id = uuidv4();
    addAOI({ bounds } as any); // Store adds ID automatically
    setDrawing(false);
  }

  function handleClear() {
    clearAOIs();
  }

  /** -----------------------------
   *  HANDLE SHAPEFILE UPLOAD (.zip)
   * ----------------------------- */
  const handleShapefileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const JSZip = (await import("jszip")).default;
      const shapefile = await import("shapefile");

      const zip = await JSZip.loadAsync(file);

      const shpFile = Object.keys(zip.files).find((f) => f.endsWith(".shp"));
      const dbfFile = Object.keys(zip.files).find((f) => f.endsWith(".dbf"));

      if (!shpFile || !dbfFile) {
        alert("Zip must contain .shp and .dbf files.");
        return;
      }

      const shpBuf = await zip.files[shpFile].async("arraybuffer");
      const dbfBuf = await zip.files[dbfFile].async("arraybuffer");

      const reader = await shapefile.open(shpBuf, dbfBuf);

      const geojson: any = {
        type: "FeatureCollection",
        features: [],
      };

      let result;
      while (!(result = await reader.read()).done) {
        geojson.features.push(result.value);
      }

      addAOI({
        bounds: [],
        geometry: geojson,
        name: file.name.replace(".zip", ""),
      } as any);

      alert("Shapefile uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Error processing shapefile.");
    }
  };

  return (
    <div className="h-screen flex">
      <IconBar />

      {/* Sidebar */}
      <Sidebar
        onStartDraw={handleStartDraw}
        onUpload={() => shapefileInputRef.current?.click()}
        drawing={drawing}
      />

      {/* Hidden File Input for Shapefile Upload */}
      <input
        type="file"
        accept=".zip"
        ref={shapefileInputRef}
        className="hidden"
        onChange={handleShapefileUpload}
      />

      {/* Map View */}
      <div className="flex-1 relative">
        <div className="absolute left-8 top-8 z-20 bg-white/80 p-2 rounded shadow-sm text-sm">
          Drawing: {drawing ? "ON" : "OFF"}
        </div>

        <MapView
          points={memoPoints}
          polygons={memoPolygons}
          drawing={drawing}
          onCreate={handleCreate}
        />
      </div>
    </div>
  );
}
