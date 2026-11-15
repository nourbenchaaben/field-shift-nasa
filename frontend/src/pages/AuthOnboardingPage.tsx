import React, { useMemo, useRef, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { BrandMark } from '../components/BrandMark';
import { FarmLeafletMap } from '../components/FarmLeafletMap';
import { CountryOption, GLOBAL_COUNTRIES } from '../data/countries';
import { GLOBAL_CROPS } from '../data/decisionEngine';
import {
  buildDefaultBoundary,
  computePolygonAreaHectares,
  getPolygonCenter,
  scaleBoundaryToHectares,
} from '../data/agronomyData';
import { resolveSlopeDegrees } from '../api/nasaPowerService';
import { IrrigationType, SlopeOption, SoilType } from '../types/farm';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Globe,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Search,
  Sparkles,
  User,
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

export const AuthOnboardingPage: React.FC = () => {
  const { authTab, navigate, loginWithCredentials, loginDemoAccount, registerAccount } = useFarm();
  const [tab, setTab] = useState<'login' | 'register'>(authTab);

  // Login state
  const [loginEmail, setLoginEmail] = useState('amine@medjerdafarms.tn');
  const [loginPassword, setLoginPassword] = useState('tadawol123');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Registration state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [farmName, setFarmName] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(GLOBAL_COUNTRIES[0]);
  const [coords, setCoords] = useState<[number, number]>([
    GLOBAL_COUNTRIES[0].lat,
    GLOBAL_COUNTRIES[0].lng,
  ]);
  const [boundary, setBoundary] = useState<[number, number][]>(() =>
    scaleBoundaryToHectares(
      buildDefaultBoundary(GLOBAL_COUNTRIES[0].lat, GLOBAL_COUNTRIES[0].lng),
      28
    )
  );
  const [soilType, setSoilType] = useState<SoilType>(GLOBAL_COUNTRIES[0].defaultSoil);
  const [slopeOption, setSlopeOption] = useState<SlopeOption>('Auto-detect via SRTM Elevation');
  const [irrigationType, setIrrigationType] = useState<IrrigationType>('Drip');
  const [equipment, setEquipment] = useState<string[]>([
    'Tractor & Disc Harrow',
    'No-Till Seeder',
  ]);
  const [lastSeason1, setLastSeason1] = useState('Wheat');
  const [lastSeason2, setLastSeason2] = useState('Maize (Corn)');
  const [submitting, setSubmitting] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  const areaHa = useMemo(() => computePolygonAreaHectares(boundary), [boundary]);

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return GLOBAL_COUNTRIES;
    return GLOBAL_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.regionHint.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  const handleSelectCountry = (country: CountryOption) => {
    setSelectedCountry(country);
    setCoords([country.lat, country.lng]);
    setBoundary(
      scaleBoundaryToHectares(buildDefaultBoundary(country.lat, country.lng), areaHa || 25)
    );
    setSoilType(country.defaultSoil);
  };

  const handleMapPin = (lat: number, lng: number) => {
    setCoords([lat, lng]);
    setBoundary(scaleBoundaryToHectares(buildDefaultBoundary(lat, lng), areaHa || 25));
  };

  const handleBoundaryChange = (nextPoly: [number, number][]) => {
    setBoundary(nextPoly);
    setCoords(getPolygonCenter(nextPoly));
  };

  const handleAreaSlider = (targetHa: number) => {
    setBoundary((prev) => scaleBoundaryToHectares(prev, targetHa));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/') || f.size > 5 * 1024 * 1024) {
      setRegistrationError('Photo must be an image smaller than 5 MB.');
      e.target.value = '';
      return;
    }
    setRegistrationError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setPhotoDataUrl(reader.result);
    };
    reader.readAsDataURL(f);
  };

  const toggleEquip = (item: string) => {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const res = loginWithCredentials(loginEmail, loginPassword);
    if (!res.ok) setLoginError(res.error ?? 'Login failed.');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationError(null);
    setSubmitting(true);
    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }
      const coordObj = { lat: coords[0], lng: coords[1] };
      const resolvedSlopeDeg = resolveSlopeDegrees(slopeOption, coordObj);
      await registerAccount(
        {
          name: fullName.trim(),
          email: email.trim(),
          photoDataUrl,
          farmName: farmName.trim(),
          countryCode: selectedCountry.code,
          countryName: selectedCountry.name,
          countryFlag: selectedCountry.flag,
          climateZone: selectedCountry.climateZone,
          regionLabel: `${selectedCountry.regionHint}, ${selectedCountry.name}`,
          coordinates: coordObj,
          areaHectares: areaHa,
          boundary,
          soilType,
          slopeOption,
          slopeDeg: resolvedSlopeDeg,
          irrigationType,
          equipment: equipment.length > 0 ? equipment : ['Tractor & Disc Harrow'],
          previousCrops: [lastSeason1, lastSeason2],
        },
        password
      );
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#111111] flex flex-col">
      {/* Compact Header */}
      <header className="bg-[#FFFEFB] border-b border-[#DFDDD6] h-[72px] px-5 sm:px-8 flex items-center justify-between">
        <button type="button" onClick={() => navigate('landing')} className="cursor-pointer">
          <BrandMark />
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer ${
              tab === 'login' ? 'bg-[#111111] text-white' : 'text-[#474747] hover:text-[#111111]'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer ${
              tab === 'register'
                ? 'bg-[#EBB40E] text-[#111111]'
                : 'text-[#474747] hover:text-[#111111]'
            }`}
          >
            Register New Farm
          </button>
          <button
            type="button"
            onClick={() => navigate('landing')}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#D9D9D9] text-xs font-semibold text-[#474747] hover:border-[#111111] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Home
          </button>
        </div>
      </header>

      {/* LOGIN VIEW */}
      {tab === 'login' ? (
        <div className="flex-1 flex items-center justify-center p-5 sm:p-8">
          <div className="max-w-md w-full surface-card p-7 sm:p-8 space-y-6">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#00873A]">
                <Globe className="w-4 h-4" />
                Welcome Back to Tadawol
              </span>
              <h1 className="text-2xl font-extrabold text-[#111111]">Sign in to your farm</h1>
              <p className="text-xs sm:text-sm text-[#6F6F6F]">
                Access your live NASA POWER weather insights, Farm Calendar, and AI Rotation Lab.
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-[#FCEBE6] border border-[#E7A18E] text-xs text-[#8C2B11] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6F6F6F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@farm.org"
                    autoComplete="email"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6F6F6F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                  />
                </div>
              </div>

              <button type="submit" className="w-full btn-pill btn-pill-primary text-sm">
                Sign In to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="relative py-1">
              <div className="border-t border-[#E5E3DB]" />
              <span className="bg-[#FFFEFB] px-3 text-[11px] font-semibold text-[#6F6F6F] absolute left-1/2 -translate-x-1/2 -top-1.5">
                Quick Access
              </span>
            </div>

            <button
              type="button"
              onClick={loginDemoAccount}
              className="w-full p-3.5 rounded-xl bg-[#E3F5EB] hover:bg-[#D2EEDF] border border-[#B9E2CB] text-left flex items-center justify-between gap-3 transition cursor-pointer"
            >
              <div>
                <div className="text-xs font-extrabold text-[#005A26]">
                  1-Click Demo Farmer Login (🇹🇳 Tunisia)
                </div>
                <div className="text-[11px] text-[#007331]">
                  Amine Ben Salem · El-Khadhra Valley Farm · Live NASA POWER ready
                </div>
              </div>
              <Sparkles className="w-5 h-5 text-[#00873A] shrink-0" />
            </button>

            <p className="text-center text-xs text-[#6F6F6F]">
              New to Tadawol?{' '}
              <button
                type="button"
                onClick={() => setTab('register')}
                className="font-bold text-[#00873A] hover:underline cursor-pointer"
              >
                Register your global farm here →
              </button>
            </p>
          </div>
        </div>
      ) : (
        /* REGISTER + GLOBAL MAP ONBOARDING VIEW */
        <div className="flex-1 max-w-[1380px] w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Interactive Global Map (Single Unified Resizable Farm Surface) */}
          <div className="lg:col-span-6 lg:sticky lg:top-6 space-y-4">
            <div className="surface-card p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#00873A]">
                    Step 1 · Pin Your Global Location
                  </span>
                  <h2 className="text-lg font-extrabold text-[#111111]">
                    {selectedCountry.flag} {selectedCountry.name} Field Map
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#111111] text-[#EBB40E] font-mono-tech text-xs font-bold">
                  {coords[0].toFixed(4)}°, {coords[1].toFixed(4)}°
                </span>
              </div>

              {/* Country Quick-Search Map Auto-Center */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#6F6F6F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search any country to auto-center map (e.g., Brazil, India, USA, Kenya, France)..."
                    className="w-full pl-10 pr-3 py-2 bg-[#F5F4F0] border border-[#D1D1D1] rounded-full text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                  />
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {filteredCountries.slice(0, 12).map((c) => {
                    const active = c.code === selectedCountry.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleSelectCountry(c)}
                        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition cursor-pointer ${
                          active
                            ? 'bg-[#00873A] text-white border-[#00873A]'
                            : 'bg-white text-[#474747] border-[#D9D9D9] hover:border-[#111111]'
                        }`}
                      >
                        <span>{c.flag}</span>
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <FarmLeafletMap
                mode="onboarding"
                center={coords}
                boundary={boundary}
                heightClass="h-[370px] sm:h-[420px]"
                onChangeLocation={handleMapPin}
                onChangeBoundary={handleBoundaryChange}
              />

              {/* Single-Surface Area Resizer */}
              <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-[#E2E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-[#474747]">
                  <MapPin className="w-4 h-4 text-[#00873A] shrink-0" />
                  <span>
                    Unified Farm Size:{' '}
                    <strong className="text-[#111111]">{areaHa.toFixed(1)} hectares</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] text-[#6F6F6F]">5 ha</span>
                  <input
                    type="range"
                    min={5}
                    max={200}
                    step={1}
                    value={Math.min(200, Math.max(5, Math.round(areaHa)))}
                    onChange={(e) => handleAreaSlider(Number(e.target.value))}
                    className="w-36 accent-[#00873A] cursor-pointer"
                  />
                  <span className="text-[11px] text-[#6F6F6F]">200 ha</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Farmer Registration & Soil/History Form */}
          <form
            onSubmit={handleRegisterSubmit}
            className="lg:col-span-6 surface-card p-6 sm:p-7 space-y-5"
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#00873A]">
                Step 2 · Your Profile &amp; Farm Details
              </span>
              <h1 className="text-2xl font-extrabold text-[#111111]">Register your farm</h1>
              <p className="text-xs text-[#6F6F6F] mt-1">
                Syncs 5 years of NASA POWER rainfall, frost, and root-zone wetness for your coordinates.
              </p>
            </div>

            {registrationError && (
              <div className="p-3 rounded-xl bg-[#FCEBE6] border border-[#E7A18E] text-xs text-[#8C2B11] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{registrationError}</span>
              </div>
            )}

            {/* Optional Profile Photo Upload */}
            <div className="flex items-center gap-4 p-3.5 rounded-xl bg-[#F5F4F0] border border-[#E2E0D8]">
              <div className="relative shrink-0">
                {photoDataUrl ? (
                  <img
                    src={photoDataUrl}
                    alt="Farmer avatar preview"
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#00873A]"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#00873A] text-white flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-[#D1D1D1] flex items-center justify-center text-xs shadow">
                  {selectedCountry.flag}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-[#111111]">Profile Photo (Optional)</div>
                <p className="text-[11px] text-[#6F6F6F]">
                  Shown in your top bar alongside your {selectedCountry.flag} country badge.
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#D1D1D1] hover:border-[#111111] text-[11px] font-bold text-[#111111] cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-[#00873A]" />
                  {photoDataUrl ? 'Change Photo' : 'Upload Photo'}
                </button>
              </div>
            </div>

            {/* Name, Email, Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Carlos Mendez"
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  className="w-full px-3.5 py-2.5 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Farm Name *</label>
                <input
                  type="text"
                  required
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="e.g. Valley Green Farm"
                  minLength={2}
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@example.com"
                  autoComplete="email"
                  className="w-full px-3.5 py-2.5 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Password *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8+ chars, upper/lowercase and number"
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                />
              </div>
            </div>

            {/* Full Country Dropdown */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Country (All Global Regions)
              </label>
              <select
                value={selectedCountry.code}
                onChange={(e) => {
                  const found = GLOBAL_COUNTRIES.find((c) => c.code === e.target.value);
                  if (found) handleSelectCountry(found);
                }}
                className="w-full px-3.5 py-2.5 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:border-[#00873A]"
              >
                {GLOBAL_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} — {c.climateZone}
                  </option>
                ))}
              </select>
            </div>

            {/* Simple Soil Type Picker */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Soil Type (Plain Description)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {SOIL_OPTIONS.map((opt) => {
                  const active = soilType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSoilType(opt.value)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        active
                          ? 'bg-[#00873A] text-white border-[#00873A]'
                          : 'bg-[#F5F4F0] text-[#111111] border-[#D9D9D9] hover:border-[#111111]'
                      }`}
                    >
                      <div className="text-xs font-extrabold">{opt.value}</div>
                      <div
                        className={`text-[10px] leading-tight mt-0.5 ${
                          active ? 'text-white/80' : 'text-[#6F6F6F]'
                        }`}
                      >
                        {opt.note}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Field Slope & Irrigation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Field Slope (Optional)
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
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Water &amp; Irrigation
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

            {/* Equipment Chips */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Available Farm Equipment
              </label>
              <div className="flex flex-wrap gap-1.5">
                {EQUIPMENT_LIST.map((item) => {
                  const selected = equipment.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleEquip(item)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
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

            {/* Last 1–2 Seasons Crop History */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Most Recent Crop Grown
                </label>
                <select
                  value={lastSeason1}
                  onChange={(e) => setLastSeason1(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                >
                  {CROP_OPTIONS.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.family})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Previous Season Crop (Before That)
                </label>
                <select
                  value={lastSeason2}
                  onChange={(e) => setLastSeason2(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                >
                  {CROP_OPTIONS.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.family})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-pill btn-pill-primary text-sm sm:text-base disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting Live NASA POWER &amp; Creating Farm...
                </>
              ) : (
                <>
                  Create Account &amp; Sync NASA POWER
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
