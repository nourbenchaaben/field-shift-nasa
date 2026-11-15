import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CountryOption, GLOBAL_COUNTRIES } from '../data/countries';
import { WORLD_LAND_POLYGONS } from '../data/worldLandPolygons';

export type CoverageRegionKey =
  | 'all'
  | 'mena'
  | 'europe'
  | 'americas'
  | 'africa'
  | 'asia-pacific';

export const REGION_GROUPS: {
  key: CoverageRegionKey;
  label: string;
  targetLon: number;
  targetLat: number;
  codes: string[];
}[] = [
  {
    key: 'all',
    label: 'All Regions',
    targetLon: 12,
    targetLat: 20,
    codes: GLOBAL_COUNTRIES.map((c) => c.code),
  },
  {
    key: 'mena',
    label: 'MENA & Med',
    targetLon: 16,
    targetLat: 31,
    codes: ['TN', 'MA', 'DZ', 'EG', 'TR', 'JO', 'SA', 'LB', 'ES', 'IT', 'GR', 'PT'],
  },
  {
    key: 'europe',
    label: 'Europe',
    targetLon: 12,
    targetLat: 47,
    codes: ['FR', 'ES', 'IT', 'DE', 'GB', 'NL', 'PT', 'GR', 'PL', 'UA', 'RO'],
  },
  {
    key: 'americas',
    label: 'Americas',
    targetLon: -76,
    targetLat: 12,
    codes: ['US', 'CA', 'MX', 'BR', 'AR', 'CO', 'PE', 'CL'],
  },
  {
    key: 'africa',
    label: 'Africa',
    targetLon: 18,
    targetLat: 4,
    codes: ['TN', 'MA', 'DZ', 'EG', 'KE', 'ET', 'NG', 'GH', 'ZA', 'SN'],
  },
  {
    key: 'asia-pacific',
    label: 'Asia-Pacific',
    targetLon: 108,
    targetLat: 12,
    codes: ['IN', 'PK', 'CN', 'JP', 'VN', 'ID', 'TH', 'AU', 'NZ'],
  },
];

interface GlobalCoverageGlobeProps {
  activeRegion: CoverageRegionKey;
  focusedCountry: CountryOption | null;
  onSelectCountry: (country: CountryOption) => void;
}

type Vec3 = [number, number, number];

// Pre-subdivide land polygon edges once at module load for silky 60fps canvas draws
const SUBDIVIDED_LAND: ReadonlyArray<ReadonlyArray<readonly [number, number]>> =
  WORLD_LAND_POLYGONS.map((ring) => {
    const out: [number, number][] = [];
    for (let i = 0; i < ring.length; i++) {
      const [lon1, lat1] = ring[i];
      const [lon2, lat2] = ring[(i + 1) % ring.length];
      if (Math.abs(lon2 - lon1) > 180) {
        out.push([lon1, lat1]);
        continue;
      }
      const dist = Math.hypot(lon2 - lon1, lat2 - lat1);
      const steps = Math.max(1, Math.floor(dist / 5));
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        out.push([lon1 + (lon2 - lon1) * t, lat1 + (lat2 - lat1) * t]);
      }
    }
    return out;
  });

const DEG = Math.PI / 180;

function project(
  lonDeg: number,
  latDeg: number,
  rotLonDeg: number,
  rotLatDeg: number
): Vec3 {
  const lam = (lonDeg - rotLonDeg) * DEG;
  const phi = latDeg * DEG;
  const phi0 = rotLatDeg * DEG;
  const cphi = Math.cos(phi);
  const sphi = Math.sin(phi);
  const cphi0 = Math.cos(phi0);
  const sphi0 = Math.sin(phi0);
  const clam = Math.cos(lam);

  const x = cphi * Math.sin(lam);
  const y = -(cphi0 * sphi - sphi0 * cphi * clam);
  const z = sphi0 * sphi + cphi0 * cphi * clam;
  return [x, y, z];
}

function clipRingToFrontHemisphere(pts3d: Vec3[]): Vec3[] {
  let anyVisible = false;
  for (let i = 0; i < pts3d.length; i++) {
    if (pts3d[i][2] > 0) {
      anyVisible = true;
      break;
    }
  }
  if (!anyVisible) return [];

  const clipped: Vec3[] = [];
  const n = pts3d.length;
  for (let i = 0; i < n; i++) {
    const a = pts3d[i];
    const b = pts3d[(i + 1) % n];
    const aIn = a[2] >= 0;
    const bIn = b[2] >= 0;
    if (aIn) clipped.push(a);
    if (aIn !== bIn) {
      const t = a[2] / (a[2] - b[2]);
      const ix = a[0] + t * (b[0] - a[0]);
      const iy = a[1] + t * (b[1] - a[1]);
      const norm = Math.hypot(ix, iy) || 1;
      clipped.push([ix / norm, iy / norm, 0]);
    }
  }
  if (clipped.length < 3) return [];

  const refined: Vec3[] = [];
  const m = clipped.length;
  for (let i = 0; i < m; i++) {
    const p = clipped[i];
    const q = clipped[(i + 1) % m];
    refined.push(p);
    if (p[2] === 0 && q[2] === 0) {
      const ang1 = Math.atan2(p[1], p[0]);
      const ang2 = Math.atan2(q[1], q[0]);
      const diff = ((ang2 - ang1 + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      const steps = Math.max(2, Math.floor(Math.abs(diff) / 0.14));
      for (let s = 1; s < steps; s++) {
        const ang = ang1 + (diff * s) / steps;
        refined.push([Math.cos(ang), Math.sin(ang), 0]);
      }
    }
  }
  return refined;
}

function shortestLonDelta(from: number, to: number): number {
  return ((((to - from) % 360) + 540) % 360) - 180;
}

export const GlobalCoverageGlobe: React.FC<GlobalCoverageGlobeProps> = ({
  activeRegion,
  focusedCountry,
  onSelectCountry,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Rotation & interaction refs (updated at 60fps without React re-renders)
  const rotLonRef = useRef<number>(12);
  const rotLatRef = useRef<number>(22);
  const targetRef = useRef<{ lon: number; lat: number } | null>(null);
  const resumeAutoAtRef = useRef<number>(0);
  const draggingRef = useRef<{ active: boolean; x: number; y: number }>({
    active: false,
    x: 0,
    y: 0,
  });
  const hoveredCodeRef = useRef<string | null>(null);
  const projectedPinsRef = useRef<{ country: CountryOption; x: number; y: number; z: number }[]>(
    []
  );

  const [spotlightCountry, setSpotlightCountry] = useState<CountryOption>(GLOBAL_COUNTRIES[0]);
  const [isDragging, setIsDragging] = useState(false);

  const highlightedCodeSet = useMemo(() => {
    const group = REGION_GROUPS.find((r) => r.key === activeRegion) ?? REGION_GROUPS[0];
    return new Set(group.codes);
  }, [activeRegion]);

  const highlightedSetRef = useRef<Set<string>>(highlightedCodeSet);
  highlightedSetRef.current = highlightedCodeSet;

  const focusedCodeRef = useRef<string | null>(focusedCountry?.code ?? null);
  focusedCodeRef.current = focusedCountry?.code ?? null;

  // Smoothly glide globe when user picks a region tab
  useEffect(() => {
    const group = REGION_GROUPS.find((r) => r.key === activeRegion);
    if (!group) return;
    targetRef.current = { lon: group.targetLon, lat: group.targetLat };
    resumeAutoAtRef.current = performance.now() + 2600;
  }, [activeRegion]);

  // Smoothly glide globe when user picks a specific country
  useEffect(() => {
    if (!focusedCountry) return;
    targetRef.current = {
      lon: focusedCountry.lng,
      lat: Math.max(-36, Math.min(44, focusedCountry.lat * 0.65)),
    };
    resumeAutoAtRef.current = performance.now() + 3800;
    setSpotlightCountry(focusedCountry);
  }, [focusedCountry]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();
    let lastSpotlightUpdate = 0;
    let cssSize = 440;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      cssSize = Math.max(260, Math.min(480, Math.round(rect.width)));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssSize * dpr);
      canvas.height = Math.round(cssSize * dpr);
      canvas.style.width = `${cssSize}px`;
      canvas.style.height = `${cssSize}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      // Update rotation: target easing OR continuous gentle rotation
      if (!draggingRef.current.active) {
        if (targetRef.current) {
          const dLon = shortestLonDelta(rotLonRef.current, targetRef.current.lon);
          const dLat = targetRef.current.lat - rotLatRef.current;
          rotLonRef.current += dLon * Math.min(1, dt * 4.5);
          rotLatRef.current += dLat * Math.min(1, dt * 4.5);
          if (Math.abs(dLon) < 0.25 && Math.abs(dLat) < 0.25 && now >= resumeAutoAtRef.current) {
            targetRef.current = null;
          }
        } else if (now >= resumeAutoAtRef.current) {
          rotLonRef.current = ((rotLonRef.current + dt * 9.5 + 180) % 360) - 180;
          // Gently drift latitude tilt back toward a pleasant 18° view
          rotLatRef.current += (18 - rotLatRef.current) * Math.min(1, dt * 0.7);
        }
      }

      const w = cssSize;
      const h = cssSize;
      const cx = w / 2;
      const cy = h / 2;
      const R = w * 0.415;

      ctx.clearRect(0, 0, w, h);

      // Subtle outer atmospheric glow halo
      const halo = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.16);
      halo.addColorStop(0, 'rgba(68, 190, 126, 0.22)');
      halo.addColorStop(0.55, 'rgba(0, 135, 58, 0.08)');
      halo.addColorStop(1, 'rgba(0, 135, 58, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.16, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      // Back half of subtle satellite orbit ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.34);
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 1.13, R * 0.34, 0, Math.PI, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 135, 58, 0.22)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 5]);
      ctx.stroke();
      ctx.restore();

      // Clip interior of Earth sphere
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      // Deep forest-ocean 3D radial shading
      const ocean = ctx.createRadialGradient(
        cx - R * 0.32,
        cy - R * 0.32,
        R * 0.08,
        cx,
        cy,
        R * 1.05
      );
      ocean.addColorStop(0, '#16452E');
      ocean.addColorStop(0.55, '#0C2B1C');
      ocean.addColorStop(1, '#061810');
      ctx.fillStyle = ocean;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

      // Latitude / longitude graticule
      ctx.strokeStyle = 'rgba(68, 190, 126, 0.14)';
      ctx.lineWidth = 0.75;
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let penDown = false;
        for (let lon = -180; lon <= 180; lon += 5) {
          const [x, y, z] = project(lon, lat, rotLonRef.current, rotLatRef.current);
          if (z > 0) {
            const px = cx + x * R;
            const py = cy + y * R;
            if (!penDown) {
              ctx.moveTo(px, py);
              penDown = true;
            } else {
              ctx.lineTo(px, py);
            }
          } else {
            penDown = false;
          }
        }
        ctx.stroke();
      }
      for (let lon = -180; lon < 180; lon += 30) {
        ctx.beginPath();
        let penDown = false;
        for (let lat = -85; lat <= 85; lat += 5) {
          const [x, y, z] = project(lon, lat, rotLonRef.current, rotLatRef.current);
          if (z > 0) {
            const px = cx + x * R;
            const py = cy + y * R;
            if (!penDown) {
              ctx.moveTo(px, py);
              penDown = true;
            } else {
              ctx.lineTo(px, py);
            }
          } else {
            penDown = false;
          }
        }
        ctx.stroke();
      }

      // Landmasses (Natural Earth 110m clipped cleanly to front hemisphere)
      const landGrad = ctx.createRadialGradient(
        cx - R * 0.35,
        cy - R * 0.35,
        R * 0.05,
        cx,
        cy,
        R
      );
      landGrad.addColorStop(0, '#1B9E52');
      landGrad.addColorStop(0.6, '#00873A');
      landGrad.addColorStop(1, '#005C27');

      ctx.fillStyle = landGrad;
      ctx.strokeStyle = 'rgba(146, 213, 0, 0.34)';
      ctx.lineWidth = 0.85;

      for (let pIdx = 0; pIdx < SUBDIVIDED_LAND.length; pIdx++) {
        const ring = SUBDIVIDED_LAND[pIdx];
        const pts3d: Vec3[] = new Array(ring.length);
        for (let i = 0; i < ring.length; i++) {
          pts3d[i] = project(ring[i][0], ring[i][1], rotLonRef.current, rotLatRef.current);
        }
        const clipped = clipRingToFrontHemisphere(pts3d);
        if (clipped.length < 3) continue;

        ctx.beginPath();
        ctx.moveTo(cx + clipped[0][0] * R, cy + clipped[0][1] * R);
        for (let i = 1; i < clipped.length; i++) {
          ctx.lineTo(cx + clipped[i][0] * R, cy + clipped[i][1] * R);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Subtle inner spherical rim vignette for 3D realism
      const rim = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R);
      rim.addColorStop(0, 'rgba(0, 0, 0, 0)');
      rim.addColorStop(0.84, 'rgba(6, 24, 16, 0.25)');
      rim.addColorStop(1, 'rgba(146, 213, 0, 0.22)');
      ctx.fillStyle = rim;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

      // Project & draw covered country markers
      const activeCodes = highlightedSetRef.current;
      const visiblePins: { country: CountryOption; x: number; y: number; z: number }[] = [];
      let bestCenterCountry: CountryOption | null = null;
      let bestCenterZ = -1;

      const pulse = (now % 2200) / 2200;

      for (let i = 0; i < GLOBAL_COUNTRIES.length; i++) {
        const c = GLOBAL_COUNTRIES[i];
        const [x, y, z] = project(c.lng, c.lat, rotLonRef.current, rotLatRef.current);
        if (z <= 0.04) continue;
        const px = cx + x * R;
        const py = cy + y * R;
        visiblePins.push({ country: c, x: px, y: py, z });

        const inRegion = activeCodes.has(c.code);
        if (inRegion && z > bestCenterZ) {
          bestCenterZ = z;
          bestCenterCountry = c;
        }

        const isSelected =
          hoveredCodeRef.current === c.code || focusedCodeRef.current === c.code;

        const alpha = Math.min(1, z * 1.8);

        if (isSelected) {
          // Animated harvest-gold pulse ring
          const ringR = 5 + pulse * 13;
          ctx.beginPath();
          ctx.arc(px, py, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(235, 180, 14, ${(1 - pulse) * 0.9})`;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(px, py, 5.2, 0, Math.PI * 2);
          ctx.fillStyle = '#EBB40E';
          ctx.fill();
          ctx.strokeStyle = '#111111';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (inRegion) {
          // Gentle ambient halo + harvest dot
          ctx.beginPath();
          ctx.arc(px, py, 5.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(146, 213, 0, ${0.24 * alpha})`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(px, py, 2.9, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(235, 180, 14, ${alpha})`;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 254, 251, ${0.35 * alpha})`;
          ctx.fill();
        }
      }

      projectedPinsRef.current = visiblePins;
      ctx.restore();

      // Crisp outer sphere border
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(68, 190, 126, 0.5)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Front half of subtle satellite orbit ring + moving EO satellite node
      const satAngle = (now * 0.00055) % (Math.PI * 2);
      const satInFront = Math.sin(satAngle) >= 0;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.34);
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 1.13, R * 0.34, 0, 0, Math.PI);
      ctx.strokeStyle = 'rgba(0, 135, 58, 0.38)';
      ctx.lineWidth = 1.3;
      ctx.setLineDash([4, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      if (satInFront) {
        const sx = Math.cos(satAngle) * R * 1.13;
        const sy = Math.sin(satAngle) * R * 0.34;
        ctx.beginPath();
        ctx.arc(sx, sy, 6.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(235, 180, 14, 0.28)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = '#EBB40E';
        ctx.fill();
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      // Periodically sync live spotlight pill to whichever country crosses center
      if (
        bestCenterCountry &&
        !hoveredCodeRef.current &&
        !focusedCodeRef.current &&
        now - lastSpotlightUpdate > 550
      ) {
        lastSpotlightUpdate = now;
        setSpotlightCountry((prev) =>
          prev.code === bestCenterCountry!.code ? prev : bestCenterCountry!
        );
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  const findNearestPin = (clientX: number, clientY: number): CountryOption | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    let best: CountryOption | null = null;
    let bestDist = 18;
    for (const pin of projectedPinsRef.current) {
      const d = Math.hypot(pin.x - mx, pin.y - my);
      if (d < bestDist) {
        bestDist = d;
        best = pin.country;
      }
    }
    return best;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = { active: true, x: e.clientX, y: e.clientY };
    targetRef.current = null;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingRef.current.active) {
      const dx = e.clientX - draggingRef.current.x;
      const dy = e.clientY - draggingRef.current.y;
      draggingRef.current.x = e.clientX;
      draggingRef.current.y = e.clientY;
      rotLonRef.current = ((rotLonRef.current - dx * 0.42 + 180) % 360) - 180;
      rotLatRef.current = Math.max(-50, Math.min(55, rotLatRef.current + dy * 0.35));
      return;
    }

    const hit = findNearestPin(e.clientX, e.clientY);
    hoveredCodeRef.current = hit?.code ?? null;
    if (hit) {
      setSpotlightCountry(hit);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingRef.current.active) {
      draggingRef.current.active = false;
      setIsDragging(false);
      resumeAutoAtRef.current = performance.now() + 2400;
    }
    const hit = findNearestPin(e.clientX, e.clientY);
    if (hit) {
      onSelectCountry(hit);
    }
  };

  const handlePointerLeave = () => {
    draggingRef.current.active = false;
    setIsDragging(false);
    hoveredCodeRef.current = null;
  };

  const displayed = focusedCountry ?? spotlightCountry;

  return (
    <div ref={containerRef} className="relative w-full max-w-[460px] mx-auto flex flex-col items-center">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        aria-label="Interactive rotating global coverage globe showing 42 covered farming regions"
        className={`block touch-none select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      />

      {/* Crisp Live Covered-Location Readout Pill */}
      <div className="mt-2 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#111111] text-white text-xs shadow-md border border-[#00873A]/40">
        <span className="w-2 h-2 rounded-full bg-[#92D500] animate-pulse shrink-0" />
        <span className="text-base leading-none">{displayed.flag}</span>
        <span className="font-extrabold">{displayed.name}</span>
        <span className="text-white/40">·</span>
        <span className="text-white/80 font-medium">{displayed.regionHint}</span>
        <span className="hidden sm:inline text-[10px] font-mono-tech text-[#EBB40E] ml-1">
          {displayed.lat.toFixed(1)}°, {displayed.lng.toFixed(1)}°
        </span>
      </div>
    </div>
  );
};
