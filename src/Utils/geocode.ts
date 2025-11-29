// src/utils/geocode.ts
export async function geocodeLocation(query: string): Promise<{ lat: number; lng: number } | null> {
  if (!query) return null;
  const q = encodeURIComponent(query);
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`;
  try {
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "aoi-app-example/1.0 (you@example.com)" // Nominatim asks for UA/contact
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const item = data[0];
    return { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
  } catch (err) {
    console.error("geocode error", err);
    return null;
  }
}

export default geocodeLocation;
