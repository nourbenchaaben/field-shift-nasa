import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AppScreen,
  CalendarEvent,
  ChatMessage,
  FarmBeforeAnalysis,
  FarmEditTab,
  FarmerProfile,
  FarmRecord,
  ScoredRotationStrategy,
  StoredAccount,
} from '../types/farm';
import {
  buildBeforeFarmAnalysis,
  buildFarmCalendarEvents,
  DEFAULT_GLOBAL_PROFILE,
  evaluateTop3Strategies,
  generateGlobalAgronomyReply,
} from '../data/decisionEngine';
import {
  buildFallbackNasaPower,
  fetchLiveNasaPower,
  resolveSlopeDegrees,
} from '../api/nasaPowerService';
import {
  ClimateScenario,
  DEFAULT_CONTRACT_REQUEST,
  OptimizationWeights,
  TadawolApiRequest,
  TadawolApiResponse,
} from '../api/tadawolContract';
import {
  buildContractRequest,
  executeOptimizationContract,
  simulateContractResponse,
} from '../api/tadawolClient';

export interface ContractSettings {
  years: number;
  use_gee: boolean;
  slope_deg: number;
  weights: OptimizationWeights;
  scenario: ClimateScenario;
  replay_year: number | null;
  rain_change_pct: number;
}

export interface FarmModalState {
  open: boolean;
  mode: 'add' | 'edit';
  initialTab: FarmEditTab;
}

export type NewFarmInput = Omit<
  FarmRecord,
  'id' | 'nasaPower' | 'selectedStrategyId' | 'customCalendarEvents' | 'completedEventIds'
>;

interface FarmContextValue {
  screen: AppScreen;
  authTab: 'login' | 'register';
  isAuthenticated: boolean;
  // Merged owner + active farm view (keeps all screens cleanly synced)
  profile: FarmerProfile;
  // Multi-farm state & management
  farms: FarmRecord[];
  activeFarmId: string;
  activeFarm: FarmRecord;
  switchFarm: (farmId: string) => void;
  addFarm: (input: NewFarmInput) => Promise<void>;
  updateActiveFarm: (updates: Partial<NewFarmInput>) => Promise<void>;
  deleteFarm: (farmId: string) => void;
  farmModal: FarmModalState;
  openAddFarmModal: () => void;
  openEditFarmModal: (initialTab?: FarmEditTab) => void;
  closeFarmModal: () => void;
  isFetchingNasa: boolean;
  // Decision engine outputs
  beforeAnalysis: FarmBeforeAnalysis;
  top3Strategies: ScoredRotationStrategy[];
  selectedStrategyId: string | null;
  activeStrategy: ScoredRotationStrategy;
  // Calendar
  calendarEvents: CalendarEvent[];
  toggleCalendarComplete: (eventId: string) => void;
  addCalendarEvent: (ev: Omit<CalendarEvent, 'id' | 'isCustom'>) => void;
  // Global Split-Screen AI Chatbot
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  chatMessages: ChatMessage[];
  sendChatMessage: (text: string) => void;
  // Global Data Sources Directory Modal
  isDataSourcesOpen: boolean;
  setIsDataSourcesOpen: (open: boolean) => void;
  // Shared contract.json state
  contractSettings: ContractSettings;
  contractRequest: TadawolApiRequest;
  contractResponse: TadawolApiResponse;
  contractSource: 'remote-api' | 'local-simulator';
  apiEndpoint: string;
  isSyncingApi: boolean;
  lastApiError: string | null;
  setApiEndpoint: (url: string) => void;
  updateContractSettings: (updates: Partial<ContractSettings>) => void;
  syncContractWithBackend: (overrideUrl?: string) => Promise<void>;
  // Auth & Profile actions
  toastMessage: string | null;
  navigate: (screen: AppScreen, options?: { authTab?: 'login' | 'register' }) => void;
  loginWithCredentials: (email: string, password: string) => { ok: boolean; error?: string };
  loginDemoAccount: () => void;
  registerAccount: (
    newProfile: Omit<FarmerProfile, 'nasaPower'>,
    password: string
  ) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<FarmerProfile>, refetchNasa?: boolean) => Promise<void>;
  refreshLiveNasaData: () => Promise<void>;
  selectRotationStrategy: (strategyId: string | null) => void;
  showToast: (msg: string) => void;
}

const ACCOUNTS_KEY = 'tadawol_global_accounts_v3';
const SESSION_KEY = 'tadawol_global_session_v3';

const DEFAULT_CONTRACT_SETTINGS: ContractSettings = {
  years: DEFAULT_CONTRACT_REQUEST.years,
  use_gee: DEFAULT_CONTRACT_REQUEST.use_gee,
  slope_deg: DEFAULT_CONTRACT_REQUEST.slope_deg,
  weights: { ...DEFAULT_CONTRACT_REQUEST.weights },
  scenario: DEFAULT_CONTRACT_REQUEST.scenario,
  replay_year: DEFAULT_CONTRACT_REQUEST.replay_year,
  rain_change_pct: DEFAULT_CONTRACT_REQUEST.rain_change_pct,
};

function profileToFarmRecord(
  p: FarmerProfile,
  id: string,
  selectedStrategyId: string | null = null,
  customCalendarEvents: CalendarEvent[] = [],
  completedEventIds: string[] = []
): FarmRecord {
  return {
    id,
    farmName: p.farmName,
    countryCode: p.countryCode,
    countryName: p.countryName,
    countryFlag: p.countryFlag,
    climateZone: p.climateZone,
    regionLabel: p.regionLabel,
    coordinates: p.coordinates,
    boundary: p.boundary,
    areaHectares: p.areaHectares,
    soilType: p.soilType,
    slopeOption: p.slopeOption,
    slopeDeg: p.slopeDeg,
    irrigationType: p.irrigationType,
    equipment: p.equipment,
    previousCrops: p.previousCrops,
    nasaPower: p.nasaPower,
    selectedStrategyId,
    customCalendarEvents,
    completedEventIds,
  };
}

function hydrateFarm(farm: FarmRecord): FarmRecord {
  const np = farm.nasaPower;
  if (!np || !Array.isArray(np.riskCalendarMonthly) || np.riskCalendarMonthly.length !== 12) {
    return {
      ...farm,
      nasaPower: buildFallbackNasaPower(farm.coordinates, farm.soilType, farm.slopeDeg),
    };
  }
  return farm;
}

function createDemoAccount(): StoredAccount {
  const primaryFarm = profileToFarmRecord(DEFAULT_GLOBAL_PROFILE, 'farm-default-1');
  return {
    email: DEFAULT_GLOBAL_PROFILE.email,
    password: 'tadawol123',
    name: DEFAULT_GLOBAL_PROFILE.name,
    photoDataUrl: DEFAULT_GLOBAL_PROFILE.photoDataUrl,
    farms: [primaryFarm],
    activeFarmId: primaryFarm.id,
    updatedAt: new Date().toISOString(),
  };
}

function hydrateAccount(raw: StoredAccount): StoredAccount {
  // Automatically migrate single-farm legacy v3 accounts into multi-farm structure
  if (!Array.isArray(raw.farms) || raw.farms.length === 0) {
    const legacyProfile = raw.profile ?? DEFAULT_GLOBAL_PROFILE;
    const migratedFarm = hydrateFarm(
      profileToFarmRecord(
        legacyProfile,
        'farm-migrated-1',
        raw.selectedStrategyId ?? null,
        raw.customCalendarEvents ?? [],
        raw.completedEventIds ?? []
      )
    );
    return {
      email: raw.email || legacyProfile.email,
      password: raw.password || 'tadawol123',
      name: raw.name || legacyProfile.name,
      photoDataUrl: raw.photoDataUrl ?? legacyProfile.photoDataUrl,
      farms: [migratedFarm],
      activeFarmId: migratedFarm.id,
      updatedAt: raw.updatedAt || new Date().toISOString(),
    };
  }

  const hydratedFarms = raw.farms.map(hydrateFarm);
  const validActiveId = hydratedFarms.some((f) => f.id === raw.activeFarmId)
    ? raw.activeFarmId
    : hydratedFarms[0].id;

  return {
    ...raw,
    name: raw.name || raw.profile?.name || 'Farmer',
    photoDataUrl: raw.photoDataUrl ?? raw.profile?.photoDataUrl,
    farms: hydratedFarms,
    activeFarmId: validActiveId,
  };
}

function loadAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredAccount[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(hydrateAccount);
    }
  } catch {
    // ignore storage parse failure
  }
  const seeded = [createDemoAccount()];
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(seeded));
  } catch {
    // ignore quota
  }
  return seeded;
}

function saveAccounts(accounts: StoredAccount[]) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // ignore quota
  }
}

function buildWelcomeMessages(profile: FarmerProfile): ChatMessage[] {
  return [
    {
      id: `ai-welcome-${Date.now()}`,
      role: 'assistant',
      timestamp: 'Now',
      content: `Hello ${profile.name.split(' ')[0]}! I'm your **Tadawol AI Advisor**.\n\nI'm connected to **${profile.farmName}** in **${profile.countryFlag} ${profile.countryName}** (${profile.areaHectares} ha, **${profile.soilType}** soil) and your **NASA POWER** weather & soil moisture data (**${profile.nasaPower.moistureStatus}**, ${profile.nasaPower.rootMoisturePct}%).\n\nAsk me anything in plain language — like how to cut fertilizer costs, save water, check frost/rain risks, or compare your Top 3 rotation plans!`,
    },
  ];
}

const FarmContext = createContext<FarmContextValue | null>(null);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<StoredAccount[]>(() => loadAccounts());

  const initialSession = (() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as { email: string; screen: AppScreen };
    } catch {
      return null;
    }
  })();

  const initialAccount = initialSession
    ? accounts.find((a) => a.email.toLowerCase() === initialSession.email.toLowerCase()) ?? null
    : null;

  const fallbackDemo = createDemoAccount();
  const seedAccount = initialAccount ?? fallbackDemo;

  const [currentEmail, setCurrentEmail] = useState<string | null>(initialAccount?.email ?? null);
  const [ownerName, setOwnerName] = useState<string>(seedAccount.name);
  const [ownerPhoto, setOwnerPhoto] = useState<string | undefined>(seedAccount.photoDataUrl);
  const [farms, setFarms] = useState<FarmRecord[]>(seedAccount.farms);
  const [activeFarmId, setActiveFarmId] = useState<string>(seedAccount.activeFarmId);

  const [screen, setScreen] = useState<AppScreen>(
    initialAccount ? initialSession?.screen ?? 'dashboard' : 'landing'
  );
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  const [farmModal, setFarmModal] = useState<FarmModalState>({
    open: false,
    mode: 'edit',
    initialTab: 'location-size',
  });

  const [isFetchingNasa, setIsFetchingNasa] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDataSourcesOpen, setIsDataSourcesOpen] = useState(false);

  const activeFarm: FarmRecord = useMemo(
    () => farms.find((f) => f.id === activeFarmId) ?? farms[0],
    [farms, activeFarmId]
  );

  // Unified FarmerProfile view combining Owner + Active Farm so every screen adapts seamlessly
  const profile: FarmerProfile = useMemo(
    () => ({
      name: ownerName,
      email: currentEmail ?? seedAccount.email,
      photoDataUrl: ownerPhoto,
      farmName: activeFarm.farmName,
      countryCode: activeFarm.countryCode,
      countryName: activeFarm.countryName,
      countryFlag: activeFarm.countryFlag,
      climateZone: activeFarm.climateZone,
      regionLabel: activeFarm.regionLabel,
      coordinates: activeFarm.coordinates,
      boundary: activeFarm.boundary,
      areaHectares: activeFarm.areaHectares,
      soilType: activeFarm.soilType,
      slopeOption: activeFarm.slopeOption,
      slopeDeg: activeFarm.slopeDeg,
      irrigationType: activeFarm.irrigationType,
      equipment: activeFarm.equipment,
      previousCrops: activeFarm.previousCrops,
      nasaPower: activeFarm.nasaPower,
    }),
    [ownerName, currentEmail, seedAccount.email, ownerPhoto, activeFarm]
  );

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    buildWelcomeMessages(profile)
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Shared contract.json state
  const [contractSettings, setContractSettings] = useState<ContractSettings>(
    DEFAULT_CONTRACT_SETTINGS
  );
  const [apiEndpoint, setApiEndpoint] = useState<string>(
    (import.meta.env.VITE_TADAWOL_API_URL as string | undefined) ??
      'http://localhost:8000/api/analyze'
  );
  const [remoteOverrideResponse, setRemoteOverrideResponse] = useState<TadawolApiResponse | null>(
    null
  );
  const [contractSource, setContractSource] = useState<'remote-api' | 'local-simulator'>(
    'local-simulator'
  );
  const [isSyncingApi, setIsSyncingApi] = useState(false);
  const [lastApiError, setLastApiError] = useState<string | null>(null);

  const isAuthenticated = Boolean(currentEmail);

  // Decision Engine live computations for the Active Farm
  const beforeAnalysis = useMemo(() => buildBeforeFarmAnalysis(profile), [profile]);
  const top3Strategies = useMemo(() => evaluateTop3Strategies(profile), [profile]);
  const selectedStrategyId = activeFarm.selectedStrategyId;
  const activeStrategy = useMemo(() => {
    if (selectedStrategyId) {
      return top3Strategies.find((s) => s.id === selectedStrategyId) ?? top3Strategies[0];
    }
    return top3Strategies[0];
  }, [selectedStrategyId, top3Strategies]);

  // Combined Farm Calendar events scoped to the Active Farm
  const calendarEvents = useMemo(() => {
    const completedIds = activeFarm.completedEventIds ?? [];
    const base = buildFarmCalendarEvents(profile, activeStrategy).map((ev) => ({
      ...ev,
      completed: completedIds.includes(ev.id) ? true : ev.completed,
    }));
    const custom = (activeFarm.customCalendarEvents ?? []).map((ev) => ({
      ...ev,
      completed: completedIds.includes(ev.id) ? true : ev.completed,
    }));
    return [...base, ...custom].sort((a, b) => a.date.localeCompare(b.date));
  }, [profile, activeStrategy, activeFarm.customCalendarEvents, activeFarm.completedEventIds]);

  // Shared contract.json request & response
  const contractRequest: TadawolApiRequest = useMemo(
    () =>
      buildContractRequest(profile, activeStrategy, {
        years: contractSettings.years,
        use_gee: contractSettings.use_gee,
        slope_deg: Math.round(profile.slopeDeg),
        weights: contractSettings.weights,
        scenario: contractSettings.scenario,
        replay_year: contractSettings.replay_year,
        rain_change_pct: contractSettings.rain_change_pct,
      }),
    [profile, activeStrategy, contractSettings]
  );

  const localContractResponse = useMemo(
    () => simulateContractResponse(contractRequest, profile, activeStrategy, top3Strategies),
    [contractRequest, profile, activeStrategy, top3Strategies]
  );

  const contractResponse = remoteOverrideResponse ?? localContractResponse;

  // Persist account + all farms whenever state changes
  useEffect(() => {
    if (!currentEmail) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ email: currentEmail, screen }));
    } catch {
      // ignore quota
    }
    setAccounts((prev) => {
      const updated = prev.map((acc) =>
        acc.email.toLowerCase() === currentEmail.toLowerCase()
          ? {
              ...acc,
              name: ownerName,
              photoDataUrl: ownerPhoto,
              farms,
              activeFarmId,
              updatedAt: new Date().toISOString(),
            }
          : acc
      );
      saveAccounts(updated);
      return updated;
    });
  }, [currentEmail, screen, ownerName, ownerPhoto, farms, activeFarmId]);

  // Automatically fetch live NASA POWER for active farm if still fallback
  useEffect(() => {
    if (isAuthenticated && activeFarm.nasaPower.source === 'nasa-power-fallback' && !isFetchingNasa) {
      void refreshLiveNasaData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentEmail, activeFarmId]);

  const showToast = (msg: string) => setToastMessage(msg);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4200);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const mutateActiveFarm = (updater: (farm: FarmRecord) => FarmRecord) => {
    setFarms((prev) => prev.map((f) => (f.id === activeFarm.id ? updater(f) : f)));
  };

  const refreshLiveNasaData = async () => {
    const targetFarmId = activeFarm.id;
    setIsFetchingNasa(true);
    const liveData = await fetchLiveNasaPower(
      activeFarm.coordinates,
      activeFarm.soilType,
      activeFarm.slopeDeg
    );
    setFarms((prev) =>
      prev.map((f) => (f.id === targetFarmId ? { ...f, nasaPower: liveData } : f))
    );
    setIsFetchingNasa(false);
    if (liveData.source === 'nasa-power-live') {
      showToast(
        `Live NASA POWER synced for "${activeFarm.farmName}" (${liveData.annualRainMm} mm/yr · ${liveData.moistureStatus})`
      );
    }
  };

  // Multi-Farm Actions
  const switchFarm = (farmId: string) => {
    const target = farms.find((f) => f.id === farmId);
    if (!target || target.id === activeFarmId) return;
    setActiveFarmId(target.id);
    setRemoteOverrideResponse(null);
    const targetProfile: FarmerProfile = {
      name: ownerName,
      email: currentEmail ?? seedAccount.email,
      photoDataUrl: ownerPhoto,
      farmName: target.farmName,
      countryCode: target.countryCode,
      countryName: target.countryName,
      countryFlag: target.countryFlag,
      climateZone: target.climateZone,
      regionLabel: target.regionLabel,
      coordinates: target.coordinates,
      boundary: target.boundary,
      areaHectares: target.areaHectares,
      soilType: target.soilType,
      slopeOption: target.slopeOption,
      slopeDeg: target.slopeDeg,
      irrigationType: target.irrigationType,
      equipment: target.equipment,
      previousCrops: target.previousCrops,
      nasaPower: target.nasaPower,
    };
    setChatMessages(buildWelcomeMessages(targetProfile));
    showToast(`Switched to "${target.farmName}" (${target.countryFlag} ${target.areaHectares} ha)`);
  };

  const addFarm = async (input: NewFarmInput) => {
    setIsFetchingNasa(true);
    const resolvedSlope = resolveSlopeDegrees(input.slopeOption, input.coordinates);
    const liveNasa = await fetchLiveNasaPower(input.coordinates, input.soilType, resolvedSlope);
    setIsFetchingNasa(false);

    const newFarm: FarmRecord = {
      ...input,
      id: `farm-${Date.now().toString(36)}`,
      slopeDeg: resolvedSlope,
      nasaPower: liveNasa,
      selectedStrategyId: null,
      customCalendarEvents: [],
      completedEventIds: [],
    };

    setFarms((prev) => [...prev, newFarm]);
    setActiveFarmId(newFarm.id);
    setRemoteOverrideResponse(null);
    setChatMessages(
      buildWelcomeMessages({
        name: ownerName,
        email: currentEmail ?? seedAccount.email,
        photoDataUrl: ownerPhoto,
        ...newFarm,
      })
    );
    showToast(
      `Added "${newFarm.farmName}" (${newFarm.countryFlag} ${newFarm.areaHectares} ha) with live NASA POWER data!`
    );
  };

  const updateActiveFarm = async (updates: Partial<NewFarmInput>) => {
    const nextCoords = updates.coordinates ?? activeFarm.coordinates;
    const nextSoil = updates.soilType ?? activeFarm.soilType;
    const nextSlopeOpt = updates.slopeOption ?? activeFarm.slopeOption;
    const nextSlopeDeg =
      updates.slopeDeg ??
      (updates.slopeOption || updates.coordinates
        ? resolveSlopeDegrees(nextSlopeOpt, nextCoords)
        : activeFarm.slopeDeg);

    const locationChanged =
      Math.abs(nextCoords.lat - activeFarm.coordinates.lat) > 0.002 ||
      Math.abs(nextCoords.lng - activeFarm.coordinates.lng) > 0.002 ||
      (updates.countryCode !== undefined && updates.countryCode !== activeFarm.countryCode);

    const needsNasaRefresh =
      locationChanged || nextSoil !== activeFarm.soilType || nextSlopeDeg !== activeFarm.slopeDeg;

    const targetFarmId = activeFarm.id;

    setFarms((prev) =>
      prev.map((f) =>
        f.id === targetFarmId
          ? {
              ...f,
              ...updates,
              slopeDeg: nextSlopeDeg,
            }
          : f
      )
    );
    setRemoteOverrideResponse(null);

    if (needsNasaRefresh) {
      setIsFetchingNasa(true);
      const freshNasa = await fetchLiveNasaPower(nextCoords, nextSoil, nextSlopeDeg);
      setFarms((prev) =>
        prev.map((f) => (f.id === targetFarmId ? { ...f, nasaPower: freshNasa } : f))
      );
      setIsFetchingNasa(false);
      showToast(
        `Updated "${updates.farmName ?? activeFarm.farmName}" & refreshed live NASA POWER data!`
      );
    } else {
      showToast(`Saved changes to "${updates.farmName ?? activeFarm.farmName}".`);
    }
  };

  const deleteFarm = (farmId: string) => {
    if (farms.length <= 1) {
      showToast('You need at least one farm in your account.');
      return;
    }
    const target = farms.find((f) => f.id === farmId);
    const remaining = farms.filter((f) => f.id !== farmId);
    setFarms(remaining);
    if (activeFarmId === farmId) {
      setActiveFarmId(remaining[0].id);
    }
    showToast(`Removed farm "${target?.farmName ?? 'Farm'}".`);
  };

  const openAddFarmModal = () =>
    setFarmModal({ open: true, mode: 'add', initialTab: 'location-size' });

  const openEditFarmModal = (initialTab: FarmEditTab = 'location-size') =>
    setFarmModal({ open: true, mode: 'edit', initialTab });

  const closeFarmModal = () => setFarmModal((prev) => ({ ...prev, open: false }));

  const navigate = (nextScreen: AppScreen, options?: { authTab?: 'login' | 'register' }) => {
    if (options?.authTab) setAuthTab(options.authTab);
    if (!isAuthenticated && nextScreen !== 'landing' && nextScreen !== 'auth') {
      setScreen('auth');
      return;
    }
    setScreen(nextScreen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyAccountSession = (acc: StoredAccount) => {
    const hydrated = hydrateAccount(acc);
    const active = hydrated.farms.find((f) => f.id === hydrated.activeFarmId) ?? hydrated.farms[0];
    setCurrentEmail(hydrated.email);
    setOwnerName(hydrated.name);
    setOwnerPhoto(hydrated.photoDataUrl);
    setFarms(hydrated.farms);
    setActiveFarmId(active.id);
    setChatMessages(
      buildWelcomeMessages({
        name: hydrated.name,
        email: hydrated.email,
        photoDataUrl: hydrated.photoDataUrl,
        ...active,
      })
    );
    setScreen('dashboard');
  };

  const loginWithCredentials = (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
    if (!found) {
      return {
        ok: false,
        error: 'No account found with that email. Try Register or the Demo Farmer button below.',
      };
    }
    if (found.password !== password) {
      return {
        ok: false,
        error: 'Incorrect password. Please try again (Demo password: tadawol123).',
      };
    }

    applyAccountSession(found);
    showToast(`Welcome back, ${found.name}!`);
    return { ok: true };
  };

  const loginDemoAccount = () => {
    const demo =
      accounts.find((a) => a.email.toLowerCase() === DEFAULT_GLOBAL_PROFILE.email.toLowerCase()) ??
      createDemoAccount();
    applyAccountSession(demo);
    showToast(`Signed in as ${demo.name}.`);
  };

  const registerAccount = async (
    newFarmProfile: Omit<FarmerProfile, 'nasaPower'>,
    password: string
  ) => {
    setIsFetchingNasa(true);
    const liveNasa = await fetchLiveNasaPower(
      newFarmProfile.coordinates,
      newFarmProfile.soilType,
      newFarmProfile.slopeDeg
    );
    setIsFetchingNasa(false);

    const fullProfile: FarmerProfile = {
      ...newFarmProfile,
      nasaPower: liveNasa,
    };
    const firstFarm = profileToFarmRecord(fullProfile, `farm-${Date.now().toString(36)}`);

    const newAccount: StoredAccount = {
      email: fullProfile.email,
      password: password || 'tadawol123',
      name: fullProfile.name,
      photoDataUrl: fullProfile.photoDataUrl,
      farms: [firstFarm],
      activeFarmId: firstFarm.id,
      updatedAt: new Date().toISOString(),
    };

    setAccounts((prev) => {
      const withoutDup = prev.filter(
        (a) => a.email.toLowerCase() !== fullProfile.email.toLowerCase()
      );
      const next = [newAccount, ...withoutDup];
      saveAccounts(next);
      return next;
    });

    applyAccountSession(newAccount);
    showToast(
      `Farm "${fullProfile.farmName}" registered with ${liveNasa.source === 'nasa-power-live' ? 'live NASA POWER data' : 'calibrated NASA baseline'}!`
    );
  };

  const logout = () => {
    setCurrentEmail(null);
    setIsChatOpen(false);
    localStorage.removeItem(SESSION_KEY);
    setScreen('landing');
    showToast('Logged out cleanly. All your farms stay saved for next login.');
  };

  const updateProfile = async (updates: Partial<FarmerProfile>, refetchNasa = false) => {
    if (updates.name !== undefined) setOwnerName(updates.name);
    if ('photoDataUrl' in updates) setOwnerPhoto(updates.photoDataUrl);

    // Forward any farm-related updates cleanly to the active farm
    const farmUpdates: Partial<NewFarmInput> = {};
    if (updates.farmName !== undefined) farmUpdates.farmName = updates.farmName;
    if (updates.countryCode !== undefined) farmUpdates.countryCode = updates.countryCode;
    if (updates.countryName !== undefined) farmUpdates.countryName = updates.countryName;
    if (updates.countryFlag !== undefined) farmUpdates.countryFlag = updates.countryFlag;
    if (updates.climateZone !== undefined) farmUpdates.climateZone = updates.climateZone;
    if (updates.regionLabel !== undefined) farmUpdates.regionLabel = updates.regionLabel;
    if (updates.coordinates !== undefined) farmUpdates.coordinates = updates.coordinates;
    if (updates.boundary !== undefined) farmUpdates.boundary = updates.boundary;
    if (updates.areaHectares !== undefined) farmUpdates.areaHectares = updates.areaHectares;
    if (updates.soilType !== undefined) farmUpdates.soilType = updates.soilType;
    if (updates.slopeOption !== undefined) farmUpdates.slopeOption = updates.slopeOption;
    if (updates.slopeDeg !== undefined) farmUpdates.slopeDeg = updates.slopeDeg;
    if (updates.irrigationType !== undefined) farmUpdates.irrigationType = updates.irrigationType;
    if (updates.equipment !== undefined) farmUpdates.equipment = updates.equipment;
    if (updates.previousCrops !== undefined) farmUpdates.previousCrops = updates.previousCrops;

    if (Object.keys(farmUpdates).length > 0) {
      await updateActiveFarm(farmUpdates);
    } else if (refetchNasa) {
      await refreshLiveNasaData();
    } else {
      showToast('Profile settings updated.');
    }
  };

  const selectRotationStrategy = (strategyId: string | null) => {
    mutateActiveFarm((f) => ({ ...f, selectedStrategyId: strategyId }));
    if (strategyId) {
      const picked = top3Strategies.find((s) => s.id === strategyId);
      if (picked) {
        showToast(`Selected ${picked.tierLabel}: "${picked.title}"`);
      }
    }
  };

  const toggleCalendarComplete = (eventId: string) => {
    mutateActiveFarm((f) => {
      const cur = f.completedEventIds ?? [];
      return {
        ...f,
        completedEventIds: cur.includes(eventId)
          ? cur.filter((id) => id !== eventId)
          : [...cur, eventId],
      };
    });
  };

  const addCalendarEvent = (ev: Omit<CalendarEvent, 'id' | 'isCustom'>) => {
    const created: CalendarEvent = {
      ...ev,
      id: `custom-${Date.now().toString(36)}`,
      isCustom: true,
    };
    mutateActiveFarm((f) => ({
      ...f,
      customCalendarEvents: [...(f.customCalendarEvents ?? []), created],
    }));
    showToast(`Added "${created.title}" to "${activeFarm.farmName}" Calendar.`);
  };

  const sendChatMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: ts,
    };

    const replyText = generateGlobalAgronomyReply(
      trimmed,
      profile,
      activeStrategy,
      top3Strategies,
      screen
    );

    const aiMsg: ChatMessage = {
      id: `a-${Date.now() + 1}`,
      role: 'assistant',
      content: replyText,
      timestamp: ts,
    };

    setChatMessages((prev) => [...prev, userMsg, aiMsg]);
  };

  const updateContractSettings = (updates: Partial<ContractSettings>) => {
    setContractSettings((prev) => ({
      ...prev,
      ...updates,
      weights: updates.weights ? { ...prev.weights, ...updates.weights } : prev.weights,
    }));
    setRemoteOverrideResponse(null);
  };

  const syncContractWithBackend = async (overrideUrl?: string) => {
    const url = (overrideUrl ?? apiEndpoint).trim();
    setIsSyncingApi(true);
    setLastApiError(null);
    const result = await executeOptimizationContract(
      contractRequest,
      profile,
      activeStrategy,
      top3Strategies,
      url
    );
    setIsSyncingApi(false);
    setContractSource(result.source);
    if (result.source === 'remote-api') {
      setRemoteOverrideResponse(result.response);
      showToast('Synced live response from Tadawol backend API.');
    } else {
      setRemoteOverrideResponse(null);
      if (result.error) {
        setLastApiError(result.error);
        showToast(`API unreachable (${result.error}) — using local simulator.`);
      } else {
        showToast('Using local contract simulator (no remote URL configured).');
      }
    }
  };

  return (
    <FarmContext.Provider
      value={{
        screen,
        authTab,
        isAuthenticated,
        profile,
        farms,
        activeFarmId: activeFarm.id,
        activeFarm,
        switchFarm,
        addFarm,
        updateActiveFarm,
        deleteFarm,
        farmModal,
        openAddFarmModal,
        openEditFarmModal,
        closeFarmModal,
        isFetchingNasa,
        beforeAnalysis,
        top3Strategies,
        selectedStrategyId,
        activeStrategy,
        calendarEvents,
        toggleCalendarComplete,
        addCalendarEvent,
        isChatOpen,
        setIsChatOpen,
        chatMessages,
        sendChatMessage,
        isDataSourcesOpen,
        setIsDataSourcesOpen,
        contractSettings,
        contractRequest,
        contractResponse,
        contractSource,
        apiEndpoint,
        isSyncingApi,
        lastApiError,
        setApiEndpoint,
        updateContractSettings,
        syncContractWithBackend,
        toastMessage,
        navigate,
        loginWithCredentials,
        loginDemoAccount,
        registerAccount,
        logout,
        updateProfile,
        refreshLiveNasaData,
        selectRotationStrategy,
        showToast,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export function useFarm(): FarmContextValue {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error('useFarm must be used within FarmProvider');
  return ctx;
}
