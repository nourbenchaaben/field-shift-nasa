import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { computePolygonAreaHectares, getPolygonCenter } from '../data/agronomyData';
import {
  buildScientificFieldHeatmap,
  FieldPhysics,
  HeatmapResult,
  ScientificLayerType,
} from '../utils/scientificHeatmap';
import { Check, Layers, MapPin, Move, PenTool, RotateCcw } from 'lucide-react';

export interface UnifiedFieldOverlay {
  cropName: string;
  cropColor: string;
  stageLabel?: string;
  topBadge?: string;
  bottomMetric?: string;
  moisturePct?: number;
  ndvi?: number;
  tempC?: number;
  slopeDeg?: number;
  soilRichnessScore?: number;
  chemicalReductionPct?: number;
  scientificLayer?: ScientificLayerType;
  seasonIndex?: number;
  physics?: FieldPhysics;
  /** Concise honest provenance tag (e.g. "NASA POWER baseline" or "Projected seasonal model") */
  sourceNote?: string;
}

interface FarmLeafletMapProps {
  mode: 'onboarding' | 'dashboard' | 'history' | 'rotation-lab';
  center: [number, number];
  boundary: [number, number][];
  heightClass?: string;
  fieldOverlay?: UnifiedFieldOverlay;
  overlayMode?: 'crop' | 'moisture' | 'health' | 'climate' | 'slope';
  onChangeLocation?: (lat: number, lng: number) => void;
  onChangeBoundary?: (newBoundary: [number, number][]) => void;
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
  const labelLayerRef = useRef<L.TileLayer | null>(null);
  const overlayGroupRef = useRef<L.LayerGroup | null>(null);
  const lastRegionKeyRef = useRef<string>('');
  const isDraggingRef = useRef<boolean>(false);

  const [basemap, setBasemap] = useState<'satellite' | 'street'>('satellite');
  const [toolMode, setToolMode] = useState<'resize' | 'pin' | 'draw'>('resize');
  const [draftPoints, setDraftPoints] = useState<[number, number][]>([]);
  const [hoverProbe, setHoverProbe] = useState<{
    valueText: string;
    zoneLabel: string;
    hex: string;
  } | null>(null);

  // Resolve active scientific raster layer for non-onboarding views
  const activeScientificLayer: ScientificLayerType = useMemo(() => {
    if (fieldOverlay?.scientificLayer) return fieldOverlay.scientificLayer;
    if (overlayMode === 'moisture') return 'moisture';
    if (overlayMode === 'climate') return 'climate';
    if (overlayMode === 'slope') return 'slope';
    return 'vitality';
  }, [fieldOverlay?.scientificLayer, overlayMode]);

  // Exact zero-mean calibrated physical target matching live NASA POWER / MODIS / SRTM / Rotation Lab metrics
  const scientificHeatmap: HeatmapResult | null = useMemo(() => {
    if (mode === 'onboarding' || boundary.length < 3) return null;

    let targetPhysicalValue = 0.56;
    if (activeScientificLayer === 'moisture') {
      targetPhysicalValue = fieldOverlay?.moisturePct ?? 45;
    } else if (activeScientificLayer === 'climate') {
      targetPhysicalValue = fieldOverlay?.tempC ?? 18;
    } else if (activeScientificLayer === 'slope') {
      targetPhysicalValue = fieldOverlay?.slopeDeg ?? fieldOverlay?.physics?.slopeDeg ?? 2.0;
    } else if (activeScientificLayer === 'nitrogen') {
      targetPhysicalValue = fieldOverlay?.soilRichnessScore ?? 70;
    } else {
      if (fieldOverlay?.ndvi !== undefined) {
        targetPhysicalValue = fieldOverlay.ndvi;
      } else if (fieldOverlay?.soilRichnessScore !== undefined) {
        targetPhysicalValue = Number(
          Math.min(0.84, Math.max(0.24, 0.22 + (fieldOverlay.soilRichnessScore / 100) * 0.58)).toFixed(2)
        );
      }
    }

    const fieldSeed = Math.abs(center[0] * 17.31 + center[1] * 31.73);
    const seasonPhase = fieldOverlay?.seasonIndex ?? 0;

    return buildScientificFieldHeatmap({
      boundary,
      targetPhysicalValue,
      layer: activeScientificLayer,
      fieldSeed,
      seasonPhase,
      physics: fieldOverlay?.physics,
    });
  }, [
    mode,
    boundary,
    activeScientificLayer,
    fieldOverlay?.moisturePct,
    fieldOverlay?.tempC,
    fieldOverlay?.slopeDeg,
    fieldOverlay?.soilRichnessScore,
    fieldOverlay?.ndvi,
    fieldOverlay?.seasonIndex,
    fieldOverlay?.physics,
    center,
  ]);

  // Attach interactive cursor readout for exact point inspection inside the field polygon
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mode === 'onboarding' || !scientificHeatmap) {
      setHoverProbe(null);
      return;
    }

    const onMove = (ev: L.LeafletMouseEvent) => {
      const sample = scientificHeatmap.sampleAt(ev.latlng.lat, ev.latlng.lng);
      if (!sample.inside) {
        setHoverProbe(null);
        return;
      }
      const { decimals, unit } = scientificHeatmap.scale;
      const formatted =
        decimals > 0
          ? `${sample.physicalValue.toFixed(decimals)}${unit === 'NDVI' ? ` ${unit}` : unit}`
          : `${Math.round(sample.physicalValue)}${unit}`;
      setHoverProbe({
        valueText: formatted,
        zoneLabel: sample.zoneLabel,
        hex: sample.hex,
      });
    };

    const onOut = () => setHoverProbe(null);

    map.on('mousemove', onMove);
    map.on('mouseout', onOut);
    return () => {
      map.off('mousemove', onMove);
      map.off('mouseout', onOut);
    };
  }, [mode, scientificHeatmap]);

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
      labelLayerRef.current = null;
    };
  }, []);

  // Switch tile basemap cleanly (Satellite Hybrid with place/road labels vs Street Map)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    if (labelLayerRef.current) {
      map.removeLayer(labelLayerRef.current);
      labelLayerRef.current = null;
    }

    if (basemap === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, attribution: 'Satellite &copy; Esri · NASA POWER Linked' }
      ).addTo(map);

      // Crisp village, city & boundary labels on top of satellite imagery (Hybrid mode)
      labelLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, opacity: 0.9 }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, attribution: 'Map &copy; Esri · Tadawol Global' }
      ).addTo(map);
    }
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

    // SCIENTIFIC SPATIAL HEATMAP FIELD OVERLAY for Rotation Lab, Dashboard & History
    if (boundary.length >= 3) {
      const meanAccent = scientificHeatmap?.meanHex ?? fieldOverlay?.cropColor ?? '#00873A';

      // Polygon-clipped spatial precision-ag gradient raster (Amber -> Lime -> Forest Green / Moisture)
      if (scientificHeatmap) {
        L.imageOverlay(scientificHeatmap.dataUrl, scientificHeatmap.bounds, {
          opacity: 0.86,
          interactive: false,
        }).addTo(group);
      }

      // Outer subtle dashed GIS buffer ring for Rotation Lab
      if (mode === 'rotation-lab') {
        L.polygon(boundary, {
          color: '#FFFFFF',
          weight: 5,
          opacity: 0.28,
          fillOpacity: 0,
        }).addTo(group);
      }

      // Crisp scientific parcel boundary outline (no flat opaque fill hiding the spatial heatmap!)
      L.polygon(boundary, {
        color: '#FFFFFF',
        weight: 2.5,
        dashArray: mode === 'rotation-lab' ? '6 4' : undefined,
        fillColor: meanAccent,
        fillOpacity: scientificHeatmap ? 0 : 0.45,
      }).addTo(group);

      // Precision GIS corner coordinate nodes on the parcel perimeter
      boundary.forEach((pt) => {
        L.circleMarker(pt, {
          radius: 3.5,
          color: '#111111',
          weight: 1.5,
          fillColor: '#FFFEFB',
          fillOpacity: 1,
          interactive: false,
        }).addTo(group);
      });

      const polyCenter = getPolygonCenter(boundary);
      const cropTitle = fieldOverlay?.cropName ?? 'Active Crop';
      const topBadge = fieldOverlay?.topBadge ?? '';
      const subLine =
        fieldOverlay?.bottomMetric ??
        fieldOverlay?.stageLabel ??
        `${computePolygonAreaHectares(boundary).toFixed(1)} ha Field`;

      const centerHtml = `<div style="transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:4px;pointer-events:none;">
        ${
          topBadge
            ? `<div style="background:#EBB40E;color:#111111;font-size:10px;font-weight:800;padding:2px 9px;border-radius:999px;border:1.5px solid #111111;letter-spacing:0.04em;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,0.28);">${topBadge}</div>`
            : ''
        }
        <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,254,251,0.94);color:#111111;padding:4px 12px;border-radius:999px;border:1.5px solid #111111;box-shadow:0 6px 18px rgba(0,0,0,0.26);white-space:nowrap;">
          <span style="display:inline-block;width:9px;height:9px;border-radius:999px;background:${meanAccent};border:1px solid rgba(0,0,0,0.25);"></span>
          <span style="font-size:12px;font-weight:800;">${cropTitle}</span>
        </div>
        <div style="background:rgba(17,17,17,0.86);color:#F5F4F0;font-size:10.5px;font-weight:700;padding:2.5px 10px;border-radius:999px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.22);">
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
    scientificHeatmap,
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

      {/* Bottom-left contextual hint / calibrated scientific colorbar legend */}
      <div className="absolute bottom-3 left-3 z-[400] bg-[#FFFEFB]/96 backdrop-blur-sm border border-[#D1CFC7] rounded-xl px-3.5 py-2 shadow-md max-w-[335px]">
        {mode === 'onboarding' ? (
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#2E2E2E]">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#EBB40E] border border-[#111111] shrink-0" />
            <span>
              {toolMode === 'resize'
                ? 'Drag yellow corners to resize · Drag center label to move'
                : toolMode === 'pin'
                  ? 'Click anywhere on the global map to pin your farm'
                  : 'Click around your land edges to outline your field'}
            </span>
          </div>
        ) : scientificHeatmap ? (
          <div className="space-y-1.5 min-w-[250px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#111111]">
                {activeScientificLayer === 'moisture'
                  ? 'Root-Zone Soil Wetness'
                  : activeScientificLayer === 'climate'
                    ? 'Local Climate (NASA)'
                    : activeScientificLayer === 'slope'
                      ? 'Field Slope & Erosion (SRTM)'
                      : activeScientificLayer === 'nitrogen'
                        ? 'Soil Fertility & Nitrogen'
                        : 'Crop & Soil Vitality (NDVI)'}
              </span>
              <span
                className={`text-[10px] font-mono-tech font-extrabold ${
                  activeScientificLayer === 'moisture' || activeScientificLayer === 'climate'
                    ? 'text-[#0A5E82]'
                    : 'text-[#007432]'
                }`}
              >
                Mean{' '}
                {scientificHeatmap.scale.decimals > 0
                  ? `${scientificHeatmap.meanPhysical.toFixed(scientificHeatmap.scale.decimals)}${
                      scientificHeatmap.scale.unit === 'NDVI'
                        ? ` ${scientificHeatmap.scale.unit}`
                        : scientificHeatmap.scale.unit
                    }`
                  : `${Math.round(scientificHeatmap.meanPhysical)}${scientificHeatmap.scale.unit}`}
              </span>
            </div>

            <div
              className="h-2.5 w-full rounded-full border border-black/10"
              style={{ background: scientificHeatmap.scale.cssGradient }}
            />

            <div className="flex items-center justify-between text-[10px] font-mono-tech font-semibold text-[#3A3A3A]">
              {scientificHeatmap.scale.ticks.map((tk) => (
                <span key={tk.label}>{tk.label}</span>
              ))}
            </div>

            <div className="text-[10px] text-[#3A3A3A] pt-1 border-t border-[#ECEAE2] space-y-0.5">
              {hoverProbe ? (
                <div className="flex items-center gap-1.5 text-[#111111] font-bold">
                  <span
                    className="w-2 h-2 rounded-full shrink-0 border border-black/20"
                    style={{ backgroundColor: hoverProbe.hex }}
                  />
                  <span>
                    Cursor: {hoverProbe.valueText} ({hoverProbe.zoneLabel})
                  </span>
                </div>
              ) : (
                <div>
                  Field range:{' '}
                  <strong>
                    {scientificHeatmap.scale.decimals > 0
                      ? scientificHeatmap.minPhysical.toFixed(scientificHeatmap.scale.decimals)
                      : Math.round(scientificHeatmap.minPhysical)}
                  </strong>{' '}
                  to{' '}
                  <strong>
                    {scientificHeatmap.scale.decimals > 0
                      ? `${scientificHeatmap.maxPhysical.toFixed(scientificHeatmap.scale.decimals)}${
                          scientificHeatmap.scale.unit === 'NDVI'
                            ? ` ${scientificHeatmap.scale.unit}`
                            : scientificHeatmap.scale.unit
                        }`
                      : `${Math.round(scientificHeatmap.maxPhysical)}${scientificHeatmap.scale.unit}`}
                  </strong>
                  {fieldOverlay?.physics?.slopeDeg !== undefined &&
                    ` (${fieldOverlay.physics.slopeDeg}° slope, ${fieldOverlay.physics.soilType ?? 'Loamy'})`}
                </div>
              )}
              <div className="text-[9.5px] text-[#4A4A4A]">
                {fieldOverlay?.sourceNote ??
                  'Spatial catena model anchored to NASA POWER / MODIS baseline'}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
