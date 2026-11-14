import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  computePolygonAreaHectares,
  CROPS,
  getPolygonCenter,
  subdivideBoundaryInto4Zones,
  ZONE_IDS,
} from '../data/agronomyData';
import { ZoneDiff, ZoneId } from '../types/farm';
import { Layers, MapPin, PenTool, RotateCcw, Check, Move } from 'lucide-react';

export interface MapZoneDisplay {
  zoneId: ZoneId;
  cropId: string;
  ndvi: number;
  soilMoisturePct: number;
  nitrogenKgHa?: number;
  healthScore?: number;
  yieldTha?: number;
  subtitle?: string;
}

interface FarmLeafletMapProps {
  mode: 'onboarding' | 'dashboard' | 'history' | 'rotation-lab';
  center: [number, number];
  boundary: [number, number][];
  heightClass?: string;
  zones?: Record<ZoneId, MapZoneDisplay>;
  overlayMode?: 'strategy' | 'ndvi' | 'moisture';
  selectedZone?: ZoneId | null;
  onSelectZone?: (zoneId: ZoneId) => void;
  pendingDiffs?: ZoneDiff[];
  // Onboarding callbacks
  onChangeLocation?: (lat: number, lng: number) => void;
  onChangeBoundary?: (newBoundary: [number, number][]) => void;
}

function getNdviColor(ndvi: number): string {
  if (ndvi >= 0.78) return '#00873A';
  if (ndvi >= 0.7) return '#39A958';
  if (ndvi >= 0.62) return '#92D500';
  if (ndvi >= 0.55) return '#EBB40E';
  return '#D96B27';
}

function getMoistureColor(moisturePct: number): string {
  if (moisturePct >= 38) return '#0A6E8A';
  if (moisturePct >= 31) return '#1696A8';
  if (moisturePct >= 25) return '#44BE7E';
  return '#EBB40E';
}

export const FarmLeafletMap: React.FC<FarmLeafletMapProps> = ({
  mode,
  center,
  boundary,
  heightClass = 'h-[400px]',
  zones,
  overlayMode = 'strategy',
  selectedZone = null,
  onSelectZone,
  pendingDiffs = [],
  onChangeLocation,
  onChangeBoundary,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const overlayGroupRef = useRef<L.LayerGroup | null>(null);
  const lastFitRegionRef = useRef<string>('');
  const isDraggingHandleRef = useRef<boolean>(false);

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
        ? 'Imagery &copy; Esri · NASA SMAP Overlay'
        : '&copy; OpenStreetMap · Tadawol GIS';

    const layer = L.tileLayer(url, {
      maxZoom: 19,
      attribution,
    }).addTo(map);

    tileLayerRef.current = layer;
  }, [basemap]);

  // Handle onboarding map click events (relocate pin or draw custom boundary corners)
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

  // Sync map overlays
  useEffect(() => {
    const map = mapRef.current;
    const group = overlayGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // Fit viewport smoothly only when center moves meaningfully (not during corner handle drags!)
    const regionKey = `${center[0].toFixed(2)},${center[1].toFixed(2)}`;
    if (!isDraggingHandleRef.current && lastFitRegionRef.current !== regionKey && boundary.length >= 3) {
      lastFitRegionRef.current = regionKey;
      try {
        const bounds = L.latLngBounds(boundary.map(([la, ln]) => L.latLng(la, ln)));
        map.fitBounds(bounds, { padding: [52, 52], maxZoom: 16, animate: true });
      } catch {
        map.setView(center, 15);
      }
    }

    if (mode === 'onboarding') {
      // Single unified farm area boundary — NO 4-part S1–S4 subdivision during registration!
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

        // Centered unified Farm Area badge (draggable in resize/pin mode to move whole parcel!)
        const polyCenter = getPolygonCenter(liveCoords);
        const areaMarker = L.marker(polyCenter, {
          draggable: toolMode !== 'draw',
          icon: L.divIcon({
            className: 'zone-label-icon',
            html: `<div style="transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:2px;cursor:${toolMode !== 'draw' ? 'grab' : 'default'};">
              <div style="background:rgba(17,17,17,0.92);color:#FFFFFF;font-size:12px;font-weight:800;padding:5px 12px;border-radius:999px;border:2px solid #EBB40E;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,0.34);">
                ${areaHa.toFixed(1)} ha
              </div>
              <div style="background:rgba(255,254,251,0.92);color:#111111;font-size:10px;font-weight:700;padding:1px 7px;border-radius:999px;white-space:nowrap;">
                Farm Area
              </div>
            </div>`,
          }),
        }).addTo(group);

        // Allow dragging the center badge to shift the entire farm parcel while preserving area & shape
        let dragStartCenter: [number, number] | null = null;
        areaMarker.on('dragstart', () => {
          isDraggingHandleRef.current = true;
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
            isDraggingHandleRef.current = false;
          }, 80);
        });

        // Draggable Corner Resize Handles so farmer can directly resize/reshape the farm on the map!
        if (toolMode !== 'draw') {
          liveCoords.forEach((pt, idx) => {
            const cornerMarker = L.marker(pt, {
              draggable: true,
              icon: L.divIcon({
                className: 'zone-label-icon',
                html: `<div style="transform:translate(-50%,-50%);width:18px;height:18px;border-radius:50%;background:#EBB40E;border:3px solid #111111;box-shadow:0 2px 8px rgba(0,0,0,0.4);cursor:nwse-resize;"></div>`,
              }),
            }).addTo(group);

            cornerMarker.bindTooltip('Drag corner to resize farm', {
              direction: 'top',
              offset: [0, -10],
            });

            cornerMarker.on('dragstart', () => {
              isDraggingHandleRef.current = true;
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
                    <div style="background:rgba(17,17,17,0.95);color:#92D500;font-size:12px;font-weight:800;padding:5px 12px;border-radius:999px;border:2px solid #EBB40E;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,0.34);">
                      ${updatedArea.toFixed(1)} ha
                    </div>
                    <div style="background:rgba(255,254,251,0.92);color:#111111;font-size:10px;font-weight:700;padding:1px 7px;border-radius:999px;white-space:nowrap;">
                      Resizing...
                    </div>
                  </div>`,
                })
              );
            });

            cornerMarker.on('dragend', () => {
              onChangeBoundary?.(liveCoords.map((c) => [...c] as [number, number]));
              setTimeout(() => {
                isDraggingHandleRef.current = false;
              }, 80);
            });
          });
        }
      }

      // Render custom draft drawing vertices when in Draw mode
      if (draftPoints.length > 0) {
        if (draftPoints.length >= 2) {
          L.polyline(draftPoints, {
            color: '#92D500',
            weight: 3,
            dashArray: '6 4',
          }).addTo(group);
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

    // Authenticated modes: dashboard, history, rotation-lab (4-zone S1–S4 overlay)
    if (boundary.length >= 3) {
      L.polygon(boundary, {
        color: '#FFFFFF',
        weight: 2.5,
        opacity: 0.9,
        fillOpacity: 0,
      }).addTo(group);

      const quads = subdivideBoundaryInto4Zones(boundary);

      ZONE_IDS.forEach((zoneId) => {
        const zData = zones?.[zoneId];
        if (!zData) return;
        const crop = CROPS[zData.cropId] ?? CROPS.durum_wheat;
        const diff = pendingDiffs.find((d) => d.zoneId === zoneId);
        const proposedCrop = diff ? CROPS[diff.toCropId] : null;
        const isSelected = selectedZone === zoneId;

        let fillColor = crop.color;
        if (overlayMode === 'ndvi') fillColor = getNdviColor(zData.ndvi);
        if (overlayMode === 'moisture') fillColor = getMoistureColor(zData.soilMoisturePct);
        if (mode === 'rotation-lab' && proposedCrop) fillColor = proposedCrop.color;

        const poly = L.polygon(quads[zoneId], {
          color: diff ? '#EBB40E' : isSelected ? '#111111' : '#FFFFFF',
          weight: diff ? 4 : isSelected ? 3.5 : 2,
          dashArray: diff ? '7 5' : undefined,
          fillColor,
          fillOpacity: isSelected ? 0.68 : diff ? 0.62 : 0.54,
        }).addTo(group);

        poly.on('click', () => {
          onSelectZone?.(zoneId);
        });

        poly.on('mouseover', () => {
          poly.setStyle({ fillOpacity: 0.74 });
        });
        poly.on('mouseout', () => {
          poly.setStyle({ fillOpacity: isSelected ? 0.68 : diff ? 0.62 : 0.54 });
        });

        const metricChip =
          overlayMode === 'ndvi'
            ? `NDVI ${zData.ndvi.toFixed(2)}`
            : overlayMode === 'moisture'
              ? `SMAP ${zData.soilMoisturePct}%`
              : mode === 'history' && zData.yieldTha !== undefined
                ? `${zData.yieldTha} t/ha`
                : zData.healthScore !== undefined
                  ? `Health ${zData.healthScore}%`
                  : `NDVI ${zData.ndvi.toFixed(2)}`;

        const qCenter = getPolygonCenter(quads[zoneId]);
        const labelHtml =
          diff && proposedCrop
            ? `<div style="transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;">
               <div style="background:#EBB40E;color:#111111;font-size:10px;font-weight:800;padding:2px 8px;border-radius:999px;border:1.5px solid #111111;letter-spacing:0.04em;box-shadow:0 4px 10px rgba(0,0,0,0.28);white-space:nowrap;">
                 ${zoneId} · PROPOSED
               </div>
               <div style="background:rgba(17,17,17,0.92);color:#FFFFFF;font-size:11px;font-weight:700;padding:4px 9px;border-radius:8px;border:1px solid #EBB40E;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.3);">
                 ${proposedCrop.name}
               </div>
             </div>`
            : `<div style="transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;">
               <div style="display:inline-flex;align-items:center;gap:5px;background:${isSelected ? '#111111' : 'rgba(255,254,251,0.95)'};color:${isSelected ? '#FFFFFF' : '#111111'};padding:4px 10px;border-radius:999px;border:1.5px solid ${isSelected ? '#EBB40E' : 'rgba(17,17,17,0.2)'};box-shadow:0 4px 12px rgba(0,0,0,0.24);white-space:nowrap;">
                 <span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${fillColor};"></span>
                 <span style="font-size:11px;font-weight:800;">${zoneId}</span>
                 <span style="font-size:11px;font-weight:600;">${crop.name}</span>
               </div>
               <div style="background:rgba(17,17,17,0.78);color:#F5F4F0;font-size:10px;font-weight:600;padding:1.5px 7px;border-radius:999px;white-space:nowrap;">
                 ${metricChip}
               </div>
             </div>`;

        const labelMarker = L.marker(qCenter, {
          icon: L.divIcon({
            className: 'zone-label-icon',
            html: labelHtml,
          }),
        }).addTo(group);

        labelMarker.on('click', () => {
          onSelectZone?.(zoneId);
        });
      });
    }
  }, [
    mode,
    center,
    boundary,
    zones,
    overlayMode,
    selectedZone,
    pendingDiffs,
    toolMode,
    draftPoints,
    onSelectZone,
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

      {/* Top-right basemap switcher */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5 bg-[#FFFEFB]/95 backdrop-blur-sm p-1 rounded-full border border-[#D9D9D9] shadow-sm">
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

      {/* Onboarding single-parcel resize & outline tools (top-left) */}
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
              Relocate
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
                  title="Clear draft corners"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Helpful bottom-left hint bar */}
      {mode === 'onboarding' ? (
        <div className="absolute bottom-3 left-3 z-[400] bg-[#FFFEFB]/95 backdrop-blur-sm border border-[#D9D9D9] rounded-xl px-3 py-1.5 shadow-sm max-w-[300px]">
          <div className="flex items-center gap-2 text-[11px] font-medium text-[#474747]">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#EBB40E] border border-[#111111] shrink-0" />
            <span>
              {toolMode === 'resize'
                ? 'Drag yellow corners to resize · Drag center label to move'
                : toolMode === 'pin'
                  ? 'Click anywhere on map to relocate farm parcel'
                  : 'Click points around your farm perimeter to draw custom area'}
            </span>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-3 left-3 z-[400] bg-[#FFFEFB]/95 backdrop-blur-sm border border-[#D9D9D9] rounded-xl px-3 py-2 shadow-sm max-w-[260px]">
          {overlayMode === 'ndvi' ? (
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#474747]">
                NASA NDVI Vegetation Index
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono-tech text-[#474747]">
                <span>0.50</span>
                <div className="h-2 flex-1 rounded-full bg-gradient-to-r from-[#D96B27] via-[#EBB40E] via-[#92D500] to-[#00873A]" />
                <span>0.88</span>
              </div>
            </div>
          ) : overlayMode === 'moisture' ? (
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#474747]">
                NASA SMAP Root-Zone Moisture
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono-tech text-[#474747]">
                <span>18%</span>
                <div className="h-2 flex-1 rounded-full bg-gradient-to-r from-[#EBB40E] via-[#44BE7E] via-[#1696A8] to-[#0A6E8A]" />
                <span>45%</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] font-medium text-[#474747]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#00873A]" />
              <span>Click any quadrant (S1–S4) to inspect live metrics</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
