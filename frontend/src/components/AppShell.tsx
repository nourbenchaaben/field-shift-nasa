import React, { useEffect, useRef, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { ThemeToggleButton } from '../context/ThemeContext';
import { AppScreen, SlopeOption, SoilType } from '../types/farm';
import { BrandMark } from './BrandMark';
import { FarmManagerModal } from './FarmManagerModal';
import {
  LocationCascadePicker,
  LocationSelection,
} from './LocationCascadePicker';
import { SplitAiChatbot } from './SplitAiChatbot';
import { FarmFinanceDraft, FarmFinanceFields } from './FarmFinanceFields';
import { LanguageSelector } from './LanguageSelector';
import { GLOBAL_COUNTRIES } from '../data/countries';
import { getDefaultCurrencyForCountry } from '../data/regionalMarketData';
import { buildDefaultBoundary, scaleBoundaryToHectares } from '../data/agronomyData';
import {
  Bot,
  Camera,
  CheckCircle2,
  Coins,
  History,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Upload,
  X,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS: { id: AppScreen; label: string; sub: string; icon: React.ReactNode }[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    sub: 'Live Field, Calendar & NASA Data',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    id: 'rotation-lab',
    label: 'Rotation Lab',
    sub: 'AI Decision Tool & Custom Plans',
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    id: 'market-finance',
    label: 'Market & Finance',
    sub: '2026 Prices, Profit & Subsidies',
    icon: <Coins className="w-4 h-4" />,
  },
  {
    id: 'predictions',
    label: 'Future Prediction',
    sub: '5-Year Soil & Yield',
    icon: <TrendingUp className="w-4 h-4" />,
  },
  {
    id: 'history',
    label: 'Farm History',
    sub: 'Strategy Roadmap & Past 5 Years',
    icon: <History className="w-4 h-4" />,
  },
];

const SOIL_TYPES: SoilType[] = ['Loamy', 'Clay', 'Sandy', 'Silt', 'Peaty'];
const SLOPE_OPTIONS: SlopeOption[] = [
  'Auto-detect via SRTM Elevation',
  'Flat',
  'Gentle Slope',
  'Steep Slope',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TF';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const {
    screen,
    navigate,
    profile,
    farms,
    activeFarmId,
    switchFarm,
    openAddFarmModal,
    openEditFarmModal,
    logout,
    updateProfile,
    refreshLiveNasaData,
    isFetchingNasa,
    toastMessage,
    isChatOpen,
    setIsChatOpen,
  } = useFarm();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Profile modal draft state
  const [editName, setEditName] = useState(profile.name);
  const [editFarmName, setEditFarmName] = useState(profile.farmName);
  const [editCountryCode, setEditCountryCode] = useState(profile.countryCode);
  const [editStateName, setEditStateName] = useState(profile.stateName ?? '');
  const [editLocalityName, setEditLocalityName] = useState(profile.localityName ?? '');
  const [editRegionLabel, setEditRegionLabel] = useState(profile.regionLabel);
  const [editCoords, setEditCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [editSoil, setEditSoil] = useState<SoilType>(profile.soilType);
  const [editSlope, setEditSlope] = useState<SlopeOption>(profile.slopeOption);
  const [editPhoto, setEditPhoto] = useState<string | undefined>(profile.photoDataUrl);
  const [editFinanceDraft, setEditFinanceDraft] = useState<FarmFinanceDraft>(() => ({
    enabled: Boolean(profile.financeInputs?.enabled),
    currencyCode:
      profile.financeInputs?.currencyCode ??
      getDefaultCurrencyForCountry(profile.countryCode).code,
    seasonBudgetCapacity: profile.financeInputs?.seasonBudgetCapacityLocal
      ? String(profile.financeInputs.seasonBudgetCapacityLocal)
      : '',
    operatingCostPerHa: profile.financeInputs?.operatingCostPerHaLocal
      ? String(profile.financeInputs.operatingCostPerHaLocal)
      : '',
    fertilizerCostPerHa:
      profile.financeInputs?.fertilizerCostPerHaLocal !== undefined
        ? String(profile.financeInputs.fertilizerCostPerHaLocal)
        : '',
    lastSeasonNetProfit:
      profile.financeInputs?.lastSeasonNetProfitLocal !== undefined
        ? String(profile.financeInputs.lastSeasonNetProfitLocal)
        : '',
    targetAnnualProfit: profile.financeInputs?.targetAnnualProfitLocal
      ? String(profile.financeInputs.targetAnnualProfitLocal)
      : '',
    irrigationEnergyCostPerHa:
      profile.financeInputs?.irrigationEnergyCostPerHaLocal !== undefined
        ? String(profile.financeInputs.irrigationEnergyCostPerHaLocal)
        : '',
  }));
  const [profileFinanceError, setProfileFinanceError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openProfileSettings = () => {
    setEditName(profile.name);
    setEditFarmName(profile.farmName);
    setEditCountryCode(profile.countryCode);
    setEditStateName(profile.stateName ?? '');
    setEditLocalityName(profile.localityName ?? '');
    setEditRegionLabel(profile.regionLabel);
    setEditCoords(null);
    setEditSoil(profile.soilType);
    setEditSlope(profile.slopeOption);
    setEditPhoto(profile.photoDataUrl);
    setProfileFinanceError(null);
    setEditFinanceDraft({
      enabled: Boolean(profile.financeInputs?.enabled),
      currencyCode:
        profile.financeInputs?.currencyCode ??
        getDefaultCurrencyForCountry(profile.countryCode).code,
      seasonBudgetCapacity: profile.financeInputs?.seasonBudgetCapacityLocal
        ? String(profile.financeInputs.seasonBudgetCapacityLocal)
        : '',
      operatingCostPerHa: profile.financeInputs?.operatingCostPerHaLocal
        ? String(profile.financeInputs.operatingCostPerHaLocal)
        : '',
      fertilizerCostPerHa:
        profile.financeInputs?.fertilizerCostPerHaLocal !== undefined
          ? String(profile.financeInputs.fertilizerCostPerHaLocal)
          : '',
      lastSeasonNetProfit:
        profile.financeInputs?.lastSeasonNetProfitLocal !== undefined
          ? String(profile.financeInputs.lastSeasonNetProfitLocal)
          : '',
      targetAnnualProfit: profile.financeInputs?.targetAnnualProfitLocal
        ? String(profile.financeInputs.targetAnnualProfitLocal)
        : '',
      irrigationEnergyCostPerHa:
        profile.financeInputs?.irrigationEnergyCostPerHaLocal !== undefined
          ? String(profile.financeInputs.irrigationEnergyCostPerHaLocal)
          : '',
    });
    setProfileModalOpen(true);
  };

  const handleProfileLocationSelect = (sel: LocationSelection) => {
    const prevCountryDefault = getDefaultCurrencyForCountry(editCountryCode).code;
    setEditCountryCode(sel.country.code);
    setEditStateName(sel.stateName ?? '');
    setEditLocalityName(sel.localityName ?? '');
    setEditRegionLabel(sel.regionLabel);
    setEditCoords({ lat: sel.lat, lng: sel.lng });
    if (editFinanceDraft.currencyCode === prevCountryDefault) {
      setEditFinanceDraft((prev) => ({
        ...prev,
        currencyCode: getDefaultCurrencyForCountry(sel.country.code).code,
      }));
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFinanceError(null);
    if (editFinanceDraft.enabled) {
      const cap = Number(editFinanceDraft.seasonBudgetCapacity);
      const op = Number(editFinanceDraft.operatingCostPerHa);
      const fert = Number(editFinanceDraft.fertilizerCostPerHa);
      if (
        !Number.isFinite(cap) ||
        cap <= 0 ||
        !Number.isFinite(op) ||
        op <= 0 ||
        editFinanceDraft.fertilizerCostPerHa === '' ||
        !Number.isFinite(fert) ||
        fert < 0
      ) {
        setProfileFinanceError(
          'Please enter your Season Cash Capacity, Avg. Cost / ha, and Fertilizer / ha (or click "Fill typical range").'
        );
        return;
      }
    }
    setSavingProfile(true);
    const chosenCountry =
      GLOBAL_COUNTRIES.find((c) => c.code === editCountryCode) ?? GLOBAL_COUNTRIES[0];
    const locationChanged =
      editCoords !== null ||
      chosenCountry.code !== profile.countryCode ||
      editStateName !== (profile.stateName ?? '') ||
      editLocalityName !== (profile.localityName ?? '');

    const targetLat = editCoords?.lat ?? chosenCountry.lat;
    const targetLng = editCoords?.lng ?? chosenCountry.lng;

    const newBoundary = locationChanged
      ? scaleBoundaryToHectares(
          buildDefaultBoundary(targetLat, targetLng),
          profile.areaHectares
        )
      : profile.boundary;

    await updateProfile(
      {
        name: editName.trim() || profile.name,
        farmName: editFarmName.trim() || profile.farmName,
        photoDataUrl: editPhoto,
        countryCode: chosenCountry.code,
        countryName: chosenCountry.name,
        countryFlag: chosenCountry.flag,
        stateName: editStateName || undefined,
        localityName: editLocalityName || undefined,
        climateZone: chosenCountry.climateZone,
        regionLabel: editRegionLabel || `${chosenCountry.regionHint}, ${chosenCountry.name}`,
        soilType: editSoil,
        slopeOption: editSlope,
        financeInputs: {
          ...(profile.financeInputs ?? { includeSubsidies: true }),
          enabled: editFinanceDraft.enabled,
          currencyCode: editFinanceDraft.currencyCode,
          seasonBudgetCapacityLocal:
            Number(editFinanceDraft.seasonBudgetCapacity) > 0
              ? Math.round(Number(editFinanceDraft.seasonBudgetCapacity))
              : undefined,
          operatingCostPerHaLocal:
            Number(editFinanceDraft.operatingCostPerHa) > 0
              ? Math.round(Number(editFinanceDraft.operatingCostPerHa))
              : undefined,
          fertilizerCostPerHaLocal:
            editFinanceDraft.fertilizerCostPerHa !== '' &&
            Number(editFinanceDraft.fertilizerCostPerHa) >= 0
              ? Math.round(Number(editFinanceDraft.fertilizerCostPerHa))
              : undefined,
          lastSeasonNetProfitLocal:
            editFinanceDraft.lastSeasonNetProfit !== '' &&
            Number.isFinite(Number(editFinanceDraft.lastSeasonNetProfit))
              ? Math.round(Number(editFinanceDraft.lastSeasonNetProfit))
              : undefined,
          targetAnnualProfitLocal:
            Number(editFinanceDraft.targetAnnualProfit) > 0
              ? Math.round(Number(editFinanceDraft.targetAnnualProfit))
              : undefined,
          irrigationEnergyCostPerHaLocal:
            editFinanceDraft.irrigationEnergyCostPerHa !== '' &&
            Number(editFinanceDraft.irrigationEnergyCostPerHa) >= 0
              ? Math.round(Number(editFinanceDraft.irrigationEnergyCostPerHa))
              : undefined,
          includeSubsidies: profile.financeInputs?.includeSubsidies ?? true,
          updatedAt: new Date().toISOString(),
        },
        ...(locationChanged
          ? {
              coordinates: { lat: targetLat, lng: targetLng },
              boundary: newBoundary,
            }
          : {}),
      },
      locationChanged || editSoil !== profile.soilType
    );

    setSavingProfile(false);
    setProfileModalOpen(false);
  };

  const handleNav = (id: AppScreen) => {
    navigate(id);
    setMobileOpen(false);
  };

  const financeEnabled = Boolean(profile.financeInputs?.enabled);
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => item.id !== 'market-finance' || financeEnabled
  );

  useEffect(() => {
    if (screen === 'market-finance' && !financeEnabled) {
      navigate('dashboard');
    }
  }, [screen, financeEnabled, navigate]);

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#111111] flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-[264px] shrink-0 bg-[#FFFEFB] border-r border-[#DFDDD6] sticky top-0 h-screen z-30">
        <div className="px-5 h-[76px] flex items-center border-b border-[#E8E5DC]">
          <button
            type="button"
            onClick={() => navigate('landing')}
            title="Back to Homepage"
            aria-label="Tadawol Back to Homepage"
            className="text-left cursor-pointer hover:opacity-90 transition"
          >
            <BrandMark />
          </button>
        </div>

        {/* Active Farm Switcher & Multi-Farm Controls */}
        <div className="px-4 pt-4 pb-2">
          <div className="bg-[#F5F4F0] rounded-2xl p-3.5 border border-[#DFDDD6] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006B2E]">
                {farms.length > 1 ? `My Farms (${farms.length})` : 'Active Farm'}
              </span>
              <span className="text-base leading-none" title={profile.countryName}>
                {profile.countryFlag}
              </span>
            </div>

            {farms.length > 1 ? (
              <select
                value={activeFarmId}
                onChange={(e) => switchFarm(e.target.value)}
                aria-label="Switch active farm"
                className="w-full px-3 py-2 bg-white border border-[#C9C6BC] rounded-xl text-xs font-extrabold text-[#111111] focus:outline-none focus:border-[#00873A] cursor-pointer"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.countryFlag} {f.farmName} ({f.areaHectares} ha)
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm font-extrabold text-[#111111] truncate">
                {profile.farmName}
              </div>
            )}

            <div className="text-xs font-medium text-[#2E2E2E] truncate">
              {profile.localityName
                ? `${profile.localityName}, ${profile.stateName}`
                : profile.stateName
                  ? `${profile.stateName}, ${profile.countryName}`
                  : profile.countryName}{' '}
              · {profile.areaHectares} ha · {profile.soilType}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => openEditFarmModal('location-size')}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white hover:bg-[#111111] hover:text-white border border-[#CFCBC2] text-xs font-bold text-[#111111] transition cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Farm
              </button>
              <button
                type="button"
                onClick={openAddFarmModal}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-[#EBB40E] hover:bg-[#111111] hover:text-white text-xs font-extrabold text-[#111111] transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Farm
              </button>
            </div>
          </div>
        </div>

        {/* Primary Navigation Links */}
        <div className="px-5 pt-3 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-[#555555]">
          Workspace
        </div>
        <nav className="flex-1 px-3 pb-3 space-y-1.5 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const active = screen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition cursor-pointer ${
                  active
                    ? 'bg-[#00873A] text-white shadow-sm'
                    : 'text-[#1E1E1E] hover:bg-[#F2F0E8] hover:text-[#111111]'
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    active ? 'bg-white/20 text-white' : 'bg-[#EFECE4] text-[#007432]'
                  }`}
                >
                  {item.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold leading-tight truncate">{item.label}</div>
                  <div
                    className={`text-xs truncate mt-0.5 ${
                      active ? 'text-white/90' : 'text-[#3A3A3A]'
                    }`}
                  >
                    {item.sub}
                  </div>
                </div>
                {active && <span className="w-2 h-2 rounded-full bg-[#EBB40E] shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* Bottom Logout */}
        <div className="p-4 border-t border-[#E8E5DC]">
          <button
            type="button"
            onClick={logout}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-full border border-[#CFCBC2] text-xs font-bold text-[#2E2E2E] hover:bg-[#111111] hover:text-white hover:border-[#111111] transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#111111]/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-[285px] max-w-[85vw] bg-[#FFFEFB] h-full flex flex-col shadow-2xl">
            <div className="px-5 h-[68px] flex items-center justify-between border-b border-[#E8E5DC]">
              <button
                type="button"
                onClick={() => {
                  navigate('landing');
                  setMobileOpen(false);
                }}
                title="Back to Homepage"
                aria-label="Tadawol Back to Homepage"
                className="text-left cursor-pointer hover:opacity-90 transition"
              >
                <BrandMark />
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-full hover:bg-[#F5F4F0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 pt-3 pb-1 space-y-2 border-b border-[#EFECE6]">
              {farms.length > 1 ? (
                <select
                  value={activeFarmId}
                  onChange={(e) => {
                    switchFarm(e.target.value);
                    setMobileOpen(false);
                  }}
                  className="w-full px-2.5 py-2 bg-[#F5F4F0] border border-[#D1D1D1] rounded-lg text-xs font-extrabold text-[#111111]"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.countryFlag} {f.farmName} ({f.areaHectares} ha)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs font-extrabold text-[#111111] truncate">
                  {profile.countryFlag} {profile.farmName} ({profile.areaHectares} ha)
                </div>
              )}
              <div className="grid grid-cols-2 gap-1.5 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    openEditFarmModal('location-size');
                  }}
                  className="inline-flex items-center justify-center gap-1 py-1.5 rounded-lg border border-[#D9D9D9] bg-white text-[11px] font-bold text-[#111111] cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                  Edit Farm
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    openAddFarmModal();
                  }}
                  className="inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#EBB40E] text-[11px] font-extrabold text-[#111111] cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Add Farm
                </button>
              </div>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
              {visibleNavItems.map((item) => {
                const active = screen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition cursor-pointer ${
                      active ? 'bg-[#00873A] text-white' : 'text-[#3B3B3B] hover:bg-[#F5F4F0]'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        active ? 'bg-white/15 text-white' : 'bg-[#F5F4F0] text-[#00873A]'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <div>
                      <div className="text-sm font-extrabold">{item.label}</div>
                      <div className={`text-xs ${active ? 'text-white/90' : 'text-[#3A3A3A]'}`}>
                        {item.sub}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-[#E8E5DC] space-y-2">
              <button
                type="button"
                onClick={logout}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-full border border-[#CFCBC2] text-xs font-bold text-[#2E2E2E] cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Log Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area: Resizes Side-by-Side When SplitAiChatbot Expands */}
      <div className="flex-1 min-w-0 flex flex-col transition-all duration-300">
        {/* Top Bar: "Hello, [Farmer Name]" + Interactive Profile Photo w/ Country Flag Badge */}
        <header className="h-[76px] bg-[#FFFEFB]/95 backdrop-blur-sm border-b border-[#DFDDD6] sticky top-0 z-20 px-5 sm:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-full border border-[#CFCBC2] hover:bg-[#F5F4F0] cursor-pointer shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <h1 className="text-base sm:text-xl font-extrabold text-[#111111] truncate">
                  Hello, {profile.name}
                </h1>
                <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#E3F5EB] text-[#006B2E] text-xs font-extrabold shrink-0">
                  {NAV_ITEMS.find((n) => n.id === screen)?.label ?? 'Workspace'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#3A3A3A] truncate mt-0.5">
                <span>
                  {profile.countryFlag}{' '}
                  {profile.localityName
                    ? `${profile.localityName}, ${profile.stateName}, ${profile.countryName}`
                    : profile.stateName
                      ? `${profile.stateName}, ${profile.countryName}`
                      : profile.countryName}
                </span>
                <span className="text-[#9A968C]">·</span>
                <span className="truncate font-semibold text-[#1E1E1E]">{profile.farmName}</span>
                {profile.email === 'demo@tadawol.app' && (
                  <span className="shrink-0 rounded-full bg-[#FFF4C4] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#6E5100]">
                    Demo data
                  </span>
                )}
                <span className="hidden sm:inline text-[#9A968C]">·</span>
                <span className="hidden sm:inline">{profile.areaHectares} ha</span>
                {isFetchingNasa && (
                  <span className="inline-flex items-center gap-1 text-[#007432] font-bold">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Syncing NASA...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Dark / Light Mode Toggle */}
            <ThemeToggleButton />

            {/* Split-Screen AI Chatbot Toggle */}
            <button
              type="button"
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold border transition cursor-pointer ${
                isChatOpen
                  ? 'bg-[#111111] text-[#EBB40E] border-[#111111]'
                  : 'bg-[#EBB40E] text-[#111111] border-[#EBB40E] hover:bg-[#111111] hover:text-white hover:border-[#111111]'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">{isChatOpen ? 'Close AI Panel' : 'AI Advisor'}</span>
            </button>

            {/* Quick Refresh Live NASA POWER */}
            <button
              type="button"
              onClick={() => void refreshLiveNasaData()}
              disabled={isFetchingNasa}
              title="Refresh live NASA POWER satellite weather & moisture"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#F5F4F0] hover:bg-[#E3F5EB] border border-[#CFCBC2] text-xs font-bold text-[#111111] transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#00873A] ${isFetchingNasa ? 'animate-spin' : ''}`}
              />
              <span>NASA Sync</span>
            </button>

            {/* Interactive Profile Photo Icon with Attached Country Flag Badge */}
            <button
              type="button"
              onClick={openProfileSettings}
              title="Open Profile Settings (Change Photo, Country Flag & Farm Info)"
              className="relative flex items-center gap-2.5 pl-1.5 pr-3.5 py-1 rounded-full bg-[#F5F4F0] hover:bg-[#EAE7DE] border border-[#CFCBC2] transition cursor-pointer"
            >
              <div className="relative shrink-0">
                {profile.photoDataUrl ? (
                  <img
                    src={profile.photoDataUrl}
                    alt={profile.name}
                    className="w-9 h-9 rounded-full object-cover border-2 border-[#00873A]"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#00873A] text-white font-extrabold text-xs flex items-center justify-center border-2 border-white shadow-xs">
                    {getInitials(profile.name)}
                  </div>
                )}
                {/* Country Flag Badge clearly attached to bottom-right of Profile Icon */}
                <span
                  aria-label={`Country: ${profile.countryName}`}
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-[#C9C6BC] shadow-sm flex items-center justify-center text-[11px] leading-none"
                >
                  {profile.countryFlag}
                </span>
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-xs font-extrabold text-[#111111] max-w-[115px] truncate">
                  {profile.name.split(' ')[0]}
                </div>
                <div className="text-[11px] font-medium text-[#3A3A3A]">Profile &amp; Country</div>
              </div>
            </button>
          </div>
        </header>

        {/* Page Main Content */}
        <main className="flex-1 px-5 sm:px-8 py-6 sm:py-7 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Dedicated Resizable Split-Screen AI Chatbot Column (or Compact Dock When Minimized) */}
      <SplitAiChatbot />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[950] max-w-md bg-[#111111] text-white px-5 py-3 rounded-full shadow-2xl border border-[#44BE7E]/40 flex items-center gap-2.5 text-xs sm:text-sm font-medium animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#92D500] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Profile Settings Modal (Upload Photo, Switch Country Flag, Edit Farm, Logout) */}
      {profileModalOpen && (
        <div
          className="fixed inset-0 z-[850] bg-[#111111]/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setProfileModalOpen(false)}
        >
          <div
            className="bg-[#FFFEFB] border border-[#D9D9D9] rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#00873A] text-white flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#92D500]">
                  Farmer Account
                </div>
                <h3 className="text-lg font-extrabold text-white">Profile &amp; Country Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white hover:text-[#111111] flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
              {/* Profile Photo Upload with Instant Live Preview & Attached Flag */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#F5F4F0] border border-[#E2E0D8]">
                <div className="relative shrink-0">
                  {editPhoto ? (
                    <img
                      src={editPhoto}
                      alt="Profile preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#00873A]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#00873A] text-white font-extrabold text-lg flex items-center justify-center border-2 border-white">
                      {getInitials(editName)}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-[#D1D1D1] shadow flex items-center justify-center text-sm">
                    {GLOBAL_COUNTRIES.find((c) => c.code === editCountryCode)?.flag ??
                      profile.countryFlag}
                  </span>
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="text-xs font-bold text-[#111111]">Profile Photo</div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EBB40E] hover:bg-[#111111] hover:text-white text-xs font-bold text-[#111111] transition cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Upload Photo
                    </button>
                    {editPhoto && (
                      <button
                        type="button"
                        onClick={() => setEditPhoto(undefined)}
                        className="px-3 py-1.5 rounded-full bg-white border border-[#D1D1D1] text-xs font-semibold text-[#474747] hover:border-[#111111] cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#3A3A3A]">
                    Instant preview: your selected country flag badge stays attached.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">Farm Name</label>
                  <input
                    type="text"
                    required
                    value={editFarmName}
                    onChange={(e) => setEditFarmName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                  />
                </div>
              </div>

              {/* Live Flagged Country -> State/Governorate -> Delegation/Area Picker */}
              <div className="space-y-1.5">
                <LocationCascadePicker
                  compact
                  countryCode={editCountryCode}
                  stateName={editStateName}
                  localityName={editLocalityName}
                  onSelect={handleProfileLocationSelect}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">Soil Type</label>
                  <select
                    value={editSoil}
                    onChange={(e) => setEditSoil(e.target.value as SoilType)}
                    className="w-full px-3 py-2 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                  >
                    {SOIL_TYPES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Field Slope
                  </label>
                  <select
                    value={editSlope}
                    onChange={(e) => setEditSlope(e.target.value as SlopeOption)}
                    className="w-full px-3 py-2 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                  >
                    {SLOPE_OPTIONS.map((sl) => (
                      <option key={sl} value={sl}>
                        {sl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* App Language Selector (22 languages covering all 42 countries) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#111111]">
                  App Language (22 Languages · All 42 Countries)
                </label>
                <LanguageSelector align="left" />
              </div>

              {/* Optional Farm Finance & Currency Preference (Checkbox Tick + Required/Optional Capacity & Profit Fields) */}
              <FarmFinanceFields
                draft={editFinanceDraft}
                onChange={(next) => {
                  setEditFinanceDraft(next);
                  setProfileFinanceError(null);
                }}
                countryCode={editCountryCode}
                countryName={
                  GLOBAL_COUNTRIES.find((c) => c.code === editCountryCode)?.name ??
                  profile.countryName
                }
                irrigationType={profile.irrigationType}
                areaHectares={profile.areaHectares}
                validationError={profileFinanceError}
              />

              <div className="p-3 rounded-xl bg-[#E3F5EB]/60 border border-[#B8E5CC] flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-[#005A26] font-semibold">
                  Need to resize your parcel, move its pin, or add another farm?
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileModalOpen(false);
                    openEditFarmModal('location-size');
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#00873A] text-white text-[11px] font-bold hover:bg-[#111111] transition cursor-pointer"
                >
                  <MapPin className="w-3 h-3" />
                  Edit Map &amp; Size
                </button>
              </div>

              <div className="pt-3 border-t border-[#EFECE6] flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setProfileModalOpen(false);
                    logout();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#D9D9D9] text-xs font-bold text-[#B83B1A] hover:bg-[#FCEBE6] transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log Out
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setProfileModalOpen(false)}
                    className="px-4 py-2 rounded-full border border-[#D9D9D9] text-xs font-bold text-[#474747] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="btn-pill btn-pill-primary text-xs !px-5 !py-2.5 disabled:opacity-60"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {savingProfile ? 'Syncing NASA...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Multi-Farm Add / Partial Edit Modal */}
      <FarmManagerModal />
    </div>
  );
};
