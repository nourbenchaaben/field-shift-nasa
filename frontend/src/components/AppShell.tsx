import React, { useMemo, useRef, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { AppScreen, SlopeOption, SoilType } from '../types/farm';
import { BrandMark } from './BrandMark';
import { ContractInspectorModal } from './ContractInspectorModal';
import { DataSourcesModal } from './DataSourcesModal';
import { FarmManagerModal } from './FarmManagerModal';
import { SplitAiChatbot } from './SplitAiChatbot';
import { GLOBAL_COUNTRIES } from '../data/countries';
import { buildDefaultBoundary, scaleBoundaryToHectares } from '../data/agronomyData';
import {
  Bot,
  CalendarDays,
  Camera,
  CheckCircle2,
  Code2,
  History,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Pencil,
  Plus,
  RefreshCw,
  Satellite,
  Search,
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
    sub: 'Live Field & NASA Data',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    sub: 'Tasks & Season Roadmap',
    icon: <CalendarDays className="w-4 h-4" />,
  },
  {
    id: 'history',
    label: 'Farm History',
    sub: 'Past Years & Harvests',
    icon: <History className="w-4 h-4" />,
  },
  {
    id: 'rotation-lab',
    label: 'Rotation Lab',
    sub: 'Top 3 Plans & Simulation',
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    id: 'predictions',
    label: 'Future Prediction',
    sub: '5-Year Soil & Yield',
    icon: <TrendingUp className="w-4 h-4" />,
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
    isDataSourcesOpen,
    setIsDataSourcesOpen,
    contractSource,
  } = useFarm();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [contractModalOpen, setContractModalOpen] = useState(false);

  // Profile modal draft state
  const [editName, setEditName] = useState(profile.name);
  const [editFarmName, setEditFarmName] = useState(profile.farmName);
  const [editCountryCode, setEditCountryCode] = useState(profile.countryCode);
  const [countrySearch, setCountrySearch] = useState('');
  const [editSoil, setEditSoil] = useState<SoilType>(profile.soilType);
  const [editSlope, setEditSlope] = useState<SlopeOption>(profile.slopeOption);
  const [editPhoto, setEditPhoto] = useState<string | undefined>(profile.photoDataUrl);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openProfileSettings = () => {
    setEditName(profile.name);
    setEditFarmName(profile.farmName);
    setEditCountryCode(profile.countryCode);
    setCountrySearch('');
    setEditSoil(profile.soilType);
    setEditSlope(profile.slopeOption);
    setEditPhoto(profile.photoDataUrl);
    setProfileModalOpen(true);
  };

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
    setSavingProfile(true);
    const chosenCountry =
      GLOBAL_COUNTRIES.find((c) => c.code === editCountryCode) ?? GLOBAL_COUNTRIES[0];
    const countryChanged = chosenCountry.code !== profile.countryCode;

    const newBoundary = countryChanged
      ? scaleBoundaryToHectares(
          buildDefaultBoundary(chosenCountry.lat, chosenCountry.lng),
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
        climateZone: chosenCountry.climateZone,
        regionLabel: `${chosenCountry.regionHint}, ${chosenCountry.name}`,
        soilType: editSoil,
        slopeOption: editSlope,
        ...(countryChanged
          ? {
              coordinates: { lat: chosenCountry.lat, lng: chosenCountry.lng },
              boundary: newBoundary,
            }
          : {}),
      },
      countryChanged || editSoil !== profile.soilType
    );

    setSavingProfile(false);
    setProfileModalOpen(false);
  };

  const handleNav = (id: AppScreen) => {
    navigate(id);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#111111] flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-[248px] shrink-0 bg-[#FFFEFB] border-r border-[#DFDDD6] sticky top-0 h-screen z-30">
        <div className="px-5 h-[74px] flex items-center border-b border-[#EFECE6]">
          <button
            type="button"
            onClick={() => navigate('dashboard')}
            className="text-left cursor-pointer"
          >
            <BrandMark />
          </button>
        </div>

        {/* Active Farm Switcher & Multi-Farm Controls */}
        <div className="px-4 pt-4 pb-2">
          <div className="bg-[#F5F4F0] rounded-xl p-3 border border-[#E5E3DB] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00873A]">
                {farms.length > 1 ? `My Farms (${farms.length})` : 'Active Global Farm'}
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
                className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D1] rounded-lg text-xs font-extrabold text-[#111111] focus:outline-none focus:border-[#00873A] cursor-pointer"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.countryFlag} {f.farmName} ({f.areaHectares} ha)
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm font-bold text-[#111111] truncate">
                {profile.farmName}
              </div>
            )}

            <div className="text-[11px] text-[#6F6F6F] truncate">
              {profile.countryName} · {profile.areaHectares} ha · {profile.soilType}
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => openEditFarmModal('location-size')}
                className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-white hover:bg-[#111111] hover:text-white border border-[#D9D9D9] text-[11px] font-bold text-[#111111] transition cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                Edit Farm
              </button>
              <button
                type="button"
                onClick={openAddFarmModal}
                className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-[#EBB40E] hover:bg-[#111111] hover:text-white text-[11px] font-extrabold text-[#111111] transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Add Farm
              </button>
            </div>
          </div>
        </div>

        {/* 5 Primary Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = screen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition cursor-pointer ${
                  active
                    ? 'bg-[#00873A] text-white shadow-xs'
                    : 'text-[#3B3B3B] hover:bg-[#F5F4F0] hover:text-[#111111]'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    active ? 'bg-white/15 text-white' : 'bg-[#F5F4F0] text-[#00873A]'
                  }`}
                >
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-bold leading-tight truncate">{item.label}</div>
                  <div
                    className={`text-[11px] truncate ${
                      active ? 'text-white/80' : 'text-[#6F6F6F]'
                    }`}
                  >
                    {item.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom Satellite Status & Logout */}
        <div className="p-4 border-t border-[#EFECE6] space-y-2">
          <button
            type="button"
            onClick={() => setIsDataSourcesOpen(true)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#F5F4F0] hover:bg-[#E3F5EB] border border-[#E2E0D8] text-left transition cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Satellite className="w-4 h-4 text-[#00873A] shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-[#111111] truncate">
                  {profile.nasaPower.source === 'nasa-power-live'
                    ? 'NASA POWER Live'
                    : 'NASA Baseline Active'}
                </div>
                <div className="text-[10px] text-[#6F6F6F] truncate">
                  SMAP · MODIS · SRTM Directory
                </div>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#44BE7E] shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => setContractModalOpen(true)}
            className="w-full inline-flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#DFDDD6] bg-white hover:border-[#111111] text-[11px] font-bold text-[#474747] transition cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-[#00873A]" />
              API Contract
            </span>
            <span className="text-[10px] text-[#00873A]">
              {contractSource === 'remote-api' ? 'Live' : 'Ready'}
            </span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full border border-[#D9D9D9] text-xs font-semibold text-[#474747] hover:bg-[#111111] hover:text-white hover:border-[#111111] transition cursor-pointer"
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
          <aside className="relative z-10 w-[275px] max-w-[85vw] bg-[#FFFEFB] h-full flex flex-col shadow-2xl">
            <div className="px-5 h-[68px] flex items-center justify-between border-b border-[#EFECE6]">
              <BrandMark />
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
              {NAV_ITEMS.map((item) => {
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
                      <div className="text-sm font-bold">{item.label}</div>
                      <div className={`text-[11px] ${active ? 'text-white/80' : 'text-[#6F6F6F]'}`}>
                        {item.sub}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-[#EFECE6] space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setIsDataSourcesOpen(true);
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-[#F5F4F0] text-xs font-bold text-[#111111] cursor-pointer"
              >
                <Satellite className="w-3.5 h-3.5 text-[#00873A]" />
                Data Sources Directory
              </button>
              <button
                type="button"
                onClick={logout}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full border border-[#D9D9D9] text-xs font-semibold text-[#474747] cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Log Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area — Automatically Resizes Side-by-Side When SplitAiChatbot Expands */}
      <div className="flex-1 min-w-0 flex flex-col transition-all duration-300">
        {/* Top Bar: "Hello, [Farmer Name]" + Interactive Profile Photo w/ Country Flag Badge */}
        <header className="h-[74px] bg-[#FFFEFB]/95 backdrop-blur-sm border-b border-[#DFDDD6] sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-full border border-[#D9D9D9] hover:bg-[#F5F4F0] cursor-pointer shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-extrabold text-[#111111] truncate">
                Hello, {profile.name}
              </h1>
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#6F6F6F] truncate">
                <span>
                  {profile.countryFlag} {profile.countryName}
                </span>
                <span>•</span>
                <span className="truncate">{profile.farmName}</span>
                {isFetchingNasa && (
                  <span className="inline-flex items-center gap-1 text-[#00873A] font-semibold">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Syncing NASA...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Split-Screen AI Chatbot Toggle */}
            <button
              type="button"
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition cursor-pointer ${
                isChatOpen
                  ? 'bg-[#111111] text-[#EBB40E] border-[#111111]'
                  : 'bg-[#EBB40E] text-[#111111] border-[#EBB40E] hover:bg-[#111111] hover:text-white hover:border-[#111111]'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">{isChatOpen ? 'AI Split Open' : 'AI Advisor'}</span>
            </button>

            {/* Quick Refresh Live NASA POWER */}
            <button
              type="button"
              onClick={() => void refreshLiveNasaData()}
              disabled={isFetchingNasa}
              title="Refresh live NASA POWER satellite weather & moisture"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#F5F4F0] hover:bg-[#E3F5EB] border border-[#D9D9D9] text-xs font-semibold text-[#111111] transition cursor-pointer disabled:opacity-50"
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
              className="relative flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full bg-[#F5F4F0] hover:bg-[#EFECE6] border border-[#D9D9D9] transition cursor-pointer"
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
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-[#D1D1D1] shadow-sm flex items-center justify-center text-[11px] leading-none"
                >
                  {profile.countryFlag}
                </span>
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-xs font-bold text-[#111111] max-w-[115px] truncate">
                  {profile.name.split(' ')[0]}
                </div>
                <div className="text-[10px] text-[#6F6F6F]">Profile &amp; Country</div>
              </div>
            </button>
          </div>
        </header>

        {/* Page Main Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">{children}</main>
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
            className="bg-[#FFFEFB] border border-[#D9D9D9] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in"
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
                  <p className="text-[11px] text-[#6F6F6F]">
                    Instant preview — your selected country flag badge stays attached.
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

              {/* Searchable Country Switcher */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#111111]">
                  Country (Updates Flag Badge &amp; Regional NASA Data)
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#6F6F6F] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Filter countries..."
                    className="w-full pl-8 pr-3 py-1.5 bg-[#F5F4F0] border border-[#D1D1D1] rounded-t-xl text-xs focus:outline-none focus:bg-white"
                  />
                </div>
                <select
                  value={editCountryCode}
                  onChange={(e) => setEditCountryCode(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-t-0 border-[#D1D1D1] rounded-b-xl text-sm font-medium focus:outline-none focus:border-[#00873A]"
                >
                  {filteredCountries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({c.climateZone})
                    </option>
                  ))}
                </select>
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

      {/* Global Categorized 3-Phase Data Sources & Official Satellite Portals Modal */}
      <DataSourcesModal
        open={isDataSourcesOpen}
        onClose={() => setIsDataSourcesOpen(false)}
        liveNasaStatus={profile.nasaPower.source}
      />

      {/* Shared contract.json Inspector Modal */}
      <ContractInspectorModal
        open={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
      />
    </div>
  );
};
