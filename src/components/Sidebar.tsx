// src/components/Sidebar.tsx
import React from "react";
import { useStore } from "../store/useStore";
import { geocodeLocation } from "../Utils/geocode";

type SidebarProps = {
  onStartDraw: () => void;
  onUpload: () => void;
  drawing: boolean;
};

export default function Sidebar({ onStartDraw, onUpload, drawing }: SidebarProps) {
  const searchLocation = useStore((s) => s.searchLocation);
  const setSearchLocation = useStore((s) => s.setSearchLocation);
  const setMarkerPosition = useStore((s) => s.setMarkerPosition);
  const aois = useStore((s) => s.aois);

  async function handleSearchClick() {
    if (!searchLocation) {
      alert("Please enter a location to search");
      return;
    }
    const r = await geocodeLocation(searchLocation);
    if (!r) {
      alert("Location not found");
      return;
    }
    setMarkerPosition(r);
  }

  return (
    <aside className="relative w-96 bg-white shadow-2xl z-20 flex-shrink-0 rounded-r-xl">
      <div className="p-6 h-full overflow-y-auto">
        <div className="flex items-center gap-4 border-b pb-4">
          <button className="p-2 text-xl font-bold text-[#d37d3e] hover:bg-gray-100 rounded-full transition">◀</button>
          <h2 className="text-xl font-extrabold text-gray-800">Define Area of Interest</h2>
        </div>

        <p className="mt-6 text-gray-600 text-base">
          Define the geographic areas where you intend to apply your object detection model.
        </p>

        <div className="mt-6 text-sm text-gray-700 font-bold tracking-wider uppercase">Selection Options</div>

        <div className="mt-3 space-y-3">
          <div className="border rounded-xl p-3 bg-[#f4eadf] flex items-center gap-3 shadow-inner">
            <div className="text-xl text-gray-500">🔍</div>
            <input
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="Search for a city, town, region..."
              className="bg-transparent outline-none flex-1 text-gray-700 placeholder-gray-500 text-base"
              onKeyDown={(e) => { if (e.key === "Enter") handleSearchClick(); }}
            />
            <button onClick={handleSearchClick} className="px-3 py-1 rounded bg-[#b66a3a] text-white">Search</button>
          </div>

          <button
            onClick={onUpload}
            className="w-full rounded-xl p-4 bg-gray-100 text-gray-700 text-left font-medium hover:bg-gray-200 transition duration-200 shadow-md"
          >
            📁 Upload a shape file (KML/GeoJSON)
          </button>

          {/* ❌ Removed Apply Current Map View as AOI button */}

          <button
            onClick={onStartDraw}
            className="w-full rounded-xl p-4 text-lg font-semibold bg-[#b66a3a] text-white hover:bg-[#a15e32] shadow-lg"
          >
            {drawing ? "Finish Drawing" : "Draw Area"}
          </button>
        </div>

        <div className="mt-8 border-t pt-4">
          <h4 className="font-extrabold text-gray-800 text-lg">Confirmed Areas ({aois.length})</h4>
          <div className="mt-4 space-y-3 max-h-52 overflow-y-auto pr-2">
            {aois.length === 0 && (
              <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg border border-dashed">
                Start by searching or uploading a shape file to define your first Area of Interest.
              </div>
            )}
            {aois.map((a, index) => (
              <div key={a.id} className="p-3 border rounded-xl bg-white text-sm flex justify-between items-center">
                <span className="font-semibold text-gray-700">AOI #{index + 1}</span>
                <span className="text-xs text-gray-500 ml-4">Added: {new Date(a.createdAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>

          <button className="mt-6 w-full rounded-xl p-4 text-lg font-bold transition duration-200 shadow-xl bg-indigo-700 text-white hover:bg-indigo-800">
            CONFIRM ALL AOIs & PROCEED
          </button>
        </div>
      </div>
    </aside>
  );
}
