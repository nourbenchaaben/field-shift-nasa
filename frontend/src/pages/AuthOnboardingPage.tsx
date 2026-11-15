import React, { useMemo, useRef, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { ThemeToggleButton } from '../context/ThemeContext';
import { BrandMark } from '../components/BrandMark';
import { FarmLeafletMap } from '../components/FarmLeafletMap';
import {
  LocationCascadePicker,
  LocationSelection,
} from '../components/LocationCascadePicker';
import { CountryOption, GLOBAL_COUNTRIES } from '../data/countries';
import { GLOBAL_CROPS } from '../data/decisionEngine';
import {
  buildDefaultBoundary,
  computePolygonAreaHectares,
  getPolygonCenter,
  scaleBoundaryToHectares,
} from '../data/agronomyData';
import { resolveSlopeDegrees } from '../api/nasaPowerService';
import { FarmFinanceDraft, FarmFinanceFields } from '../components/FarmFinanceFields';
import { getDefaultCurrencyForCountry } from '../data/regionalMarketData';
import { IrrigationType, SlopeOption, SoilType } from '../types/farm';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  Mail,
  MapPin,
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
  const {
    authTab,
    navigate,
    loginWithCredentials,
    registerAccount,
    showToast,
  } = useFarm();
  const [tab, setTab] = useState<'login' | 'register'>(authTab);

  const [loginBusy, setLoginBusy] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Registration state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [farmName, setFarmName] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(GLOBAL_COUNTRIES[0]);
  const [selectedStateName, setSelectedStateName] = useState<string>('');
  const [selectedLocalityName, setSelectedLocalityName] = useState<string>('');
  const [regionLabel, setRegionLabel] = useState<string>(GLOBAL_COUNTRIES[0].regionHint);
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
  const [financeDraft, setFinanceDraft] = useState<FarmFinanceDraft>(() => ({
    enabled: false,
    currencyCode: getDefaultCurrencyForCountry(GLOBAL_COUNTRIES[0].code).code,
    seasonBudgetCapacity: '',
    operatingCostPerHa: '',
    fertilizerCostPerHa: '',
    lastSeasonNetProfit: '',
    targetAnnualProfit: '',
    irrigationEnergyCostPerHa: '',
  }));
  const [currencyManuallyPicked, setCurrencyManuallyPicked] = useState(false);
  const [financeValidationError, setFinanceValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const areaHa = useMemo(() => computePolygonAreaHectares(boundary), [boundary]);

  const fillDemoLogin = () => {
    setLoginEmail('demo@tadawol.app');
    setLoginPassword('tadawol123');
    setLoginError(null);
  };

  const fillDemoRegistration = () => {
    const tunisia = GLOBAL_COUNTRIES.find((country) => country.code === 'TN');
    if (tunisia) setSelectedCountry(tunisia);
    const lat = 36.8142;
    const lng = 9.8635;
    setSelectedStateName('Manouba Governorate');
    setSelectedLocalityName('Medjerda Valley');
    setRegionLabel('Medjerda Valley, Tunisia');
    setCoords([lat, lng]);
    setBoundary(scaleBoundaryToHectares(buildDefaultBoundary(lat, lng), 28));
    setFullName('Amine Ben Salem');
    setFarmName('El-Khadhra Valley Farm');
    setEmail('sample.farmer@tadawol.app');
    setPassword('TadawolDemo2026!');
    setSoilType('Loamy');
    setSlopeOption('Gentle Slope');
    setIrrigationType('Drip');
    setEquipment(['Tractor & Basic Plow', 'Drip Irrigation Lines', 'Soil Moisture Sensor']);
    setLastSeason1(CROP_OPTIONS.find((crop) => /wheat/i.test(crop.name))?.name ?? CROP_OPTIONS[0].name);
    setLastSeason2(CROP_OPTIONS.find((crop) => /barley/i.test(crop.name))?.name ?? CROP_OPTIONS[1].name);
    setFinanceDraft({
      enabled: true,
      currencyCode: 'TND',
      seasonBudgetCapacity: '42000',
      operatingCostPerHa: '1180',
      fertilizerCostPerHa: '320',
      lastSeasonNetProfit: '26500',
      targetAnnualProfit: '32000',
      irrigationEnergyCostPerHa: '145',
    });
    setCurrencyManuallyPicked(true);
    setRegisterError(null);
    setFinanceValidationError(null);
  };

  const handleLocationSelect = (sel: LocationSelection) => {
    const countryChanged = sel.country.code !== selectedCountry.code;
    setSelectedCountry(sel.country);
    setSelectedStateName(sel.stateName ?? '');
    setSelectedLocalityName(sel.localityName ?? '');
    setRegionLabel(sel.regionLabel);
    setCoords([sel.lat, sel.lng]);
    setBoundary(
      scaleBoundaryToHectares(buildDefaultBoundary(sel.lat, sel.lng), areaHa || 25)
    );
    if (countryChanged) {
      setSoilType(sel.country.defaultSoil);
      if (!currencyManuallyPicked) {
        setFinanceDraft((prev) => ({
          ...prev,
          currencyCode: getDefaultCurrencyForCountry(sel.country.code).code,
        }));
      }
    }
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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim())) {
      setLoginError('Please enter a valid email address.');
      return;
    }
    setLoginBusy(true);
    try {
      const res = await loginWithCredentials(loginEmail, loginPassword);
      if (!res.ok) setLoginError(res.error ?? 'Login failed.');
    } finally {
      setLoginBusy(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setFinanceValidationError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setRegisterError('Please enter a valid email address.');
      return;
    }
    if (financeDraft.enabled) {
      const cap = Number(financeDraft.seasonBudgetCapacity);
      const op = Number(financeDraft.operatingCostPerHa);
      const fert = Number(financeDraft.fertilizerCostPerHa);
      if (
        !Number.isFinite(cap) ||
        cap <= 0 ||
        !Number.isFinite(op) ||
        op <= 0 ||
        financeDraft.fertilizerCostPerHa === '' ||
        !Number.isFinite(fert) ||
        fert < 0
      ) {
        setFinanceValidationError(
          'Please enter Season Cash Capacity, Avg. Cost / ha, and Fertilizer / ha (or click "Fill typical range").'
        );
        return;
      }
    }
    setSubmitting(true);
    const coordObj = { lat: coords[0], lng: coords[1] };
    const resolvedSlopeDeg = resolveSlopeDegrees(slopeOption, coordObj);
    const res = await registerAccount(
      {
        name: fullName.trim() || 'Global Farmer',
        email: email.trim() || `farmer.${Date.now()}@tadawol.org`,
        photoDataUrl,
        farmName: farmName.trim() || `${selectedCountry.name} Heritage Farm`,
        countryCode: selectedCountry.code,
        countryName: selectedCountry.name,
        countryFlag: selectedCountry.flag,
        stateName: selectedStateName || undefined,
        localityName: selectedLocalityName || undefined,
        climateZone: selectedCountry.climateZone,
        regionLabel: regionLabel || `${selectedCountry.regionHint}, ${selectedCountry.name}`,
        coordinates: coordObj,
        areaHectares: areaHa,
        boundary,
        soilType,
        slopeOption,
        slopeDeg: resolvedSlopeDeg,
        irrigationType,
        equipment: equipment.length > 0 ? equipment : ['Tractor & Disc Harrow'],
        previousCrops: [lastSeason1, lastSeason2],
        financeInputs: financeDraft.enabled
          ? {
              enabled: true,
              currencyCode: financeDraft.currencyCode,
              seasonBudgetCapacityLocal:
                Number(financeDraft.seasonBudgetCapacity) > 0
                  ? Math.round(Number(financeDraft.seasonBudgetCapacity))
                  : undefined,
              operatingCostPerHaLocal:
                Number(financeDraft.operatingCostPerHa) > 0
                  ? Math.round(Number(financeDraft.operatingCostPerHa))
                  : undefined,
              fertilizerCostPerHaLocal:
                financeDraft.fertilizerCostPerHa !== '' &&
                Number(financeDraft.fertilizerCostPerHa) >= 0
                  ? Math.round(Number(financeDraft.fertilizerCostPerHa))
                  : undefined,
              lastSeasonNetProfitLocal:
                financeDraft.lastSeasonNetProfit !== '' &&
                Number.isFinite(Number(financeDraft.lastSeasonNetProfit))
                  ? Math.round(Number(financeDraft.lastSeasonNetProfit))
                  : undefined,
              targetAnnualProfitLocal:
                Number(financeDraft.targetAnnualProfit) > 0
                  ? Math.round(Number(financeDraft.targetAnnualProfit))
                  : undefined,
              irrigationEnergyCostPerHaLocal:
                financeDraft.irrigationEnergyCostPerHa !== '' &&
                Number(financeDraft.irrigationEnergyCostPerHa) >= 0
                  ? Math.round(Number(financeDraft.irrigationEnergyCostPerHa))
                  : undefined,
              includeSubsidies: true,
              updatedAt: new Date().toISOString(),
            }
          : {
              enabled: false,
              currencyCode: financeDraft.currencyCode,
              includeSubsidies: true,
            },
      },
      password
    );
    setSubmitting(false);
    if (!res.ok && res.error) {
      setRegisterError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#111111] flex flex-col">
      {/* Compact Header */}
      <header className="bg-[#FFFEFB] border-b border-[#DFDDD6] h-[72px] px-5 sm:px-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('landing')}
          title="Back to Homepage"
          aria-label="Tadawol: Back to Homepage"
          className="cursor-pointer hover:opacity-90 transition"
        >
          <BrandMark />
        </button>

        <div className="flex items-center gap-2">
          <ThemeToggleButton compact />
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

            <button
              type="button"
              onClick={fillDemoLogin}
              className="w-full rounded-xl border border-[#B7DCC5] bg-[#EAF6EE] px-4 py-3 text-left text-xs font-bold text-[#005222] hover:bg-[#DFF1E5] cursor-pointer"
            >
              Fill demo login · demo@tadawol.app
              <span className="mt-1 block font-medium text-[#3A684B]">Loads the sample farmer account with farm history and NASA sync.</span>
            </button>

            <form onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6F6F6F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    inputMode="email"
                    name="tadawol_signin_contact"
                    required
                    autoComplete="one-time-code"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@farm.org"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#111111]">Password</label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6F6F6F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="tadawol_signin_secret"
                    required
                    autoComplete="one-time-code"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className={`w-full pl-10 pr-10 py-2.5 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A] ${
                      showLoginPassword ? '' : 'password-masked'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((v) => !v)}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A4A4A] hover:text-[#111111] cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginBusy}
                className="w-full btn-pill btn-pill-primary text-sm disabled:opacity-60"
              >
                {loginBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-[#6F6F6F] pt-2 border-t border-[#EFECE6]">
              New to Tadawol?{' '}
              <button
                type="button"
                onClick={() => setTab('register')}
                className="font-bold text-[#00873A] hover:underline cursor-pointer"
              >
                Register your farm here →
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
                    {selectedCountry.flag}{' '}
                    {selectedLocalityName
                      ? `${selectedLocalityName}, ${selectedStateName}`
                      : selectedStateName
                        ? `${selectedStateName}, ${selectedCountry.name}`
                        : `${selectedCountry.name} Field Map`}
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#111111] text-[#EBB40E] font-mono-tech text-xs font-bold">
                  {coords[0].toFixed(4)}°, {coords[1].toFixed(4)}°
                </span>
              </div>

              {/* Cascading Country -> State/Governorate -> Delegation/Area Picker */}
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
                heightClass="h-[370px] sm:h-[420px]"
                onChangeLocation={handleMapPin}
                onChangeBoundary={handleBoundaryChange}
              />

              {/* Farm Size Resizer */}
              <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-[#E2E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#111111]">
                  <MapPin className="w-4 h-4 text-[#00873A] shrink-0" />
                  <span className="font-extrabold text-[#111111] tracking-tight">
                    Farm Size:{' '}
                    <strong className="font-black text-[#111111]">{areaHa.toFixed(1)} hectares</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-semibold text-[#3A3A3A]">5 ha</span>
                  <input
                    type="range"
                    min={5}
                    max={200}
                    step={1}
                    value={Math.min(200, Math.max(5, Math.round(areaHa)))}
                    onChange={(e) => handleAreaSlider(Number(e.target.value))}
                    className="w-36 accent-[#00873A] cursor-pointer"
                  />
                  <span className="text-[11px] font-semibold text-[#3A3A3A]">200 ha</span>
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
              <button
                type="button"
                onClick={fillDemoRegistration}
                className="mt-3 rounded-xl border border-[#B7DCC5] bg-[#EAF6EE] px-4 py-2.5 text-left text-xs font-bold text-[#005222] hover:bg-[#DFF1E5] cursor-pointer"
              >
                Autofill sample farmer details
                <span className="mt-1 block font-medium text-[#3A684B]">Example fields only; submitting creates a separate account and syncs NASA data.</span>
              </button>
            </div>

            {registerError && (
              <div className="p-3 rounded-xl bg-[#FCEBE6] border border-[#E7A18E] text-xs font-semibold text-[#8C2B11] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{registerError}</span>
              </div>
            )}

            <div className="relative flex items-center">
              <div className="flex-1 border-t border-[#E4E1D9]" />
              <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#555555]">
                create a local Tadawol account
              </span>
              <div className="flex-1 border-t border-[#E4E1D9]" />
            </div>
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
                  className="w-full px-3.5 py-2.5 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Email *</label>
                <input
                  type="text"
                  inputMode="email"
                  name="tadawol_reg_contact"
                  required
                  autoComplete="one-time-code"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@example.com"
                  className="w-full px-3.5 py-2.5 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                />
              </div>
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="tadawol_reg_secret"
                      required
                      minLength={6}
                      autoComplete="one-time-code"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className={`w-full pl-3.5 pr-10 py-2.5 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A] ${
                        showRegisterPassword ? '' : 'password-masked'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword((v) => !v)}
                      aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A4A4A] hover:text-[#111111] cursor-pointer"
                    >
                      {showRegisterPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
            </div>

            {/* Selected Location Summary Badge */}
            <div className="p-3.5 rounded-xl bg-[#E3F5EB]/65 border border-[#A8DEC0] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#005222]">
                <span className="text-lg leading-none">{selectedCountry.flag}</span>
                <span>
                  {selectedLocalityName
                    ? `${selectedLocalityName}, ${selectedStateName}, ${selectedCountry.name}`
                    : selectedStateName
                      ? `${selectedStateName}, ${selectedCountry.name}`
                      : `${selectedCountry.name} (${selectedCountry.climateZone})`}
                </span>
              </div>
              <span className="text-xs font-bold text-[#006B2E]">
                {areaHa.toFixed(1)} ha selected
              </span>
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

            {/* Optional Farm Finance & Currency Preference (Checkbox Tick + Required/Optional Capacity & Profit Fields) */}
            <FarmFinanceFields
              draft={financeDraft}
              onChange={(next, manualCurr) => {
                setFinanceDraft(next);
                setFinanceValidationError(null);
                if (manualCurr) setCurrencyManuallyPicked(true);
              }}
              countryCode={selectedCountry.code}
              countryName={selectedCountry.name}
              irrigationType={irrigationType}
              areaHectares={areaHa}
              validationError={financeValidationError}
            />

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
