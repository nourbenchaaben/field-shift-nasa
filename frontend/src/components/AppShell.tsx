import React, { useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  FlaskConical,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  RotateCcw,
  Satellite,
  Settings,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { BrandMark } from './BrandMark';
import { ContractInspectorModal } from './ContractInspectorModal';
import { useFarm } from '../context/FarmContext';
import { AppScreen, IrrigationType, SoilType, WaterAccessLevel } from '../types/farm';
import { EQUIPMENT_OPTIONS, PREVIOUS_CROP_OPTIONS } from '../data/agronomyData';

interface AppShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS: { id: AppScreen; label: string; shortDesc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    shortDesc: 'Live map & analytics',
    icon: LayoutDashboard,
  },
  {
    id: 'history',
    label: 'Farm History',
    shortDesc: 'Past seasons & logs',
    icon: Clock,
  },
  {
    id: 'rotation-lab',
    label: 'Rotation Lab',
    shortDesc: '4-zone AI planner',
    icon: FlaskConical,
  },
  {
    id: 'predictions',
    label: 'Future Prediction',
    shortDesc: '5-year state forecast',
    icon: TrendingUp,
  },
];

const SOIL_TYPES: SoilType[] = ['Loamy', 'Clay-Loam', 'Sandy Loam', 'Clay', 'Silt Loam', 'Calcareous'];
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

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const {
    screen,
    profile,
    strategy,
    pendingProposal,
    navigate,
    logout,
    updateProfile,
    resetDemoState,
  } = useFarm();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [contractModalOpen, setContractModalOpen] = useState(false);

  // Local edit form state
  const [editName, setEditName] = useState(profile.name);
  const [editFarmName, setEditFarmName] = useState(profile.farmName);
  const [editSoil, setEditSoil] = useState<SoilType>(profile.soilType);
  const [editIrrigation, setEditIrrigation] = useState<IrrigationType>(profile.irrigationType);
  const [editWater, setEditWater] = useState<WaterAccessLevel>(profile.waterAccess);
  const [editEquipment, setEditEquipment] = useState<string[]>(profile.equipment);
  const [editPrevCrops, setEditPrevCrops] = useState<string[]>(profile.previousCrops);

  const openProfileEditor = () => {
    setEditName(profile.name);
    setEditFarmName(profile.farmName);
    setEditSoil(profile.soilType);
    setEditIrrigation(profile.irrigationType);
    setEditWater(profile.waterAccess);
    setEditEquipment(profile.equipment);
    setEditPrevCrops(profile.previousCrops);
    setProfileMenuOpen(false);
    setEditModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: editName.trim() || profile.name,
      farmName: editFarmName.trim() || profile.farmName,
      soilType: editSoil,
      irrigationType: editIrrigation,
      waterAccess: editWater,
      equipment: editEquipment,
      previousCrops: editPrevCrops,
    });
    setEditModalOpen(false);
  };

  const initials = profile.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#111111] flex">
      {/* Desktop Collapsible Left Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-[#FFFEFB] border-r border-[#DFDDD6] sticky top-0 h-screen shrink-0 transition-all duration-300 ${
          collapsed ? 'w-[82px]' : 'w-[264px]'
        }`}
      >
        {/* Brand Header + Collapse Toggle */}
        <div className="h-[74px] px-4 flex items-center justify-between border-b border-[#EFECE6]">
          <button
            type="button"
            onClick={() => navigate('dashboard')}
            className="cursor-pointer focus:outline-none overflow-hidden"
            title="Tadawol Dashboard"
          >
            <BrandMark
              size={32}
              showWordmark={!collapsed}
              subtitle={!collapsed ? 'Smart AgriTech' : undefined}
            />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-8 h-8 rounded-full bg-[#F5F4F0] border border-[#D9D9D9] hover:bg-[#111111] hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {!collapsed && (
            <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6F6F6F]">
              Farm Workspace
            </div>
          )}
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = screen === item.id;
            const showDot = item.id === 'rotation-lab' && Boolean(pendingProposal);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer relative ${
                  active
                    ? 'bg-[#111111] text-white shadow-sm'
                    : 'text-[#474747] hover:bg-[#F5F4F0] hover:text-[#111111]'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                {active && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#EBB40E] rounded-r-full" />
                )}
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    active ? 'text-[#EBB40E]' : 'text-[#474747]'
                  }`}
                />
                {!collapsed && (
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{item.label}</div>
                    <div
                      className={`text-[11px] truncate ${
                        active ? 'text-white/70' : 'text-[#6F6F6F]'
                      }`}
                    >
                      {item.shortDesc}
                    </div>
                  </div>
                )}
                {showDot && (
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-[#EBB40E] animate-pulse-harvest shrink-0"
                    title="Pending strategy approval"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom NASA Telemetry Status & Public Landing Link */}
        <div className="p-3 border-t border-[#EFECE6] space-y-2.5">
          {!collapsed ? (
            <div className="bg-[#00873A] text-white rounded-xl p-3.5 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="inline-flex items-center gap-1.5 text-[#92D500]">
                  <Satellite className="w-3.5 h-3.5" />
                  NASA SYNC LIVE
                </span>
                <span className="font-mono-tech text-white/80">SMAP L4</span>
              </div>
              <div className="text-xs font-semibold truncate">{profile.farmName}</div>
              <div className="flex items-center justify-between text-[11px] text-white/80 font-mono-tech">
                <span>{profile.areaHectares} ha</span>
                <span>{profile.soilType}</span>
              </div>
            </div>
          ) : (
            <div
              className="w-11 h-11 mx-auto rounded-xl bg-[#00873A] text-[#92D500] flex items-center justify-center"
              title={`NASA Sync Live · ${profile.farmName}`}
            >
              <Satellite className="w-5 h-5" />
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate('landing')}
            title="Public Homepage"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#474747] hover:bg-[#F5F4F0] hover:text-[#111111] transition cursor-pointer ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Public Homepage</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Slide-Over Sidebar Drawer */}
      {mobileNavOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-[#111111]/60 backdrop-blur-xs flex"
          onClick={() => setMobileNavOpen(false)}
        >
          <div
            className="w-[280px] max-w-[85vw] bg-[#FFFEFB] h-full flex flex-col justify-between p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFECE6]">
                <BrandMark size={30} subtitle="Smart AgriTech" />
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="w-9 h-9 rounded-full bg-[#F5F4F0] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="space-y-1.5">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = screen === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setMobileNavOpen(false);
                        navigate(item.id);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition cursor-pointer ${
                        active
                          ? 'bg-[#111111] text-white'
                          : 'text-[#474747] hover:bg-[#F5F4F0]'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${active ? 'text-[#EBB40E]' : ''}`} />
                      <div>
                        <div className="text-sm font-bold">{item.label}</div>
                        <div className={`text-[11px] ${active ? 'text-white/70' : 'text-[#6F6F6F]'}`}>
                          {item.shortDesc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-[#EFECE6] space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  navigate('landing');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#474747] hover:bg-[#F5F4F0]"
              >
                <Home className="w-4 h-4" />
                Public Homepage
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#B91C1C] hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main App Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Persistent Top Header Bar */}
        <header className="sticky top-0 z-30 h-[74px] bg-[#FFFEFB]/95 backdrop-blur-md border-b border-[#DFDDD6] px-4 sm:px-7 flex items-center justify-between gap-4">
          {/* Left: Mobile Trigger + Personalized Greeting */}
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden w-10 h-10 rounded-full bg-[#F5F4F0] border border-[#D9D9D9] flex items-center justify-center shrink-0 cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-base sm:text-xl font-extrabold text-[#111111] truncate">
                  Hello, {profile.name}
                </h1>
                <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-bold bg-[#E3F5EB] text-[#005A26] px-2.5 py-0.5 rounded-full border border-[#00873A]/20 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00873A]" />
                  {strategy.name}
                </span>
              </div>
              <div className="text-xs text-[#6F6F6F] truncate flex items-center gap-2">
                <span className="font-medium text-[#474747]">{profile.farmName}</span>
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">{profile.regionLabel}</span>
                <span className="hidden md:inline">·</span>
                <span className="hidden md:inline font-mono-tech">
                  {profile.coordinates.lat.toFixed(3)}°N, {profile.coordinates.lng.toFixed(3)}°E
                </span>
              </div>
            </div>
          </div>

          {/* Right: Pending Approval Indicator + API Contract Button + Circular User Profile Avatar / Menu */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setContractModalOpen(true)}
              title="Inspect shared contract.json request/response or connect backend API"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F4F0] hover:bg-[#111111] hover:text-white border border-[#D9D9D9] text-xs font-bold text-[#111111] transition cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-[#00873A]" />
              <span>API Contract</span>
            </button>

            {pendingProposal && screen !== 'rotation-lab' && (
              <button
                type="button"
                onClick={() => navigate('rotation-lab')}
                className="hidden sm:inline-flex items-center gap-2 bg-[#EBB40E] text-[#111111] px-3.5 py-1.5 rounded-full text-xs font-bold border border-[#111111] animate-pulse-harvest cursor-pointer"
              >
                Pending AI Approval · Review
              </button>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((o) => !o)}
                className="flex items-center gap-2.5 p-1 pr-3 rounded-full bg-[#F5F4F0] border border-[#D9D9D9] hover:border-[#111111] transition cursor-pointer"
                aria-label="User profile menu"
              >
                <div className="w-9 h-9 rounded-full bg-[#00873A] text-white font-bold text-xs flex items-center justify-center border-2 border-[#EBB40E]">
                  {initials}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <div className="text-xs font-bold text-[#111111] max-w-[120px] truncate">
                    {profile.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-[#6F6F6F]">{profile.soilType}</div>
                </div>
              </button>

              {profileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-[#FFFEFB] border border-[#D9D9D9] rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
                    <div className="p-4 bg-[#F5F4F0] border-b border-[#E5E3DC]">
                      <div className="text-sm font-bold text-[#111111]">{profile.name}</div>
                      <div className="text-xs text-[#6F6F6F] truncate">{profile.email}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="text-[10px] font-bold bg-white border border-[#D9D9D9] px-2 py-0.5 rounded-full">
                          {profile.areaHectares} ha
                        </span>
                        <span className="text-[10px] font-bold bg-[#E3F5EB] text-[#005A26] px-2 py-0.5 rounded-full">
                          {profile.soilType}
                        </span>
                        <span className="text-[10px] font-bold bg-[#FDF6DC] text-[#7A5B00] px-2 py-0.5 rounded-full">
                          {profile.irrigationType}
                        </span>
                      </div>
                    </div>

                    <div className="p-2 space-y-1">
                      <button
                        type="button"
                        onClick={openProfileEditor}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[#111111] hover:bg-[#F5F4F0] transition cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-[#00873A]" />
                        Edit Farm Profile &amp; Soil / Resources
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          resetDemoState();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#474747] hover:bg-[#F5F4F0] transition cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reset Demo Baseline Data
                      </button>
                      <div className="my-1 border-t border-[#EFECE6]" />
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[#B91C1C] hover:bg-red-50 transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main View Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Shared API Contract Inspector Modal (contract.json) */}
      <ContractInspectorModal
        open={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
      />

      {/* Edit Farm Profile & Soil/Resource Info Modal */}
      {editModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#111111]/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setEditModalOpen(false)}
        >
          <div
            className="bg-[#FFFEFB] border border-[#D9D9D9] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#EBB40E] flex items-center justify-center">
                  <User className="w-4 h-4 text-[#111111]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#111111]">
                    Edit Farm Profile &amp; Resources
                  </h2>
                  <p className="text-xs text-[#6F6F6F]">
                    Changes automatically recalibrate your NASA baseline &amp; AI recommendations.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F5F4F0] hover:bg-[#111111] hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#474747] mb-1.5">
                    Farmer Name
                  </label>
                  <input
                    required
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D1D1D1] rounded-lg text-sm focus:outline-none focus:border-[#00873A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#474747] mb-1.5">
                    Farm / Estate Name
                  </label>
                  <input
                    required
                    type="text"
                    value={editFarmName}
                    onChange={(e) => setEditFarmName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D1D1D1] rounded-lg text-sm focus:outline-none focus:border-[#00873A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#474747] mb-2">
                  Soil Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SOIL_TYPES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditSoil(st)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center justify-between cursor-pointer ${
                        editSoil === st
                          ? 'bg-[#00873A] text-white border-[#00873A]'
                          : 'bg-white text-[#474747] border-[#D1D1D1]'
                      }`}
                    >
                      <span>{st}</span>
                      {editSoil === st && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#474747] mb-1.5">
                    Irrigation Type
                  </label>
                  <select
                    value={editIrrigation}
                    onChange={(e) => setEditIrrigation(e.target.value as IrrigationType)}
                    className="w-full px-3 py-2.5 bg-white border border-[#D1D1D1] rounded-lg text-sm font-medium focus:outline-none focus:border-[#00873A]"
                  >
                    {IRRIGATION_TYPES.map((ir) => (
                      <option key={ir} value={ir}>
                        {ir}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#474747] mb-1.5">
                    Water Access
                  </label>
                  <select
                    value={editWater}
                    onChange={(e) => setEditWater(e.target.value as WaterAccessLevel)}
                    className="w-full px-3 py-2.5 bg-white border border-[#D1D1D1] rounded-lg text-sm font-medium focus:outline-none focus:border-[#00873A]"
                  >
                    {WATER_ACCESS_LEVELS.map((wa) => (
                      <option key={wa} value={wa}>
                        {wa}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#474747] mb-2">
                  Equipment &amp; Sensors
                </label>
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT_OPTIONS.map((eq) => {
                    const active = editEquipment.includes(eq);
                    return (
                      <button
                        key={eq}
                        type="button"
                        onClick={() =>
                          setEditEquipment((prev) =>
                            prev.includes(eq) ? prev.filter((x) => x !== eq) : [...prev, eq]
                          )
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                          active
                            ? 'bg-[#111111] text-white border-[#111111]'
                            : 'bg-[#F5F4F0] text-[#474747] border-[#D9D9D9]'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {eq}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#474747] mb-2">
                  Previous Crop History
                </label>
                <div className="flex flex-wrap gap-2">
                  {PREVIOUS_CROP_OPTIONS.map((crop) => {
                    const active = editPrevCrops.includes(crop);
                    return (
                      <button
                        key={crop}
                        type="button"
                        onClick={() =>
                          setEditPrevCrops((prev) =>
                            prev.includes(crop) ? prev.filter((x) => x !== crop) : [...prev, crop]
                          )
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                          active
                            ? 'bg-[#EBB40E] text-[#111111] border-[#111111]'
                            : 'bg-white text-[#474747] border-[#D1D1D1]'
                        }`}
                      >
                        {crop}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-[#EFECE6] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-[#D1D1D1] text-sm font-semibold text-[#474747] hover:border-[#111111] cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-harvest !min-h-[42px]">
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
