import React, { useEffect, useMemo, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { FarmLeafletMap } from './FarmLeafletMap';
import {
  LocationCascadePicker,
  LocationSelection,
} from './LocationCascadePicker';
import { CountryOption, GLOBAL_COUNTRIES } from '../data/countries';
import { GLOBAL_CROPS } from '../data/decisionEngine';
import {
  buildDefaultBoundary,
  computePolygonAreaHectares,
  getPolygonCenter,
  scaleBoundaryToHectares,
} from '../data/agronomyData';
import { resolveSlopeDegrees } from '../api/nasaPowerService';
import { FarmEditTab, IrrigationType, SlopeOption, SoilType } from '../types/farm';
import {
  CheckCircle2,
  Droplets,
  Loader2,
  MapPin,
  Plus,
  Save,
  Sprout,
  Trash2,
  X,
} from 'lucide-react';

const SOIL_OPTIONS: { value: SoilType; note: string }[] = [
  { value: 'Loamy', note: 'Balanced drainage & nutrients' },
  { value: 'Clay', note: 'Holds water well, heavier to till' },
  { value: 'Sandy', note: 'Drains fast, warms up quickly' },
  { value: 'Silt', note: 'Smooth & fertile, needs cover' },
  { value: 'Peaty', note: 'Rich organic dark soil' },
];

const SLOPE_OPTIONS: SlopeOption[] = [
  'Auto-detect via SRTM Elevation',
  'Flat',
  'Gentle Slope',
  'Steep Slope',
];

const IRRIGATION_OPTIONS: IrrigationType[] = ['Drip', 'Rain-fed', 'Sprinkler', 'Canal / Well'];

const EQUIPMENT_LIST = [
  'No-Till Seeder',
  'Tractor & Disc Harrow',
  'Drip Fertigation',
  'Combine Harvester',
  'Sprayer',
  'Soil Moisture Probe',
];

const CROP_OPTIONS = Object.values(GLOBAL_CROPS);

export const FarmManagerModal: React.FC = () => {
  const {
    farmModal,
    closeFarmModal,
    activeFarm,
    farms,
    addFarm,
    updateActiveFarm,
    deleteFarm,
  } = useFarm();

  const isAdd = farmModal.mode === 'add';
  const [editTab, setEditTab] = useState<FarmEditTab>(farmModal.initialTab);

  // Draft form state
  const [farmName, setFarmName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(GLOBAL_COUNTRIES[0]);
  const [selectedStateName, setSelectedStateName] = useState('');
  const [selectedLocalityName, setSelectedLocalityName] = useState('');
  const [regionLabel, setRegionLabel] = useState(GLOBAL_COUNTRIES[0].regionHint);
  const [coords, setCoords] = useState<[number, number]>([36.8142, 9.8635]);
  const [boundary, setBoundary] = useState<[number, number][]>(() =>
    buildDefaultBoundary(36.8142, 9.8635)
  );
  const [soilType, setSoilType] = useState<SoilType>('Loamy');
  const [slopeOption, setSlopeOption] = useState<SlopeOption>('Auto-detect via SRTM Elevation');
  const [irrigationType, setIrrigationType] = useState<IrrigationType>('Drip');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [crop1, setCrop1] = useState('Wheat');
  const [crop2, setCrop2] = useState('Chickpeas');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Re-initialize form whenever modal opens or mode changes
  useEffect(() => {
    if (!farmModal.open) return;
    setEditTab(farmModal.initialTab);
    setConfirmDelete(false);

    const currentCountry =
      GLOBAL_COUNTRIES.find((c) => c.code === activeFarm.countryCode) ?? GLOBAL_COUNTRIES[0];

    if (farmModal.mode === 'add') {
      // Seed a new parcel slightly offset nearby so the farmer can easily pin anywhere globally
      const offsetLat = Number((activeFarm.coordinates.lat + 0.012).toFixed(5));
      const offsetLng = Number((activeFarm.coordinates.lng + 0.015).toFixed(5));
      setFarmName(`Parcel #${farms.length + 1}`);
      setSelectedCountry(currentCountry);
      setSelectedStateName(activeFarm.stateName ?? '');
      setSelectedLocalityName(activeFarm.localityName ?? '');
      setRegionLabel(activeFarm.regionLabel || currentCountry.regionHint);
      setCoords([offsetLat, offsetLng]);
      setBoundary(scaleBoundaryToHectares(buildDefaultBoundary(offsetLat, offsetLng), 18));
      setSoilType(currentCountry.defaultSoil);
      setSlopeOption('Auto-detect via SRTM Elevation');
      setIrrigationType(activeFarm.irrigationType);
      setEquipment([...activeFarm.equipment]);
      setCrop1(activeFarm.previousCrops[0] ?? 'Wheat');
      setCrop2(activeFarm.previousCrops[1] ?? 'Chickpeas');
    } else {
      setFarmName(activeFarm.farmName);
      setSelectedCountry(currentCountry);
      setSelectedStateName(activeFarm.stateName ?? '');
      setSelectedLocalityName(activeFarm.localityName ?? '');
      setRegionLabel(activeFarm.regionLabel || currentCountry.regionHint);
      setCoords([activeFarm.coordinates.lat, activeFarm.coordinates.lng]);
      setBoundary(activeFarm.boundary.map((pt) => [...pt] as [number, number]));
      setSoilType(activeFarm.soilType);
      setSlopeOption(activeFarm.slopeOption);
      setIrrigationType(activeFarm.irrigationType);
      setEquipment([...activeFarm.equipment]);
      setCrop1(activeFarm.previousCrops[0] ?? 'Wheat');
      setCrop2(activeFarm.previousCrops[1] ?? 'Chickpeas');
    }
  }, [farmModal.open, farmModal.mode, farmModal.initialTab, activeFarm, farms.length]);

  const areaHa = useMemo(() => computePolygonAreaHectares(boundary), [boundary]);

  // Detect specifically which fields changed in Edit mode (supports partial editing!)
  const changedSummary = useMemo(() => {
    if (isAdd) return [];
    const changes: string[] = [];
    if (farmName.trim() !== activeFarm.farmName) changes.push('Farm Name');
    if (Math.abs(areaHa - activeFarm.areaHectares) >= 0.2) changes.push(`Size (${areaHa} ha)`);
    if (
      Math.abs(coords[0] - activeFarm.coordinates.lat) > 0.0004 ||
      Math.abs(coords[1] - activeFarm.coordinates.lng) > 0.0004 ||
      selectedCountry.code !== activeFarm.countryCode ||
      selectedStateName !== (activeFarm.stateName ?? '') ||
      selectedLocalityName !== (activeFarm.localityName ?? '')
    ) {
      changes.push('Location (re-syncs NASA POWER)');
    }
    if (soilType !== activeFarm.soilType) changes.push(`Soil (${soilType})`);
    if (slopeOption !== activeFarm.slopeOption) changes.push('Field Slope');
    if (irrigationType !== activeFarm.irrigationType) changes.push('Irrigation');
    if (
      crop1 !== (activeFarm.previousCrops[0] ?? '') ||
      crop2 !== (activeFarm.previousCrops[1] ?? '')
    ) {
      changes.push('Recent Crops');
    }
    if (JSON.stringify([...equipment].sort()) !== JSON.stringify([...activeFarm.equipment].sort())) {
      changes.push('Equipment');
    }
    return changes;
  }, [
    isAdd,
    farmName,
    areaHa,
    coords,
    selectedCountry.code,
    selectedStateName,
    selectedLocalityName,
    soilType,
    slopeOption,
    irrigationType,
    crop1,
    crop2,
    equipment,
    activeFarm,
  ]);

  if (!farmModal.open) return null;

  const handleLocationSelect = (sel: LocationSelection) => {
    const countryChanged = sel.country.code !== selectedCountry.code;
    setSelectedCountry(sel.country);
    setSelectedStateName(sel.stateName ?? '');
    setSelectedLocalityName(sel.localityName ?? '');
    setRegionLabel(sel.regionLabel);
    setCoords([sel.lat, sel.lng]);
    setBoundary(scaleBoundaryToHectares(buildDefaultBoundary(sel.lat, sel.lng), areaHa || 20));
    if (isAdd && countryChanged) setSoilType(sel.country.defaultSoil);
  };

  const handleMapPin = (lat: number, lng: number) => {
    setCoords([lat, lng]);
    setBoundary(scaleBoundaryToHectares(buildDefaultBoundary(lat, lng), areaHa || 20));
  };

  const handleBoundaryChange = (nextPoly: [number, number][]) => {
    setBoundary(nextPoly);
    setCoords(getPolygonCenter(nextPoly));
  };

  const handleAreaChange = (targetHa: number) => {
    if (!Number.isFinite(targetHa) || targetHa < 1.5) return;
    setBoundary((prev) => scaleBoundaryToHectares(prev, targetHa));
  };

  const toggleEquip = (item: string) => {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const coordObj = { lat: coords[0], lng: coords[1] };
    const resolvedSlopeDeg = resolveSlopeDegrees(slopeOption, coordObj);

    const payload = {
      farmName: farmName.trim() || `${selectedCountry.name} Farm`,
      countryCode: selectedCountry.code,
      countryName: selectedCountry.name,
      countryFlag: selectedCountry.flag,
      stateName: selectedStateName || undefined,
      localityName: selectedLocalityName || undefined,
      climateZone: selectedCountry.climateZone,
      regionLabel: regionLabel || `${selectedCountry.regionHint}, ${selectedCountry.name}`,
      coordinates: coordObj,
      boundary,
      areaHectares: areaHa,
      soilType,
      slopeOption,
      slopeDeg: resolvedSlopeDeg,
      irrigationType,
      equipment: equipment.length > 0 ? equipment : ['Tractor & Disc Harrow'],
      previousCrops: [crop1, crop2].filter(Boolean),
    };

    if (isAdd) {
      await addFarm(payload);
    } else {
      // Only send modified fields (clean partial update!)
      await updateActiveFarm(payload);
    }

    setSaving(false);
    closeFarmModal();
  };

  return (
    <div
      className="fixed inset-0 z-[880] bg-[#111111]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      onClick={closeFarmModal}
    >
      <div
        className="bg-[#FFFEFB] border border-[#D9D9D9] rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#00873A] text-white px-6 py-4 flex items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-survey-pattern-light opacity-25 pointer-events-none" />
          <div className="relative z-10">
            <div className="text-[11px] font-bold uppercase tracking-widest text-[#92D500]">
              {isAdd ? 'Multi-Farm Workspace · Add Parcel' : `Modify Farm · ${activeFarm.farmName}`}
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              {isAdd
                ? 'Add Another Farm Anywhere in the World'
                : 'Edit Only What You Want (Size, Location, Soil or Crops)'}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeFarmModal}
            aria-label="Close Farm Manager"
            className="relative z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white hover:text-[#111111] flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Focused Section Tabs for Edit Mode (edit ONLY what you need without refilling everything) */}
        {!isAdd && (
          <div className="px-6 py-3 bg-[#F5F4F0] border-b border-[#DFDDD6] flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex flex-wrap bg-white p-1 rounded-full border border-[#D9D9D9]">
              {(
                [
                  {
                    id: 'location-size',
                    label: 'Location & Size',
                    icon: <MapPin className="w-3.5 h-3.5" />,
                  },
                  {
                    id: 'soil-water',
                    label: 'Soil, Water & Slope',
                    icon: <Droplets className="w-3.5 h-3.5" />,
                  },
                  {
                    id: 'crops-gear',
                    label: 'Name, Crops & Gear',
                    icon: <Sprout className="w-3.5 h-3.5" />,
                  },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setEditTab(t.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer ${
                    editTab === t.id
                      ? 'bg-[#00873A] text-white'
                      : 'text-[#474747] hover:text-[#111111]'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {changedSummary.length > 0 ? (
              <span className="text-[11px] font-bold text-[#005A26] bg-[#E3F5EB] border border-[#B8E5CC] px-3 py-1 rounded-full">
                Updating: {changedSummary.join(' · ')}
              </span>
            ) : (
              <span className="text-[11px] text-[#3A3A3A]">
                Change just one detail or several; everything else stays untouched.
              </span>
            )}
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 p-5 sm:p-6 space-y-5">
            {/* LOCATION & SIZE SECTION (Always visible in Add Mode; Tab 1 in Edit Mode) */}
            {(isAdd || editTab === 'location-size') && (
              <div className={isAdd ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start' : 'space-y-4'}>
                <div className={isAdd ? 'lg:col-span-7 space-y-3' : 'space-y-3'}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-[#111111]">
                        {selectedCountry.flag}{' '}
                        {selectedLocalityName
                          ? `${selectedLocalityName}, ${selectedStateName}`
                          : selectedStateName
                            ? `${selectedStateName}, ${selectedCountry.name}`
                            : selectedCountry.name}
                        : Pin Location or Resize Area
                      </h3>
                      <p className="text-xs text-[#3A3A3A]">
                        Drag yellow corners to resize, drag center label to move, or switch to Drop
                        Pin / Draw Shape.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#111111] text-[#EBB40E] font-mono-tech text-xs font-bold">
                      {coords[0].toFixed(4)}°, {coords[1].toFixed(4)}°
                    </span>
                  </div>

                  {/* Live Flagged Country -> State/Governorate -> Delegation/Area Picker */}
                  <LocationCascadePicker
                    countryCode={selectedCountry.code}
                    stateName={selectedStateName}
                    localityName={selectedLocalityName}
                    onSelect={handleLocationSelect}
                  />

                  <FarmLeafletMap
                    mode="onboarding"
                    center={coords}
                    boundary={boundary}
                    heightClass={isAdd ? 'h-[340px]' : 'h-[360px]'}
                    onChangeLocation={handleMapPin}
                    onChangeBoundary={handleBoundaryChange}
                  />

                  {/* Precision Farm Size Controls (Slider + Direct Hectares Number Input) */}
                  <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-[#E2E0D8] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-[#111111]">
                      <MapPin className="w-4 h-4 text-[#00873A] shrink-0" />
                      <span className="font-extrabold text-[#111111] tracking-tight">Farm Size:</span>
                      <input
                        type="number"
                        min={2}
                        max={500}
                        step={0.5}
                        value={areaHa}
                        onChange={(e) => handleAreaChange(Number(e.target.value))}
                        className="w-20 px-2.5 py-1 bg-white border border-[#D1D1D1] rounded-lg text-sm font-black text-[#111111] focus:outline-none focus:border-[#00873A]"
                      />
                      <span className="text-xs font-extrabold text-[#111111]">ha</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#3A3A3A]">2 ha</span>
                      <input
                        type="range"
                        min={2}
                        max={250}
                        step={1}
                        value={Math.min(250, Math.max(2, Math.round(areaHa)))}
                        onChange={(e) => handleAreaChange(Number(e.target.value))}
                        className="w-40 accent-[#00873A] cursor-pointer"
                      />
                      <span className="text-[11px] text-[#3A3A3A]">250 ha</span>
                    </div>
                  </div>
                </div>

                {/* Right Column inside ADD mode */}
                {isAdd && (
                  <div className="lg:col-span-5 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#111111] mb-1">
                        New Farm Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={farmName}
                        onChange={(e) => setFarmName(e.target.value)}
                        placeholder="e.g. North Ridge Olive Plot"
                        className="w-full px-3.5 py-2 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#111111] mb-1.5">
                        Soil Type
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-3 gap-1.5">
                        {SOIL_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setSoilType(opt.value)}
                            className={`px-2.5 py-2 rounded-xl border text-left transition cursor-pointer ${
                              soilType === opt.value
                                ? 'bg-[#00873A] text-white border-[#00873A]'
                                : 'bg-[#F5F4F0] text-[#111111] border-[#D9D9D9]'
                            }`}
                          >
                            <div className="text-xs font-extrabold">{opt.value}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#111111] mb-1">
                          Field Slope
                        </label>
                        <select
                          value={slopeOption}
                          onChange={(e) => setSlopeOption(e.target.value as SlopeOption)}
                          className="w-full px-3 py-2 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-xs font-medium"
                        >
                          {SLOPE_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#111111] mb-1">
                          Irrigation
                        </label>
                        <select
                          value={irrigationType}
                          onChange={(e) => setIrrigationType(e.target.value as IrrigationType)}
                          className="w-full px-3 py-2 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-xs font-medium"
                        >
                          {IRRIGATION_OPTIONS.map((ir) => (
                            <option key={ir} value={ir}>
                              {ir}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#111111] mb-1">
                          Most Recent Crop
                        </label>
                        <select
                          value={crop1}
                          onChange={(e) => setCrop1(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-xs font-medium"
                        >
                          {CROP_OPTIONS.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#111111] mb-1">
                          Previous Crop
                        </label>
                        <select
                          value={crop2}
                          onChange={(e) => setCrop2(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-xs font-medium"
                        >
                          {CROP_OPTIONS.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#111111] mb-1.5">
                        Equipment Available
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {EQUIPMENT_LIST.map((item) => {
                          const selected = equipment.includes(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleEquip(item)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer ${
                                selected
                                  ? 'bg-[#111111] text-white border-[#111111]'
                                  : 'bg-[#F5F4F0] text-[#474747] border-[#D9D9D9]'
                              }`}
                            >
                              {selected && <CheckCircle2 className="w-3 h-3 text-[#92D500]" />}
                              {item}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* EDIT TAB 2: SOIL, WATER & SLOPE */}
            {!isAdd && editTab === 'soil-water' && (
              <div className="space-y-5 max-w-3xl">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-2">
                    Soil Type (Plain Description)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {SOIL_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSoilType(opt.value)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          soilType === opt.value
                            ? 'bg-[#00873A] text-white border-[#00873A]'
                            : 'bg-[#F5F4F0] text-[#111111] border-[#D9D9D9] hover:border-[#111111]'
                        }`}
                      >
                        <div className="text-xs font-extrabold">{opt.value}</div>
                        <div
                          className={`text-[10px] mt-0.5 leading-tight ${
                            soilType === opt.value ? 'text-white/80' : 'text-[#3A3A3A]'
                          }`}
                        >
                          {opt.note}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1.5">
                      Field Slope (Erosion Factor)
                    </label>
                    <select
                      value={slopeOption}
                      onChange={(e) => setSlopeOption(e.target.value as SlopeOption)}
                      className="w-full px-3.5 py-2.5 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                    >
                      {SLOPE_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1.5">
                      Water &amp; Irrigation System
                    </label>
                    <select
                      value={irrigationType}
                      onChange={(e) => setIrrigationType(e.target.value as IrrigationType)}
                      className="w-full px-3.5 py-2.5 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                    >
                      {IRRIGATION_OPTIONS.map((ir) => (
                        <option key={ir} value={ir}>
                          {ir}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* EDIT TAB 3: NAME, CROPS & EQUIPMENT */}
            {!isAdd && editTab === 'crops-gear' && (
              <div className="space-y-5 max-w-3xl">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1.5">Farm Name</label>
                  <input
                    type="text"
                    required
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1.5">
                      Most Recent Crop Grown
                    </label>
                    <select
                      value={crop1}
                      onChange={(e) => setCrop1(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm"
                    >
                      {CROP_OPTIONS.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} ({c.family})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1.5">
                      Previous Season Crop
                    </label>
                    <select
                      value={crop2}
                      onChange={(e) => setCrop2(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm"
                    >
                      {CROP_OPTIONS.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} ({c.family})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-2">
                    Available Farm Equipment
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EQUIPMENT_LIST.map((item) => {
                      const selected = equipment.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleEquip(item)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                            selected
                              ? 'bg-[#111111] text-white border-[#111111]'
                              : 'bg-[#F5F4F0] text-[#474747] border-[#D9D9D9] hover:border-[#111111]'
                          }`}
                        >
                          {selected && <CheckCircle2 className="w-3.5 h-3.5 text-[#92D500]" />}
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {farms.length > 1 && (
                  <div className="pt-4 border-t border-[#EFECE6] flex items-center justify-between gap-3">
                    <div className="text-xs text-[#3A3A3A]">
                      You have <strong>{farms.length} farms</strong> in your account. You can safely
                      remove this parcel if you no longer manage it.
                    </div>
                    {!confirmDelete ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E7A18E] text-xs font-bold text-[#B83B1A] hover:bg-[#FCEBE6] cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Farm
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            deleteFarm(activeFarm.id);
                            closeFarmModal();
                          }}
                          className="px-3.5 py-1.5 rounded-full bg-[#B83B1A] text-white text-xs font-bold cursor-pointer"
                        >
                          Confirm Remove
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="px-3 py-1.5 rounded-full border border-[#D9D9D9] text-xs font-bold cursor-pointer"
                        >
                          Keep
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky Modal Footer */}
          <div className="px-6 py-4 bg-[#F5F4F0] border-t border-[#DFDDD6] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-[#3A3A3A]">
              {isAdd ? (
                <span>
                  Will sync live 5-year <strong>NASA POWER</strong> data for{' '}
                  <strong>
                    {selectedCountry.flag} {selectedCountry.name}
                  </strong>
                  .
                </span>
              ) : (
                <span>
                  Farm: <strong>{farmName || activeFarm.farmName}</strong> ·{' '}
                  <strong>{areaHa} ha</strong> · {soilType}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeFarmModal}
                className="px-4 py-2 rounded-full border border-[#D1D1D1] bg-white text-xs font-bold text-[#474747] hover:border-[#111111] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-pill btn-pill-primary text-xs sm:text-sm !px-5 !py-2.5 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Syncing NASA Data...
                  </>
                ) : isAdd ? (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Farm &amp; Sync NASA
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
