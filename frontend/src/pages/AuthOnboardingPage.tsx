import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Droplets,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Satellite,
  Search,
  Sprout,
  Tractor,
  User,
} from 'lucide-react';
import { BrandMark } from '../components/BrandMark';
import { FarmLeafletMap } from '../components/FarmLeafletMap';
import { useFarm } from '../context/FarmContext';
import {
  buildDefaultBoundary,
  computePolygonAreaHectares,
  DEFAULT_FARMER_PROFILE,
  EQUIPMENT_OPTIONS,
  generateNasaBaseline,
  PRESET_REGIONS,
  PREVIOUS_CROP_OPTIONS,
  scaleBoundaryToHectares,
} from '../data/agronomyData';
import { IrrigationType, SoilType, WaterAccessLevel } from '../types/farm';

const SOIL_TYPES: SoilType[] = [
  'Loamy',
  'Clay-Loam',
  'Sandy Loam',
  'Clay',
  'Silt Loam',
  'Calcareous',
];

const IRRIGATION_TYPES: IrrigationType[] = [
  'Precision Drip',
  'Center-Pivot Sprinkler',
  'Furrow / Surface',
  'Rain-Fed + Supplemental',
];

const WATER_ACCESS_LEVELS: WaterAccessLevel[] = [
  'Abundant',
  'Moderate',
  'Seasonal / Limited',
  'Arid / Scarce',
];

export const AuthOnboardingPage: React.FC = () => {
  const { authTab, navigate, loginDemo, registerFarm } = useFarm();
  const [tab, setTab] = useState<'login' | 'register'>(authTab);

  // Login state
  const [loginEmail, setLoginEmail] = useState('amine@medjerdafarms.tn');
  const [loginPassword, setLoginPassword] = useState('••••••••••');

  // Register & Farm Setup state
  const [farmerName, setFarmerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [farmName, setFarmName] = useState('');
  const [soilType, setSoilType] = useState<SoilType>('Clay-Loam');
  const [irrigationType, setIrrigationType] = useState<IrrigationType>('Precision Drip');
  const [waterAccess, setWaterAccess] = useState<WaterAccessLevel>('Moderate');
  const [equipment, setEquipment] = useState<string[]>([
    'GPS-Guided Tractor',
    'Soil Moisture Probes (IoT)',
    'Variable-Rate Drip Controller',
  ]);
  const [previousCrops, setPreviousCrops] = useState<string[]>([
    'Durum Wheat',
    'Winter Barley',
    'Chickpeas',
  ]);

  // Interactive Map state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [regionLabel, setRegionLabel] = useState(PRESET_REGIONS[0].label + ', ' + PRESET_REGIONS[0].country);
  const [coords, setCoords] = useState({
    lat: PRESET_REGIONS[0].lat,
    lng: PRESET_REGIONS[0].lng,
  });
  const [boundary, setBoundary] = useState<[number, number][]>(() =>
    buildDefaultBoundary(PRESET_REGIONS[0].lat, PRESET_REGIONS[0].lng)
  );

  // Simulated NASA satellite baseline initialization overlay
  const [isInitializing, setIsInitializing] = useState(false);
  const [initStep, setInitStep] = useState(0);

  const areaHectares = computePolygonAreaHectares(boundary);
  const previewNasa = generateNasaBaseline(coords, soilType);

  const selectRegion = (region: (typeof PRESET_REGIONS)[number]) => {
    const targetArea = areaHectares;
    setCoords({ lat: region.lat, lng: region.lng });
    setBoundary(scaleBoundaryToHectares(buildDefaultBoundary(region.lat, region.lng), targetArea));
    setRegionLabel(`${region.label}, ${region.country}`);
    setSoilType(region.defaultSoil);
  };

  const handleMapLocationChange = (lat: number, lng: number) => {
    const targetArea = areaHectares;
    setCoords({ lat, lng });
    setBoundary(scaleBoundaryToHectares(buildDefaultBoundary(lat, lng), targetArea));
    setRegionLabel(`Custom Parcel (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`);
  };

  const handleMapBoundaryChange = (newPoly: [number, number][]) => {
    setBoundary(newPoly);
    const avgLat = newPoly.reduce((s, p) => s + p[0], 0) / newPoly.length;
    const avgLng = newPoly.reduce((s, p) => s + p[1], 0) / newPoly.length;
    setCoords({ lat: Number(avgLat.toFixed(6)), lng: Number(avgLng.toFixed(6)) });
  };

  const handleResizeHectares = (nextHectares: number) => {
    if (!Number.isFinite(nextHectares)) return;
    const clamped = Math.max(2, Math.min(300, nextHectares));
    setBoundary((prev) => scaleBoundaryToHectares(prev, clamped));
  };

  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    // Instant preset match first
    const localMatch = PRESET_REGIONS.find(
      (r) =>
        r.label.toLowerCase().includes(q.toLowerCase()) ||
        r.country.toLowerCase().includes(q.toLowerCase())
    );
    if (localMatch) {
      selectRegion(localMatch);
      return;
    }

    setIsSearching(true);
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`
      );
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = Number(parseFloat(data[0].lat).toFixed(6));
        const lng = Number(parseFloat(data[0].lon).toFixed(6));
        setCoords({ lat, lng });
        setBoundary(buildDefaultBoundary(lat, lng));
        const cleanName = String(data[0].display_name || q)
          .split(',')
          .slice(0, 2)
          .join(', ');
        setRegionLabel(cleanName);
      }
    } catch {
      // Fallback smoothly to closest region
      selectRegion(PRESET_REGIONS[0]);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleEquipment = (item: string) => {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const togglePreviousCrop = (crop: string) => {
    setPreviousCrops((prev) =>
      prev.includes(crop) ? prev.filter((x) => x !== crop) : [...prev, crop]
    );
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginDemo(loginEmail);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsInitializing(true);
    setInitStep(0);

    const timers = [
      setTimeout(() => setInitStep(1), 420),
      setTimeout(() => setInitStep(2), 880),
      setTimeout(() => setInitStep(3), 1300),
      setTimeout(() => {
        setIsInitializing(false);
        registerFarm({
          name: farmerName.trim() || 'Youssef Mansouri',
          email: email.trim() || 'farmer@tadawol.ag',
          farmName: farmName.trim() || `${regionLabel.split(',')[0]} Estate`,
          regionLabel,
          coordinates: coords,
          boundary,
          areaHectares,
          soilType,
          irrigationType,
          waterAccess,
          equipment: equipment.length > 0 ? equipment : ['GPS-Guided Tractor'],
          previousCrops: previousCrops.length > 0 ? previousCrops : ['Durum Wheat'],
        });
      }, 1750),
    ];

    return () => timers.forEach(clearTimeout);
  };

  return (
    <div className="min-h-screen bg-[#F5F4F0] bg-orbital-rings text-[#111111] flex flex-col">
      {/* Top Bar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#E5E3DC]">
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 h-[72px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('landing')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#474747] hover:text-[#111111] transition cursor-pointer"
            >
              <span className="w-8 h-8 rounded-full bg-[#F5F4F0] border border-[#D9D9D9] flex items-center justify-center">
                <ArrowLeft className="w-4 h-4" />
              </span>
              <span className="hidden sm:inline">Homepage</span>
            </button>
            <div className="h-5 w-px bg-[#D9D9D9]" />
            <BrandMark size={30} />
          </div>

          {/* Unified Tab Switcher */}
          <div className="inline-flex items-center bg-[#F5F4F0] p-1 rounded-full border border-[#D9D9D9]">
            <button
              type="button"
              onClick={() => setTab('login')}
              className={`px-4 sm:px-6 py-1.5 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer ${
                tab === 'login'
                  ? 'bg-[#111111] text-white'
                  : 'text-[#474747] hover:text-[#111111]'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setTab('register')}
              className={`px-4 sm:px-6 py-1.5 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer ${
                tab === 'register'
                  ? 'bg-[#EBB40E] text-[#111111]'
                  : 'text-[#474747] hover:text-[#111111]'
              }`}
            >
              Register &amp; Farm Setup
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-5 sm:px-8 py-8 lg:py-10">
        {tab === 'login' ? (
          /* LOGIN PANEL */
          <div className="max-w-[960px] mx-auto grid grid-cols-1 md:grid-cols-12 bg-white border border-[#D9D9D9] shadow-[0_20px_50px_rgba(17,17,17,0.08)] overflow-hidden animate-fade-in">
            {/* Left Editorial Green Side */}
            <div className="md:col-span-5 bg-[#00873A] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-survey-pattern-light opacity-40 pointer-events-none" />
              <div className="relative z-10 space-y-5">
                <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-bold text-[#92D500]">
                  <Satellite className="w-3.5 h-3.5" />
                  Live Satellite Telemetry
                </div>
                <h1 className="text-3xl font-bold leading-tight">
                  Welcome back to your smart estate.
                </h1>
                <p className="text-sm text-white/85 leading-relaxed">
                  Access real-time NASA SMAP soil moisture maps, inspect your 4-zone crop rotation
                  status, and collaborate with Tadawol AI.
                </p>
              </div>
              <div className="relative z-10 mt-8 pt-6 border-t border-white/20 space-y-2 text-xs text-white/85">
                <div className="font-bold uppercase tracking-wider text-[#EBB40E]">
                  Instant Demo Estate Included
                </div>
                <p>
                  {DEFAULT_FARMER_PROFILE.farmName} · {DEFAULT_FARMER_PROFILE.regionLabel} ·{' '}
                  {DEFAULT_FARMER_PROFILE.areaHectares} ha {DEFAULT_FARMER_PROFILE.soilType}
                </p>
              </div>
            </div>

            {/* Right Clean Login Form */}
            <div className="md:col-span-7 p-8 sm:p-10 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-[#111111]">Farmer Sign In</h2>
                <p className="text-sm text-[#6F6F6F] mt-1">
                  Enter your credentials or launch the pre-calibrated demo dashboard.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#474747] mb-1.5">
                    Email or Username
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#6F6F6F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      required
                      type="text"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="amine@medjerdafarms.tn"
                      className="w-full pl-10 pr-4 py-3 bg-[#FFFEFB] border border-[#D1D1D1] rounded-lg text-sm focus:outline-none focus:border-[#00873A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#474747] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#6F6F6F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      required
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-[#FFFEFB] border border-[#D1D1D1] rounded-lg text-sm focus:outline-none focus:border-[#00873A]"
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <button type="submit" className="btn-harvest w-full">
                    Sign In to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => loginDemo('amine@medjerdafarms.tn')}
                    className="w-full py-2.5 px-4 rounded-full bg-[#F5F4F0] hover:bg-[#E7E5DE] border border-[#D9D9D9] text-xs font-bold text-[#111111] transition cursor-pointer"
                  >
                    Quick Launch: Demo Account (Amine Ben Salem · Medjerda Valley)
                  </button>
                </div>
              </form>

              <div className="pt-4 border-t border-[#EFECE6] text-center text-sm text-[#474747]">
                New to Tadawol?{' '}
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className="font-bold text-[#00873A] underline cursor-pointer"
                >
                  Register &amp; map your farm
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* REGISTER & FARM SETUP PANEL — Left Interactive Map / Right Farmer & Farm Info Form */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
            {/* LEFT SIDE — Interactive Farm Map */}
            <div className="lg:col-span-6 bg-white border border-[#D9D9D9] p-5 sm:p-6 space-y-4 lg:sticky lg:top-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#00873A]">
                    <MapPin className="w-3.5 h-3.5" />
                    Step 1 · Define Your Farm Area
                  </div>
                  <h2 className="text-xl font-bold text-[#111111] mt-0.5">
                    Locate &amp; Resize Farm Boundary
                  </h2>
                </div>
                <span className="font-mono-tech text-xs font-extrabold bg-[#E3F5EB] text-[#005A26] px-3 py-1 rounded-full border border-[#00873A]/25">
                  {areaHectares.toFixed(1)} ha
                </span>
              </div>

              {/* Location Search Bar */}
              <form onSubmit={handleLocationSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#6F6F6F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search city, valley, or region (e.g. Béja, Loire, Andalusia)..."
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FFFEFB] border border-[#D1D1D1] rounded-lg text-sm focus:outline-none focus:border-[#00873A]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-4 py-2.5 rounded-lg bg-[#111111] text-white text-xs font-bold hover:bg-[#00873A] transition cursor-pointer disabled:opacity-60"
                >
                  {isSearching ? 'Locating...' : 'Locate'}
                </button>
              </form>

              {/* Quick Agricultural Region Presets */}
              <div className="flex flex-wrap gap-1.5">
                {PRESET_REGIONS.map((r) => {
                  const active = regionLabel.startsWith(r.label);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => selectRegion(r)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                        active
                          ? 'bg-[#EBB40E] border-[#111111] text-[#111111]'
                          : 'bg-[#F5F4F0] border-[#D9D9D9] text-[#474747] hover:border-[#111111]'
                      }`}
                    >
                      {r.label.split(',')[0]}, {r.country}
                    </button>
                  );
                })}
              </div>

              {/* Interactive Leaflet Map (Single unified farm area — resizable corners, no 4-part split) */}
              <FarmLeafletMap
                mode="onboarding"
                center={[coords.lat, coords.lng]}
                boundary={boundary}
                heightClass="h-[350px] sm:h-[385px]"
                onChangeLocation={handleMapLocationChange}
                onChangeBoundary={handleMapBoundaryChange}
              />

              {/* Direct Farm Area Size Resizer Controls */}
              <div className="bg-[#FFFEFB] border border-[#DFDDD6] rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-[#111111]">
                      Resize Farm Area (Hectares)
                    </div>
                    <div className="text-[11px] text-[#6F6F6F]">
                      Drag the slider, enter size, or drag any yellow corner directly on the map
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={2}
                      max={300}
                      step={1}
                      value={Math.round(areaHectares)}
                      onChange={(e) => handleResizeHectares(Number(e.target.value))}
                      aria-label="Farm area in hectares"
                      className="w-20 px-2.5 py-1.5 bg-[#F5F4F0] border border-[#D1D1D1] rounded-lg font-mono-tech text-sm font-extrabold text-[#111111] text-right focus:outline-none focus:border-[#00873A]"
                    />
                    <span className="font-mono-tech text-xs font-bold text-[#474747]">ha</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={5}
                  max={250}
                  step={1}
                  value={Math.min(250, Math.max(5, Math.round(areaHectares)))}
                  onChange={(e) => handleResizeHectares(Number(e.target.value))}
                  aria-label="Resize farm boundary area slider"
                  className="w-full accent-[#00873A] cursor-pointer"
                />

                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {[10, 25, 50, 100, 150].map((haPreset) => {
                      const isNear = Math.abs(areaHectares - haPreset) < 2;
                      return (
                        <button
                          key={haPreset}
                          type="button"
                          onClick={() => handleResizeHectares(haPreset)}
                          className={`px-2.5 py-1 rounded-full font-mono-tech text-[11px] font-bold border transition cursor-pointer ${
                            isNear
                              ? 'bg-[#111111] text-[#EBB40E] border-[#111111]'
                              : 'bg-[#F5F4F0] text-[#474747] border-[#D9D9D9] hover:border-[#111111]'
                          }`}
                        >
                          {haPreset} ha
                        </button>
                      );
                    })}
                  </div>
                  <span className="font-mono-tech text-[11px] text-[#6F6F6F]">
                    ≈ {(areaHectares * 2.471).toFixed(1)} acres
                  </span>
                </div>
              </div>

              {/* Live Coordinates & Simulated NASA Satellite Baseline Preview */}
              <div className="bg-[#F5F4F0] border border-[#DFDDD6] p-4 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#111111]">
                    <Satellite className="w-4 h-4 text-[#00873A]" />
                    <span>NASA Baseline Preview · {regionLabel}</span>
                  </div>
                  <span className="font-mono-tech text-[11px] text-[#474747]">
                    {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-white border border-[#E2E0D8] p-2.5 rounded-lg">
                    <div className="text-[10px] font-semibold uppercase text-[#6F6F6F]">
                      SMAP Moisture
                    </div>
                    <div className="font-mono-tech text-sm font-bold text-[#00873A]">
                      {previewNasa.smapSoilMoisturePct}%
                    </div>
                  </div>
                  <div className="bg-white border border-[#E2E0D8] p-2.5 rounded-lg">
                    <div className="text-[10px] font-semibold uppercase text-[#6F6F6F]">
                      MODIS Temp
                    </div>
                    <div className="font-mono-tech text-sm font-bold text-[#111111]">
                      {previewNasa.modisSurfaceTempC}°C
                    </div>
                  </div>
                  <div className="bg-white border border-[#E2E0D8] p-2.5 rounded-lg">
                    <div className="text-[10px] font-semibold uppercase text-[#6F6F6F]">
                      NDVI Index
                    </div>
                    <div className="font-mono-tech text-sm font-bold text-[#00873A]">
                      {previewNasa.ndviBaseline}
                    </div>
                  </div>
                  <div className="bg-white border border-[#E2E0D8] p-2.5 rounded-lg">
                    <div className="text-[10px] font-semibold uppercase text-[#6F6F6F]">
                      Annual Rain
                    </div>
                    <div className="font-mono-tech text-sm font-bold text-[#111111]">
                      {previewNasa.annualPrecipMm} mm
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE — Farmer & Farm Baseline Info Form */}
            <form
              onSubmit={handleRegisterSubmit}
              className="lg:col-span-6 bg-white border border-[#D9D9D9] p-6 sm:p-8 space-y-6"
            >
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#00873A]">
                  <Sprout className="w-3.5 h-3.5" />
                  Step 2 · Farmer &amp; Baseline Farm Profile
                </div>
                <h2 className="text-2xl font-bold text-[#111111] mt-0.5">
                  Initialize Your Farm Account
                </h2>
                <p className="text-sm text-[#6F6F6F] mt-1">
                  Combine your on-ground baseline data with NASA orbital passes for those exact
                  coordinates.
                </p>
              </div>

              {/* Farmer Account Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#474747] mb-1.5">
                    Farmer Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#6F6F6F] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      required
                      type="text"
                      value={farmerName}
                      onChange={(e) => setFarmerName(e.target.value)}
                      placeholder="e.g. Amine Ben Salem"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#FFFEFB] border border-[#D1D1D1] rounded-lg text-sm focus:outline-none focus:border-[#00873A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#474747] mb-1.5">
                    Farm / Estate Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="e.g. El-Khadhra Valley Estate"
                    className="w-full px-3.5 py-2.5 bg-[#FFFEFB] border border-[#D1D1D1] rounded-lg text-sm focus:outline-none focus:border-[#00873A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#474747] mb-1.5">
                    Email Address *
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="amine@medjerdafarms.tn"
                    className="w-full px-3.5 py-2.5 bg-[#FFFEFB] border border-[#D1D1D1] rounded-lg text-sm focus:outline-none focus:border-[#00873A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#474747] mb-1.5">
                    Password *
                  </label>
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="w-full px-3.5 py-2.5 bg-[#FFFEFB] border border-[#D1D1D1] rounded-lg text-sm focus:outline-none focus:border-[#00873A]"
                  />
                </div>
              </div>

              {/* Soil Type */}
              <div className="pt-4 border-t border-[#EFECE6] space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#111111]">
                  Soil Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SOIL_TYPES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSoilType(st)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border text-left flex items-center justify-between transition cursor-pointer ${
                        soilType === st
                          ? 'bg-[#00873A] text-white border-[#00873A]'
                          : 'bg-[#FFFEFB] text-[#474747] border-[#D1D1D1] hover:border-[#111111]'
                      }`}
                    >
                      <span>{st}</span>
                      {soilType === st && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Available Resources: Irrigation & Water Access */}
              <div className="pt-4 border-t border-[#EFECE6] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                    <Droplets className="w-3.5 h-3.5 text-[#00873A]" />
                    Irrigation System
                  </label>
                  <select
                    value={irrigationType}
                    onChange={(e) => setIrrigationType(e.target.value as IrrigationType)}
                    className="w-full px-3 py-2.5 bg-[#FFFEFB] border border-[#D1D1D1] rounded-lg text-sm font-medium focus:outline-none focus:border-[#00873A]"
                  >
                    {IRRIGATION_TYPES.map((ir) => (
                      <option key={ir} value={ir}>
                        {ir}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                    Water Access Availability
                  </label>
                  <select
                    value={waterAccess}
                    onChange={(e) => setWaterAccess(e.target.value as WaterAccessLevel)}
                    className="w-full px-3 py-2.5 bg-[#FFFEFB] border border-[#D1D1D1] rounded-lg text-sm font-medium focus:outline-none focus:border-[#00873A]"
                  >
                    {WATER_ACCESS_LEVELS.map((wa) => (
                      <option key={wa} value={wa}>
                        {wa}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Available Equipment */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#111111]">
                  <Tractor className="w-3.5 h-3.5 text-[#00873A]" />
                  Available Farm Equipment &amp; Sensors
                </label>
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT_OPTIONS.map((eq) => {
                    const active = equipment.includes(eq);
                    return (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => toggleEquipment(eq)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                          active
                            ? 'bg-[#111111] text-white border-[#111111]'
                            : 'bg-[#F5F4F0] text-[#474747] border-[#D9D9D9] hover:border-[#111111]'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {eq}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Previous Crop History */}
              <div className="pt-4 border-t border-[#EFECE6] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#111111]">
                    Previous Crop History (Recent Seasons)
                  </label>
                  <span className="text-[11px] font-semibold text-[#00873A]">
                    {previousCrops.length} selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PREVIOUS_CROP_OPTIONS.map((crop) => {
                    const active = previousCrops.includes(crop);
                    return (
                      <button
                        key={crop}
                        type="button"
                        onClick={() => togglePreviousCrop(crop)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                          active
                            ? 'bg-[#EBB40E] text-[#111111] border-[#111111]'
                            : 'bg-white text-[#474747] border-[#D1D1D1] hover:border-[#111111]'
                        }`}
                      >
                        {crop}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="btn-harvest w-full !min-h-[50px] text-[15px]">
                  <Satellite className="w-4 h-4" />
                  Initialize Account &amp; Sync NASA Satellite Baseline
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* NASA Satellite Baseline Sync Overlay */}
      {isInitializing && (
        <div className="fixed inset-0 z-50 bg-[#111111]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFEFB] border border-[#D9D9D9] max-w-md w-full p-7 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#EBB40E] flex items-center justify-center">
                <Satellite className="w-5 h-5 text-[#111111]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#111111]">Calibrating NASA Baseline</h3>
                <p className="text-xs font-mono-tech text-[#00873A]">
                  {coords.lat.toFixed(4)}°N · {coords.lng.toFixed(4)}°E · {areaHectares} ha
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              {[
                'Fetching NASA SMAP L4 root-zone soil moisture...',
                'Sampling MODIS land surface temperature & rainfall...',
                'Validating farm parcel boundary & area telemetry...',
                'Computing initial AI crop rotation roadmap...',
              ].map((stepLabel, idx) => {
                const done = initStep > idx;
                const active = initStep === idx;
                return (
                  <div key={stepLabel} className="flex items-center gap-2.5">
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-[#00873A] shrink-0" />
                    ) : active ? (
                      <Loader2 className="w-4 h-4 text-[#EBB40E] animate-spin shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-[#D1D1D1] shrink-0" />
                    )}
                    <span
                      className={
                        done
                          ? 'text-[#111111] font-semibold'
                          : active
                            ? 'text-[#111111] font-medium'
                            : 'text-[#979797]'
                      }
                    >
                      {stepLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
