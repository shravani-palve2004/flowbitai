// src/store/useStore.ts
import create from "zustand";

export type LatLng = { lat: number; lng: number };

export type AOI = {
  id: string;
  bounds: [number, number][];   // for drawn rectangles
  geometry?: any;               // for uploaded shapefile GeoJSON
  name?: string;                // optional label
  createdAt: number;
};

type StoreState = {
  aois: AOI[];
  addAOI: (aoi: Omit<AOI, "createdAt">) => void;
  clearAOIs: () => void;

  searchLocation: string;
  setSearchLocation: (s: string) => void;

  markerPosition: LatLng | null;
  setMarkerPosition: (p: LatLng | null) => void;
};

export const useStore = create<StoreState>((set) => ({
  aois: [],

  addAOI: (aoi) =>
    set((state) => ({
      aois: [
        ...state.aois,
        {
          id: aoi.id || crypto.randomUUID(),
          bounds: aoi.bounds || [],
          geometry: aoi.geometry,
          name: aoi.name,
          createdAt: Date.now(),
        },
      ],
    })),

  clearAOIs: () => set({ aois: [] }),

  searchLocation: "",
  setSearchLocation(s: string) {
    set({ searchLocation: s });
  },

  markerPosition: null,
  setMarkerPosition(p: LatLng | null) {
    set({ markerPosition: p });
  },
}));

export default useStore;
