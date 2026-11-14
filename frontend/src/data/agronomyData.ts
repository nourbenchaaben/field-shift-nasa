/**
 * Pure field polygon geometry utilities used across Tadawol's unified single-surface maps.
 */

export function buildDefaultBoundary(
  lat: number,
  lng: number,
  halfHeightDeg = 0.0042,
  halfWidthDeg = 0.0056
): [number, number][] {
  return [
    [Number((lat + halfHeightDeg * 1.04).toFixed(6)), Number((lng - halfWidthDeg * 0.96).toFixed(6))],
    [Number((lat + halfHeightDeg * 0.95).toFixed(6)), Number((lng + halfWidthDeg * 1.04).toFixed(6))],
    [Number((lat - halfHeightDeg * 1.02).toFixed(6)), Number((lng + halfWidthDeg * 0.94).toFixed(6))],
    [Number((lat - halfHeightDeg * 0.96).toFixed(6)), Number((lng - halfWidthDeg * 1.03).toFixed(6))],
  ];
}

export function computePolygonAreaHectares(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  const avgLat = coords.reduce((sum, [lat]) => sum + lat, 0) / coords.length;
  const metersPerLat = 111132.92;
  const metersPerLng = 111412.84 * Math.cos((avgLat * Math.PI) / 180);

  let areaSqMeters = 0;
  for (let i = 0; i < coords.length; i++) {
    const [lat1, lng1] = coords[i];
    const [lat2, lng2] = coords[(i + 1) % coords.length];
    const x1 = lng1 * metersPerLng;
    const y1 = lat1 * metersPerLat;
    const x2 = lng2 * metersPerLng;
    const y2 = lat2 * metersPerLat;
    areaSqMeters += x1 * y2 - x2 * y1;
  }
  const hectares = Math.abs(areaSqMeters / 2) / 10000;
  return Math.max(1.5, Number(hectares.toFixed(1)));
}

export function getPolygonCenter(coords: [number, number][]): [number, number] {
  if (coords.length === 0) return [36.8142, 9.8635];
  const avgLat = coords.reduce((s, p) => s + p[0], 0) / coords.length;
  const avgLng = coords.reduce((s, p) => s + p[1], 0) / coords.length;
  return [Number(avgLat.toFixed(6)), Number(avgLng.toFixed(6))];
}

/**
 * Uniformly scales an existing polygon around its centroid to match a target area in hectares.
 */
export function scaleBoundaryToHectares(
  boundary: [number, number][],
  targetHa: number
): [number, number][] {
  if (boundary.length < 3) return boundary;
  const currentHa = computePolygonAreaHectares(boundary);
  if (currentHa <= 0) return boundary;

  const clampedTarget = Math.max(2, Math.min(500, targetHa));
  const scale = Math.sqrt(clampedTarget / currentHa);
  const [cLat, cLng] = getPolygonCenter(boundary);

  return boundary.map(([lat, lng]) => [
    Number((cLat + (lat - cLat) * scale).toFixed(6)),
    Number((cLng + (lng - cLng) * scale).toFixed(6)),
  ]);
}

export function translateBoundary(
  boundary: [number, number][],
  targetLat: number,
  targetLng: number
): [number, number][] {
  const [cLat, cLng] = getPolygonCenter(boundary);
  const dLat = targetLat - cLat;
  const dLng = targetLng - cLng;
  return boundary.map(([lat, lng]) => [
    Number((lat + dLat).toFixed(6)),
    Number((lng + dLng).toFixed(6)),
  ]);
}
