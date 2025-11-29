AOI Selection & Shapefile Upload Web App

This project is an interactive web application built with React + TypeScript + Leaflet, allowing users to:

Search locations

Draw AOIs (Areas of Interest) using rectangles

Upload shapefiles (ZIP) and visualize them on the map

Manage AOIs using global state (Zustand)

Render points, polygons, and marker-based map interactions

📌 Features

🔍 Search bar with location geocoding

🗺️ Map visualization using React Leaflet

📐 Rectangle drawing tool for AOI creation

📤 Upload shapefile (.zip) and convert to GeoJSON

📁 AOI store using Zustand

📌 Auto-fly-to marker when searching

🖼 Polygon & marker rendering

🗺 Map Library Choice
Chosen Library: Leaflet (via React-Leaflet)

Why Leaflet?

Lightweight and fast for vector data

Better performance for drawing tools

Excellent control over layers

No paid API required

Easy integration with shapefile + GeoJSON

Alternatives Considered
Library	Pros	Cons
Mapbox GL JS	High performance, smooth GPU rendering	Paid plans for high-traffic apps
Google Maps JS API	Very familiar UI, great search	Paid API, limited polygon styling
OpenLayers	Very advanced GIS features	More complex to learn
CesiumJS	3D maps	Overkill for 2D AOI drawing

Reason for choosing Leaflet:
→ Best balance of simplicity, flexibility, open-source nature, and excellent community support.

📦 Architecture Decisions
1. Component Structure
src/
 ├── components/
 │    ├── MapView.tsx       # Main map + shapes + drawing
 │    ├── FileUpload.tsx    # Shapefile uploader
 │    └── SearchBar.tsx     # Geocoding + search
 ├── store/
 │    └── useStore.ts       # Zustand global state
 └── utils/
      └── shapefile.ts      # ZIP → GeoJSON conversion

2. Why this architecture?

MapView handles rendering logic only → clean separation

Store centralizes AOIs, markers, search values

Upload & draw flow stays simple

Utilities avoid duplication and keep code clean

3. Zustand for Global State

No boilerplate like Redux

Lightweight and perfect for UI state + data

React-friendly (no context overuse)

⚡ Performance Considerations

The app was designed to scale to thousands of points/polygons.

Techniques used

React-Leaflet avoids re-rendering entire map

Store slices update only necessary components

Minimal DOM nodes — using Leaflet layers instead of React components

Polygons loaded as GeoJSON (fast rendering, avoids memory spike)

No expensive recalculations on pan/zoom

Lazy rendering when uploading shapefile

Future scalability

Cluster markers for 10k+ points

Worker threads for parsing huge shapefiles

Server-side simplification of large polygons (Douglas-Peucker)

🧪 Testing Strategy
Tests performed

✔ Rectangle drawing interaction

✔ Shapefile ZIP parsing

✔ AOI creation + store integration

✔ Marker fly-to behavior

✔ Rendering of polygons on map

✔ Upload validation

With more time, would test

Unit tests for shapefile.ts

E2E tests using Cypress:

Drawing AOIs

Uploading multiple shapefiles

Stress test with 1000+ polygons

Snapshot tests for components

Regression tests for map performance

⚖️ Tradeoffs Made
1. Leaflet over Mapbox

Simpler but lacks GPU rendering → slower for 50k+ points

Chosen to avoid paid services

2. Rectangle-only AOI drawing

Faster to implement

Could be expanded to polygon-drawing mode

3. Client-side shapefile parsing

More convenient

But large Shapefiles should be processed server-side

4. No backend (pure client app)

Ideal for PoC

But production apps need:

database for AOIs

auth

backend validation

🚀 Production Readiness Improvements
To make the project production-grade:

Caching uploaded layers

Server backend (Node/Express or FastAPI)

Auth (JWT / OAuth)

Rate-limited geocoding API

File size validation (max 50MB)

Error analytics + monitoring

Offline support using PWAs

Mobile optimization

Marker clustering for huge datasets

⏱ Time Spent (Estimation)
Task	Time
Project setup (React, Leaflet, Zustand)	1 hr
Map rendering + search	2 hrs
Rectangle drawing tool	2 hrs
Shapefile upload + GeoJSON conversion	3 hrs
Integrating AOI store	1 hr
Rendering polygons/points	1 hr
UI polish + debugging	2 hrs
GitHub setup + documentation	1 hr
Total Estimated Time	13 hrs
📄 License

MIT License — free to use and modify.

👩‍💻 Author

Shravani Palve
GitHub: shravani-palve2004
