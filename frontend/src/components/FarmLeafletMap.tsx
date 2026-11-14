import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { computePolygonAreaHectares, getPolygonCenter } from '../data/agronomyData';
import { Check, Layers, MapPin, Move, PenTool, RotateCcw } from 'lucide-react';

export interface UnifiedFieldOverlay {
  cropName: string;
  cropColor: string;
  stageLabel?: string;
  topBadge?: string;
  bottomMetric?: string;
  moisturePct?: number;
  ndvi?: number;
  soilRichnessScore?: number;
  chemicalReductionPct?: number;
}

interface FarmLeafletMapProps {
  mode: 'onboarding' | 'dashboard' | 'history' | 'rotation-lab';
  center: [number, number];
  boundary: [number, number][];
  heightClass?: string;
  fieldOverlay?: UnifiedFieldOverlay;
  overlayMode?: 'crop' | 'moisture' | 'health';
  onChangeLocation?: (lat: number, lng: number) => void;
  onChangeBoundary?: (newBoundary: [number, number][]) => void;
}

function getMoistureShade(moisturePct: number): string {
  if (moisturePct >= 68) return '#0A6E8A';
  if (moisturePct >= 50) return '#1696A8';
  if (moisturePct >= 35) return '#44BE7E';
  return '#EBB40E';
}

function getHealthShade(ndvi: number): string {
  if (ndvi >= 0.72) return '#00873A';
  if (ndvi >= 0.6) return '#44BE7E';
  if (ndvi >= 0.5) return '#92D500';
  return '#EBB40E';
}

export const FarmLeafletMap: React.FC<FarmLeafletMapProps> = ({
  mode,
  center,
  boundary,
  heightClass = 'h-[390px]',
  fieldOverlay,
  overlayMode = 'crop',
  onChangeLocation,
  onChangeBoundary,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const overlayGroupRef = useRef<L.LayerGroup | null>(null);
  const lastRegionKeyRef = useRef<string>('');
  const isDraggingRef = useRef<boolean>(false);

  const [basemap, setBasemap] = useState<'satellite' | 'street'>('satellite');
  const [toolMode, setToolMode] = useState<'resize' | 'pin' | 'draw'>('resize');
  const [draftPoints, setDraftPoints] = useState<[number, number][]>([]);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom: 15,
      zoomControl: false,
      scrollWheelZoom: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    const group = L.layerGroup().addTo(map);
    overlayGroupRef.current = group;
    mapRef.current = map;

    const resizeObs = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObs.observe(containerRef.current);

    return () => {
      resizeObs.disconnect();
      map.remove();
      mapRef.current = null;
      overlayGroupRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  // Switch tile basemap cleanly
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const url =
      basemap === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution =
      basemap === 'satellite'
        ? 'Satellite &copy; Esri · NASA POWER Linked'
        : '&copy; OpenStreetMap · Tadawol Global';

    tileLayerRef.current = L.tileLayer(url, { maxZoom: 19, attribution }).addTo(map);
  }, [basemap]);

  // Onboarding click handler (relocate or draw custom field boundary)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mode !== 'onboarding') return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      const lat = Number(e.latlng.lat.toFixed(6));
      const lng = Number(e.latlng.lng.toFixed(6));
      if (toolMode === 'pin') {
        onChangeLocation?.(lat, lng);
      } else if (toolMode === 'draw') {
        setDraftPoints((prev) => [...prev, [lat, lng] as [number, number]]);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [mode, toolMode, onChangeLocation]);

  // Draw unified single-surface field overlays
  useEffect(() => {
    const map = mapRef.current;
    const group = overlayGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const areaKey = computePolygonAreaHectares(boundary).toFixed(1);
    const regionKey = `${center[0].toFixed(3)},${center[1].toFixed(3)},${areaKey}`;
    if (!isDraggingRef.current && lastRegionKeyRef.current !== regionKey && boundary.length >= 3) {
      lastRegionKeyRef.current = regionKey;
      try {
        const bounds = L.latLngBounds(boundary.map(([la, ln]) => L.latLng(la, ln)));
        map.fitBounds(bounds, { padding: [52, 52], maxZoom: 16, animate: true });
      } catch {
        map.setView(center, 15);
      }
    }

    if (mode === 'onboarding') {
      if (boundary.length >= 3) {
        const liveCoords: [number, number][] = boundary.map((p) => [...p] as [number, number]);
        const areaHa = computePolygonAreaHectares(liveCoords);

        const farmPoly = L.polygon(liveCoords, {
          color: '#EBB40E',
          weight: 3.5,
          fillColor: '#00873A',
          fillOpacity: 0.3,
          dashArray: toolMode === 'draw' && draftPoints.length > 0 ? '6 6' : undefined,
        }).addTo(group);

        const polyCenter = getPolygonCenter(liveCoords);
        const areaMarker = L.marker(polyCenter, {
          draggable: toolMode !== 'draw',
          icon: L.divIcon({
            className: 'zone-label-icon',
            html: `<div style="transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:2px;cursor:${toolMode !== 'draw' ? 'grab' : 'default'};">
              <div style="background:rgba(17,17,17,0.92);color:#FFFFFF;font-size:12px;font-weight:800;padding:5px 12px;border-radius:999px;border:2px solid #EBB40E;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,0.34);">
                ${areaHa.toFixed(1)} ha
              </div>
              <div style="background:rgba(255,254,251,0.94);color:#111111;font-size:10px;font-weight:700;padding:1px 7px;border-radius:999px;white-space:nowrap;">
                Your Farm Surface
              </div>
            </div>`,
          }),
        }).addTo(group);

        let dragStartCenter: [number, number] | null = null;
        areaMarker.on('dragstart', () => {
          isDraggingRef.current = true;
          dragStartCenter = [...polyCenter];
        });
        areaMarker.on('drag', (ev) => {
          if (!dragStartCenter) return;
          const pos = (ev.target as L.Marker).getLatLng();
          const dLat = pos.lat - dragStartCenter[0];
          const dLng = pos.lng - dragStartCenter[1];
          const shifted = boundary.map(
            ([la, ln]) => [Number((la + dLat).toFixed(6)), Number((ln + dLng).toFixed(6))] as [number, number]
          );
          farmPoly.setLatLngs(shifted);
        });
        areaMarker.on('dragend', (ev) => {
          if (!dragStartCenter) return;
          const pos = (ev.target as L.Marker).getLatLng();
          const dLat = pos.lat - dragStartCenter[0];
          const dLng = pos.lng - dragStartCenter[1];
          const shifted = boundary.map(
            ([la, ln]) => [Number((la + dLat).toFixed(6)), Number((ln + dLng).toFixed(6))] as [number, number]
          );
          onChangeBoundary?.(shifted);
          setTimeout(() => {
            isDraggingRef.current = false;
          }, 80);
        });

        if (toolMode !== 'draw') {
          liveCoords.forEach((pt, idx) => {
            const cornerMarker = L.marker(pt, {
              draggable: true,
              icon: L.divIcon({
                className: 'zone-label-icon',
                html: `<div style="transform:translate(-50%,-50%);width:18px;height:18px;border-radius:50%;background:#EBB40E;border:3px solid #111111;box-shadow:0 2px 8px rgba(0,0,0,0.4);cursor:nwse-resize;"></div>`,
              }),
            }).addTo(group);

            cornerMarker.bindTooltip('Drag corner to resize', { direction: 'top', offset: [0, -10] });

            cornerMarker.on('dragstart', () => {
              isDraggingRef.current = true;
            });
            cornerMarker.on('drag', (ev) => {
              const pos = (ev.target as L.Marker).getLatLng();
              liveCoords[idx] = [Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6))];
              farmPoly.setLatLngs(liveCoords);

              const updatedArea = computePolygonAreaHectares(liveCoords);
              const updatedCenter = getPolygonCenter(liveCoords);
              areaMarker.setLatLng(updatedCenter);
              areaMarker.setIcon(
                L.divIcon({
                  className: 'zone-label-icon',
                  html: `<div style="transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:2px;">
                    <div style="background:rgba(17,17,17,0.95);color:#92D500;font-size:12px;font-weight:800;padding:5px 12px;border-radius:999px;border:2px solid #EBB40E;white-space:nowrap;">
                      ${updatedArea.toFixed(1)} ha
                    </div>
                  </div>`,
                })
              );
            });
            cornerMarker.on('dragend', () => {
              onChangeBoundary?.(liveCoords.map((c) => [...c] as [number, number]));
              setTimeout(() => {
                isDraggingRef.current = false;
              }, 80);
            });
          });
        }
      }

      if (draftPoints.length > 0) {
        if (draftPoints.length >= 2) {
          L.polyline(draftPoints, { color: '#92D500', weight: 3, dashArray: '6 4' }).addTo(group);
        }
        if (draftPoints.length >= 3) {
          L.polygon(draftPoints, {
            color: '#92D500',
            weight: 2.5,
            fillColor: '#92D500',
            fillOpacity: 0.25,
          }).addTo(group);
        }
        draftPoints.forEach((pt, idx) => {
          L.circleMarker(pt, {
            radius: 6,
            color: '#111111',
            weight: 2,
            fillColor: '#EBB40E',
            fillOpacity: 1,
          })
            .bindTooltip(`Corner ${idx + 1}`, { direction: 'top' })
            .addTo(group);
        });
      }
      return;
    }

    // UNIFIED SINGLE-SURFACE FIELD OVERLAY for Dashboard, History & Rotation Lab (Zero 4-part split!)
    if (boundary.length >= 3) {
      const cropColor = fieldOverlay?.cropColor ?? '#00873A';
      let fillColor = cropColor;
      if (overlayMode === 'moisture' && fieldOverlay?.moisturePct !== undefined) {
        fillColor = getMoistureShade(fieldOverlay.moisturePct);
      } else if (overlayMode === 'health' && fieldOverlay?.ndvi !== undefined) {
        fillColor = getHealthShade(fieldOverlay.ndvi);
      }

      // Outer subtle glow ring for Rotation Lab soil-enrichment visual
      if (mode === 'rotation-lab') {
        L.polygon(boundary, {
          color: '#EBB40E',
          weight: 7,
          opacity: 0.35,
          fillOpacity: 0,
        }).addTo(group);
      }

      // Single unified land surface polygon
      L.polygon(boundary, {
        color: '#FFFFFF',
        weight: 3,
        fillColor,
        fillOpacity: 0.56,
      }).addTo(group);

      const polyCenter = getPolygonCenter(boundary);
      const cropTitle = fieldOverlay?.cropName ?? 'Active Crop';
      const topBadge = fieldOverlay?.topBadge ?? '';
      const subLine =
        fieldOverlay?.bottomMetric ??
        fieldOverlay?.stageLabel ??
        `${computePolygonAreaHectares(boundary).toFixed(1)} ha Unified Field`;

      const centerHtml = `<div style="transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:5px;pointer-events:none;">
        ${
          topBadge
            ? `<div style="background:#EBB40E;color:#111111;font-size:10px;font-weight:800;padding:2.5px 10px;border-radius:999px;border:1.5px solid #111111;letter-spacing:0.04em;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.28);">${topBadge}</div>`
            : ''
        }
        <div style="display:inline-flex;align-items:center;gap:7px;background:rgba(255,254,251,0.97);color:#111111;padding:6px 14px;border-radius:999px;border:2px solid #111111;box-shadow:0 8px 22px rgba(0,0,0,0.28);white-space:nowrap;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:999px;background:${fillColor};border:1px solid rgba(0,0,0,0.2);"></span>
          <span style="font-size:13px;font-weight:800;">${cropTitle}</span>
        </div>
        <div style="background:rgba(17,17,17,0.88);color:#F5F4F0;font-size:11px;font-weight:700;padding:3px 11px;border-radius:999px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.22);">
          ${subLine}
        </div>
      </div>`;

      L.marker(polyCenter, {
        interactive: false,
        icon: L.divIcon({
          className: 'zone-label-icon',
          html: centerHtml,
        }),
      }).addTo(group);
    }
  }, [
    mode,
    center,
    boundary,
    fieldOverlay,
    overlayMode,
    toolMode,
    draftPoints,
    onChangeBoundary,
  ]);

  const finishCustomBoundary = () => {
    if (draftPoints.length >= 3) {
      onChangeBoundary?.(draftPoints);
      setDraftPoints([]);
      setToolMode('resize');
    }
  };

  return (
    <div
      className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-[#D9D9D9] bg-[#E8E6DE]`}
    >
      <div ref={containerRef} className="w-full h-full" />

      {/* Basemap Switcher */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1 bg-[#FFFEFB]/95 backdrop-blur-sm p-1 rounded-full border border-[#D9D9D9] shadow-sm">
        <button
          type="button"
          onClick={() => setBasemap('satellite')}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
            basemap === 'satellite'
              ? 'bg-[#111111] text-white'
              : 'text-[#474747] hover:text-[#111111]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Satellite
        </button>
        <button
          type="button"
          onClick={() => setBasemap('street')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
            basemap === 'street'
              ? 'bg-[#111111] text-white'
              : 'text-[#474747] hover:text-[#111111]'
          }`}
        >
          Map
        </button>
      </div>

      {/* Onboarding Tools */}
      {mode === 'onboarding' && (
        <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-1.5 max-w-[calc(100%-175px)]">
          <div className="inline-flex items-center bg-[#FFFEFB]/95 backdrop-blur-sm p-1 rounded-full border border-[#D9D9D9] shadow-sm">
            <button
              type="button"
              onClick={() => {
                setToolMode('resize');
                setDraftPoints([]);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                toolMode === 'resize'
                  ? 'bg-[#EBB40E] text-[#111111]'
                  : 'text-[#474747] hover:text-[#111111]'
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              Resize Area
            </button>
            <button
              type="button"
              onClick={() => {
                setToolMode('pin');
                setDraftPoints([]);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                toolMode === 'pin'
                  ? 'bg-[#111111] text-white'
                  : 'text-[#474747] hover:text-[#111111]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Drop Pin
            </button>
            <button
              type="button"
              onClick={() => {
                setToolMode('draw');
                setDraftPoints([]);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                toolMode === 'draw'
                  ? 'bg-[#00873A] text-white'
                  : 'text-[#474747] hover:text-[#111111]'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              Draw Shape
            </button>
          </div>

          {toolMode === 'draw' && (
            <div className="inline-flex items-center gap-1.5 bg-[#111111]/90 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow">
              <span>
                {draftPoints.length < 3
                  ? `Click ${3 - draftPoints.length}+ corners`
                  : `${draftPoints.length} corners`}
              </span>
              {draftPoints.length >= 3 && (
                <button
                  type="button"
                  onClick={finishCustomBoundary}
                  className="inline-flex items-center gap-1 bg-[#92D500] text-[#111111] px-2.5 py-0.5 rounded-full font-bold hover:bg-[#EBB40E] transition cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                  Apply
                </button>
              )}
              {draftPoints.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDraftPoints([])}
                  className="p-0.5 text-white/80 hover:text-white cursor-pointer"
                  title="Clear draft"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bottom-left contextual hint */}
      <div className="absolute bottom-3 left-3 z-[400] bg-[#FFFEFB]/95 backdrop-blur-sm border border-[#D9D9D9] rounded-xl px-3 py-1.5 shadow-sm max-w-[310px]">
        {mode === 'onboarding' ? (
          <div className="flex items-center gap-2 text-[11px] font-medium text-[#474747]">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#EBB40E] border border-[#111111] shrink-0" />
            <span>
              {toolMode === 'resize'
                ? 'Drag yellow corners to resize · Drag center label to move'
                : toolMode === 'pin'
                  ? 'Click anywhere on the global map to pin your farm'
                  : 'Click around your land edges to outline your field'}
            </span>
          </div>
        ) : overlayMode === 'moisture' ? (
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#474747]">
              NASA POWER Soil Wetness
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono-tech text-[#474747]">
              <span>Dry</span>
              <div className="h-2 w-28 rounded-full bg-gradient-to-r from-[#EBB40E] via-[#44BE7E] to-[#0A6E8A]" />
              <span>Wet</span>
            </div>
          </div>
        ) : overlayMode === 'health' ? (
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#474747]">
              Crop Health Index (NDVI)
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono-tech text-[#474747]">
              <span>Fair</span>
              <div className="h-2 w-28 rounded-full bg-gradient-to-r from-[#EBB40E] via-[#92D500] to-[#00873A]" />
              <span>Thriving</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#111111]">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: fieldOverlay?.cropColor ?? '#00873A' }}
            />
            <span>Unified single-surface farm view</span>
          </div>
        )}
      </div>
    </div>
  );
};
