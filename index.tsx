import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
// Importing Zustand for global state management
import { create } from "zustand";

// We need to dynamically load the Leaflet library for the map to work correctly.
// The code will assume Leaflet (L) is loaded globally via a script tag.

// -------------------------------------
// 1. UTILITIES & CONFIG
// -------------------------------------

const INITIAL_CENTER: [number, number] = [50.96, 6.95]; // Cologne
const INITIAL_ZOOM: number = 11;
const API_MODEL = "gemini-2.5-flash-preview-09-2025";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent?key=`;

// Simple UUID generator for unique AOI IDs
function uuidv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// -------------------------------------
// 2. STATE MANAGEMENT (Zustand Store)
// -------------------------------------

// Define the structure of an Area of Interest (AOI)
interface AOI {
  id: string;
  bounds: [number, number][]; // Array of LatLng tuples (Latitude, Longitude)
  createdAt: number;
}

interface StoreState {
  aois: AOI[];
  addAOI: (aoi: Omit<AOI, 'id' | 'createdAt'>) => void;
  clearAOIs: () => void;
}

const useStore = create<StoreState>((set) => ({
  aois: [],
  addAOI: (newAoiData) => set((state) => ({ 
    aois: [...state.aois, { ...newAoiData, id: uuidv4(), createdAt: Date.now() }] 
  })),
  clearAOIs: () => set({ aois: [] }),
}));


// -------------------------------------
// 3. MAP COMPONENTS (Using raw Leaflet)
// -------------------------------------

// Component to handle the Leaflet map logic
function MapView({
  polygons = [],
  center,
  zoom,
  markerPosition,
}: {
  polygons?: AOI[];
  center: [number, number];
  zoom: number;
  markerPosition: [number, number] | null;
}) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const polygonLayersRef = useRef<any[]>([]);

    // 1. Load Leaflet CSS and JS if not present
    useEffect(() => {
        // Load CSS
        if (!document.querySelector('link[href="https://unpkg.com/leaflet/dist/leaflet.css"]')) {
            const link = document.createElement('link');
            link.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        // Load JS
        if (typeof (window as any).L === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet/dist/leaflet.js';
            script.onload = initializeMap;
            document.head.appendChild(script);
        } else {
            initializeMap();
        }
    }, []);

    // 2. Map Initialization function
    const initializeMap = () => {
        // Ensure map is not already initialized
        if (mapRef.current && typeof (window as any).L !== 'undefined' && !leafletMapRef.current) {
            const L = (window as any).L;

            // Initialize the map
            const map = L.map(mapRef.current, {
                center: center,
                zoom: zoom,
                scrollWheelZoom: true,
            });

            // Add Tile Layer
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
            }).addTo(map);
            
            leafletMapRef.current = map;

            // Define a custom marker icon (mimicking the React version's style)
            const CustomIcon = L.divIcon({
                className: 'bg-red-600 rounded-full border-2 border-white shadow-xl animate-pulse',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });

            // Initialize empty marker reference
            markerRef.current = L.marker(center, { icon: CustomIcon }).addTo(map).remove();
            
            // Set initial map position
            map.flyTo(center, zoom, { duration: 0.5 });
        }
    };

    // 3. Effect for handling map center updates (flyTo)
    useEffect(() => {
        if (leafletMapRef.current) {
            leafletMapRef.current.flyTo(center, INITIAL_ZOOM, { duration: 1.5 });
        }
    }, [center]);

    // 4. Effect for handling temporary marker position
    useEffect(() => {
        const map = leafletMapRef.current;
        const L = (window as any).L;

        if (map && L) {
            if (markerPosition) {
                // If marker exists, update position and add to map
                markerRef.current.setLatLng(markerPosition);
                markerRef.current.addTo(map);
            } else {
                // If marker is null, remove it from the map
                markerRef.current.remove();
            }
        }
    }, [markerPosition]);

    // 5. Effect for drawing AOI polygons
    useEffect(() => {
        const map = leafletMapRef.current;
        const L = (window as any).L;

        if (map && L) {
            // Clear existing polygons
            polygonLayersRef.current.forEach(layer => map.removeLayer(layer));
            polygonLayersRef.current = [];

            // Draw new polygons
            polygons.forEach(aoi => {
                const polygon = L.polygon(aoi.bounds, {
                    color: '#b66a3a', 
                    weight: 3, 
                    opacity: 0.8, 
                    fillColor: '#d37d3e', 
                    fillOpacity: 0.3
                }).addTo(map);
                polygonLayersRef.current.push(polygon);
            });
        }
    }, [polygons]);


    // CSS for the custom Leaflet marker
    const markerStyle = `
        .bg-red-600 { background-color: #dc2626; }
        .rounded-full { border-radius: 9999px; }
        .border-2 { border-width: 2px; }
        .border-white { border-color: #ffffff; }
        .shadow-xl { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
    `;

    return (
        <div className="relative w-full h-full">
            {/* Inject custom CSS for the marker */}
            <style dangerouslySetInnerHTML={{ __html: markerStyle }} />
            {/* The map container */}
            <div 
                ref={mapRef} 
                style={{ height: "100%", width: "100%" }}
                className="z-10 rounded-l-xl shadow-inner"
                id="leaflet-map-container"
            />
        </div>
    );
}


// -------------------------------------
// 4. SIDEBAR COMPONENTS
// -------------------------------------

// IconBar Component
function IconBar() {
    return (
        <div className="bg-gray-800 w-20 flex flex-col items-center py-6 shadow-xl">
            {/* Logo/Nav Icon */}
            <div className="mb-8 w-12 h-12 flex items-center justify-center bg-gray-600 rounded-xl cursor-pointer hover:bg-gray-700 transition">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
            </div>
            
            {/* Home Icon */}
            <div className="mb-4 w-12 h-12 flex items-center justify-center bg-gray-600 rounded-xl cursor-pointer hover:bg-gray-700 transition">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0v-4a1 1 0 011-1h2a1 1 0 011 1v4m-6 0h6"></path></svg>
            </div>
            
            {/* Grid/AOI Icon (Selected State) */}
            <div className="w-12 h-12 flex items-center justify-center bg-[#d37d3e] rounded-xl cursor-pointer shadow-lg ring-2 ring-white">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
            </div>
        </div>
    );
}

// Sidebar Component
function Sidebar({
  searchQuery,
  onSearchQueryChange,
  onApplyOutline,
  onUpload,
  onSearch,
  isSearching,
}: {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onApplyOutline: () => void;
  onUpload: () => void;
  onSearch: () => void;
  isSearching: boolean;
}) {
  // Select only the aois state from the store
  const aois = useStore((s) => s.aois);

  return (
    <aside className="relative w-96 bg-white shadow-2xl z-20 flex-shrink-0 rounded-r-xl">
      {/* Sidebar Content */}
      <div className="p-6 h-full overflow-y-auto">

        {/* Header */}
        <div className="flex items-center gap-4 border-b pb-4">
          <button className="p-2 text-xl font-bold text-[#d37d3e] hover:bg-gray-100 rounded-full transition">◀</button>
          <h2 className="text-xl font-extrabold text-gray-800">
            Define Area of Interest
          </h2>
        </div>

        {/* Instructions */}
        <p className="mt-6 text-gray-600 text-base">
          Define the geographic areas where you intend to apply your object detection model.
        </p>

        <div className="mt-6 text-sm text-gray-700 font-bold tracking-wider uppercase">Selection Options</div>

        <div className="mt-3 space-y-3">
          {/* Search Input Box */}
          <div className="border rounded-xl p-3 bg-[#f4eadf] flex items-center gap-3 shadow-inner">
            <div className="text-xl text-gray-500">
              {isSearching ? '⏳' : '🔍'}
            </div>
            <input
              placeholder="Search for a city, town, region..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              className="bg-transparent outline-none flex-1 text-gray-700 placeholder-gray-500 text-base"
              disabled={isSearching}
            />
          </div>

          {/* Upload Button */}
          <button
            onClick={onUpload}
            className="w-full rounded-xl p-4 bg-gray-100 text-gray-700 text-left font-medium hover:bg-gray-200 transition duration-200 shadow-md"
          >
            📁 Upload a shape file (KML/GeoJSON)
          </button>
          
          {/* Search & Apply Button */}
          <button
            onClick={onSearch}
            disabled={!searchQuery || isSearching}
            className={`w-full rounded-xl p-4 text-lg font-semibold transition duration-200 shadow-lg
                        ${(searchQuery && !isSearching) ? 'bg-[#b66a3a] text-white hover:bg-[#a15e32]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            {isSearching ? 'Searching...' : 'Search & Zoom to Location'}
          </button>
          
          {/* Apply Outline Button (Visible after successful search) */}
          <button
            onClick={onApplyOutline}
            disabled={isSearching}
            className={`w-full rounded-xl p-4 text-lg font-semibold transition duration-200 shadow-md
                        ${isSearching ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
          >
            Apply Current Map View as AOI
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
              <div
                key={a.id}
                className="p-3 border rounded-xl bg-white text-sm break-words shadow-md flex justify-between items-center"
              >
                <span className="font-semibold text-gray-700">AOI #{index + 1}</span>
                <span className="text-xs text-gray-500 ml-4">
                  Added: {new Date(a.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
          
          <button
            disabled={aois.length === 0}
            className={`mt-6 w-full rounded-xl p-4 text-lg font-bold transition duration-200 shadow-xl
                        ${aois.length > 0 ? 'bg-indigo-700 text-white hover:bg-indigo-800' : 'bg-gray-400 text-gray-600 cursor-not-allowed'}`}
          >
            CONFIRM ALL AOIs & PROCEED
          </button>
        </div>
      </div>
    </aside>
  );
}


// -------------------------------------
// 5. MAIN APP COMPONENT
// -------------------------------------

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number]>(INITIAL_CENTER);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  
  // Destructure functions and state from the store
  const { addAOI, aois } = useStore();

  // --- Geocoding Function using Google Search ---
  const handleSearch = useCallback(async () => {
    if (!searchQuery) return;

    setIsSearching(true);
    setNotification(null);

    const apiKey = ""; 
    const apiUrl = `${API_URL}${apiKey}`;
    const userQuery = `Find the latitude and longitude coordinates for: ${searchQuery}. Respond only with a JSON object.`;
    
    // System instruction for structured geocoding response
    const systemPrompt = "You are a geocoding service. Your task is to accurately find the latitude and longitude of the requested location. Output a single JSON object with 'lat' (number) and 'lng' (number) fields. Do not include any other text or explanation.";

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        tools: [{ "google_search": {} }], 
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
              type: "OBJECT",
              properties: {
                  "lat": { "type": "NUMBER", "description": "The latitude coordinate." },
                  "lng": { "type": "NUMBER", "description": "The longitude coordinate." }
              },
          }
      },
    };

    let responseJson: { lat?: number, lng?: number } | null = null;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const result = await response.json();
            const textPart = result?.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (textPart) {
                // The response should be a JSON string, which we must parse
                responseJson = JSON.parse(textPart);
                break; // Success
            } else {
                throw new Error("No content received from API.");
            }
        } catch (error) {
            retries++;
            if (retries < maxRetries) {
                const delay = Math.pow(2, retries) * 1000;
                await new Promise(res => setTimeout(res, delay));
            } else {
                console.error("Geocoding failed after multiple retries:", error);
                setNotification("Geocoding failed. Please check your connection or refine your search.");
                setMapCenter(INITIAL_CENTER);
                setMarkerPosition(null);
            }
        }
    }

    setIsSearching(false);
    
    if (responseJson && typeof responseJson.lat === 'number' && typeof responseJson.lng === 'number') {
        const newCenter: [number, number] = [responseJson.lat, responseJson.lng];
        
        // 1. Move the map center
        setMapCenter(newCenter);
        // 2. Set the temporary marker position
        setMarkerPosition(newCenter);

        setNotification(`Successfully located: ${searchQuery}`);

        // Clear the marker after 5 seconds
        setTimeout(() => setMarkerPosition(null), 5000);

    } else if (responseJson) {
        setNotification("Location data was incomplete or malformed.");
    }
  }, [searchQuery]);


  // Handler for "Apply Current Map View as AOI"
  const handleApplyOutline = useCallback(() => {
    // We create a fake bounding box (a square) around the current map center
    if (mapCenter) {
        const lat = mapCenter[0];
        const lng = mapCenter[1];
        
        // Defines a simple 0.1 degree by 0.1 degree square around the center
        const fakeBounds: [number, number][] = [
            [lat - 0.05, lng - 0.05], // SW
            [lat + 0.05, lng - 0.05], // NW
            [lat + 0.05, lng + 0.05], // NE
            [lat - 0.05, lng + 0.05], // SE
        ];
        
        // Add the new AOI to the store
        addAOI({ bounds: fakeBounds });
        setNotification(`New AOI defined around the current map center.`);
    }
  }, [mapCenter, addAOI]);

  // Handler for file upload (mock)
  const handleUpload = useCallback(() => {
    setNotification("File upload feature is ready but not implemented in this demo.");
  }, []);

  return (
    <div className="h-screen w-screen flex antialiased">
      
      {/* 1. Icon Bar */}
      <IconBar />

      {/* 2. Sidebar */}
      <Sidebar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={handleSearch}
        onApplyOutline={handleApplyOutline}
        onUpload={handleUpload}
        isSearching={isSearching}
      />

      {/* 3. Map View Container */}
      <div className="flex-1 relative p-4 bg-gray-100">
        
        {/* Notification Box */}
        {notification && (
            <div 
                className="absolute top-8 left-1/2 transform -translate-x-1/2 z-50 p-3 px-6 bg-indigo-700 text-white font-medium rounded-full shadow-2xl text-base transition-opacity duration-300"
                style={{ opacity: notification ? 1 : 0 }}
            >
                {notification}
            </div>
        )}

        {/* Map Component */}
        <MapView
          polygons={aois} // Pass confirmed AOIs to the map layer
          center={mapCenter}
          zoom={INITIAL_ZOOM}
          markerPosition={markerPosition}
        />
      </div>
    </div>
  );
}