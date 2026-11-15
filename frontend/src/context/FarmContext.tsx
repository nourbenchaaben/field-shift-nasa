import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppScreen,
  CalendarEvent,
  ChatMessage,
  FarmBeforeAnalysis,
  FarmEditTab,
  FarmerFinanceInputs,
  FarmerProfile,
  FarmRecord,
  PendingPlanProposal,
  PlanCustomization,
  ScoredRotationStrategy,
  StoredAccount,
  StrategyChangeRecord,
} from '../types/farm';
import {
  applyPlanCustomization,
  buildBeforeFarmAnalysis,
  buildFarmCalendarEvents,
  DEFAULT_GLOBAL_PROFILE,
  evaluateTop3Strategies,
} from '../data/decisionEngine';
import { applyFinanceParameterToStrategies } from '../data/regionalMarketData';
import {
  askGrokAdvisor,
  buildSmartOfflineReply,
  checkServerAiStatus,
} from '../api/grokAiService';
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
  | 'id'
  | 'nasaPower'
  | 'selectedStrategyId'
  | 'customCalendarEvents'
  | 'completedEventIds'
  | 'planCustomization'
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
  planCustomization?: PlanCustomization;
  strategyHistory: StrategyChangeRecord[];
  resetPlanCustomization: () => void;
  // Calendar
  calendarEvents: CalendarEvent[];
  toggleCalendarComplete: (eventId: string) => void;
  addCalendarEvent: (ev: Omit<CalendarEvent, 'id' | 'isCustom'>) => void;
  // Global Split-Screen AI Chatbot (Server-managed Free/Live AI)
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  openAiAdvisorForCustomPlan: () => void;
  chatMessages: ChatMessage[];
  isChatThinking: boolean;
  aiProviderLabel: string;
  sendChatMessage: (text: string) => Promise<void>;
  confirmPlanProposal: (messageId: string) => void;
  cancelPlanProposal: (messageId: string) => void;
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
  loginWithCredentials: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  registerAccount: (
    newProfile: Omit<FarmerProfile, 'nasaPower'>,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<FarmerProfile>, refetchNasa?: boolean) => Promise<void>;
  refreshLiveNasaData: () => Promise<void>;
  selectRotationStrategy: (strategyId: string | null) => void;
  saveFarmFinanceInputs: (inputs: FarmerFinanceInputs | undefined) => void;
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
  completedEventIds: string[] = [],
  strategyHistory: StrategyChangeRecord[] = []
): FarmRecord {
  return {
    id,
    farmName: p.farmName,
    countryCode: p.countryCode,
    countryName: p.countryName,
    countryFlag: p.countryFlag,
    stateName: p.stateName,
    localityName: p.localityName,
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
    financeInputs: p.financeInputs,
    selectedStrategyId,
    customCalendarEvents,
    completedEventIds,
    strategyHistory,
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
  const demoProfile: FarmerProfile = {
    ...DEFAULT_GLOBAL_PROFILE,
    name: 'Amine Ben Salem',
    email: 'demo@tadawol.app',
    farmName: 'El-Khadhra Valley Farm',
    stateName: 'Manouba Governorate',
    localityName: 'Medjerda Valley',
    regionLabel: 'Medjerda Valley, Tunisia',
    previousCrops: ['Wheat', 'Barley', 'Chickpeas', 'Wheat', 'Fava beans'],
    equipment: ['Tractor & Basic Plow', 'Drip Irrigation Lines', 'Soil Moisture Sensor'],
    financeInputs: {
      enabled: true,
      currencyCode: 'TND',
      seasonBudgetCapacityLocal: 42000,
      operatingCostPerHaLocal: 1180,
      fertilizerCostPerHaLocal: 320,
      lastSeasonNetProfitLocal: 26500,
      targetAnnualProfitLocal: 32000,
      irrigationEnergyCostPerHaLocal: 145,
      includeSubsidies: true,
    },
  };
  const strategies = evaluateTop3Strategies(demoProfile);
  const historyRecord = (
    strategy: ScoredRotationStrategy,
    id: string,
    recordedAt: string,
    actionType: StrategyChangeRecord['actionType'],
    summary: string,
    fromStrategyTitle?: string
  ): StrategyChangeRecord => ({
    id, recordedAt, source: 'rotation-lab', actionType, summary, fromStrategyTitle,
    strategyId: strategy.id, strategyTitle: strategy.title,
    tierLabel: strategy.tierLabel, focusTag: strategy.focusTag,
    stages: strategy.steps.map((step) => ({
      cropName: step.cropName, cropFamily: step.cropFamily,
      cropColor: step.cropColor,
    })),
    metrics: {
      yieldImprovementPct: strategy.expectedOutput.yieldImprovementPct,
      chemicalReductionPct: strategy.expectedOutput.chemicalReductionPct,
      waterSavingsPct: strategy.expectedOutput.waterSavingsPct,
    },
  });
  const first = strategies[0];
  const second = strategies[1] ?? first;
  const third = strategies[2] ?? second;
  const strategyHistory = [
    historyRecord(first, 'demo-history-2023', '2023-10-12T09:00:00.000Z', 'initial-selection', 'Started a soil-restoring rotation after consecutive cereal seasons.'),
    historyRecord(second, 'demo-history-2024', '2024-09-18T10:30:00.000Z', 'strategy-switch', 'Switched to a water-smart rotation after reviewing the dry-season outlook.', first.title),
    historyRecord(third, 'demo-history-2025', '2025-10-03T08:15:00.000Z', 'strategy-switch', 'Added a legume break and cover crop to rebuild soil nitrogen.', second.title),
  ];
  const events: CalendarEvent[] = [
    { id: 'demo-event-1', date: '2026-10-10', year: 2026, month: 10, season: 'Autumn', phase: 'past', category: 'soil', title: 'Soil moisture check', description: 'Review NASA root-zone wetness before sowing.', isCustom: true },
    { id: 'demo-event-2', date: '2026-11-22', year: 2026, month: 11, season: 'Autumn', phase: 'current', category: 'planting', title: 'Sow durum wheat', description: 'Plant after the first reliable autumn rain.', cropName: 'Durum wheat', isCustom: true },
    { id: 'demo-event-3', date: '2027-03-15', year: 2027, month: 3, season: 'Spring', phase: 'future', category: 'water', title: 'Check irrigation schedule', description: 'Use updated NASA rainfall and soil-moisture readings to plan irrigation.', isCustom: true },
    { id: 'demo-event-4', date: '2027-05-28', year: 2027, month: 5, season: 'Spring', phase: 'future', category: 'harvest', title: 'Review cereal harvest', description: 'Record yield and update the next rotation plan.', cropName: 'Durum wheat', isCustom: true },
  ];
  const primaryFarm = profileToFarmRecord(
    demoProfile, 'farm-default-1', first.id, events, ['demo-event-1'], strategyHistory
  );
  return {
    email: demoProfile.email,
    password: 'tadawol123',
    name: demoProfile.name,
    photoDataUrl: demoProfile.photoDataUrl,
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hydrated = parsed.map(hydrateAccount);
        if (!hydrated.some((account) => account.email === 'demo@tadawol.app')) {
          hydrated.unshift(createDemoAccount());
          saveAccounts(hydrated);
        }
        return hydrated;
      }
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
      content: `Hello ${profile.name.split(' ')[0]}! I'm your **Tadawol AI Advisor**.\n\nI'm connected to **${profile.farmName}** in **${profile.countryFlag} ${profile.countryName}** (${profile.areaHectares} ha, **${profile.soilType}** soil) and your **NASA POWER** weather & soil moisture data (**${profile.nasaPower.moistureStatus}**, ${profile.nasaPower.rootMoisturePct}%).\n\nAsk me anything in plain language, like how to cut fertilizer costs, save water, check frost/rain risks, or compare your Top 3 rotation plans!`,
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
      stateName: activeFarm.stateName,
      localityName: activeFarm.localityName,
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
      financeInputs: activeFarm.financeInputs,
    }),
    [ownerName, currentEmail, seedAccount.email, ownerPhoto, activeFarm]
  );

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    buildWelcomeMessages(profile)
  );
  const [isChatThinking, setIsChatThinking] = useState<boolean>(false);
  const chatThinkingRef = useRef<boolean>(false);
  const [serverAiConfigured, setServerAiConfigured] = useState<boolean>(false);
  const [aiProviderLabel, setAiProviderLabel] = useState<string>('Live AI');

  useEffect(() => {
    let active = true;
    void checkServerAiStatus().then((st) => {
      if (!active) return;
      setServerAiConfigured(st.serverConfigured);
      setAiProviderLabel(st.providerLabel);
    });
    return () => {
      active = false;
    };
  }, []);

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
  const top3Strategies = useMemo(
    () => applyFinanceParameterToStrategies(profile, evaluateTop3Strategies(profile)),
    [profile]
  );
  const selectedStrategyId = activeFarm.selectedStrategyId;
  const planCustomization = activeFarm.planCustomization;
  const activeStrategy = useMemo(() => {
    const base = selectedStrategyId
      ? (top3Strategies.find((s) => s.id === selectedStrategyId) ?? top3Strategies[0])
      : top3Strategies[0];
    return applyPlanCustomization(base, planCustomization);
  }, [selectedStrategyId, top3Strategies, planCustomization]);

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

  // Refresh old saved records once so newly added Earth Engine layers can populate.
  useEffect(() => {
    const satelliteCheckedAt = Date.parse(activeFarm.nasaPower.satelliteCheckedAt ?? '');
    const satelliteCheckStale =
      !Number.isFinite(satelliteCheckedAt) || Date.now() - satelliteCheckedAt > 24 * 60 * 60 * 1000;
    if (
      isAuthenticated &&
      !isFetchingNasa &&
      (activeFarm.nasaPower.source === 'nasa-power-fallback' || satelliteCheckStale)
    ) {
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
      prev.map((f) => f.id !== targetFarmId ? f : {
        ...f,
        nasaPower: liveData,
        ...(f.slopeOption === 'Auto-detect via SRTM Elevation' && liveData.srtmSlopeDeg !== null
          ? { slopeDeg: liveData.srtmSlopeDeg }
          : {}),
      })
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
      slopeDeg:
        input.slopeOption === 'Auto-detect via SRTM Elevation' && liveNasa.srtmSlopeDeg !== null
          ? liveNasa.srtmSlopeDeg
          : resolvedSlope,
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
      const resolvedSrtmSlope = nextSlopeOpt === 'Auto-detect via SRTM Elevation'
        ? freshNasa.srtmSlopeDeg ?? nextSlopeDeg
        : nextSlopeDeg;
      setFarms((prev) =>
        prev.map((f) => f.id === targetFarmId ? { ...f, nasaPower: freshNasa, slopeDeg: resolvedSrtmSlope } : f)
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
    if (nextScreen === 'calendar') {
      setScreen('dashboard');
      window.setTimeout(() => {
        const el = document.getElementById('dashboard-calendar');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
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

  const loginWithCredentials = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const found = accounts.find((account) => account.email.toLowerCase() === cleanEmail);
    if (!found) {
      return { ok: false, error: 'No account found with that email. Please check your address or register a new farm.' };
    }
    if (found.password !== password) return { ok: false, error: 'Incorrect password. Please try again.' };
    applyAccountSession(found);
    showToast(`Welcome back, ${found.name}!`);
    return { ok: true };
  };
  const registerAccount = async (
    newFarmProfile: Omit<FarmerProfile, 'nasaPower'>,
    password: string
  ) => {
    setIsFetchingNasa(true);
    const liveNasa = await fetchLiveNasaPower(newFarmProfile.coordinates, newFarmProfile.soilType, newFarmProfile.slopeDeg);
    setIsFetchingNasa(false);
    const fullProfile: FarmerProfile = {
      ...newFarmProfile,
      slopeDeg:
        newFarmProfile.slopeOption === 'Auto-detect via SRTM Elevation' && liveNasa.srtmSlopeDeg !== null
          ? liveNasa.srtmSlopeDeg
          : newFarmProfile.slopeDeg,
      nasaPower: liveNasa,
    };
    const firstFarm = profileToFarmRecord(fullProfile, `farm-${Date.now().toString(36)}`);
    const newAccount: StoredAccount = {
      email: fullProfile.email.trim().toLowerCase(), password: password || 'tadawol123',
      name: fullProfile.name, photoDataUrl: fullProfile.photoDataUrl, farms: [firstFarm],
      activeFarmId: firstFarm.id, updatedAt: new Date().toISOString(),
    };
    setAccounts((prev) => {
      const next = [newAccount, ...prev.filter((account) => account.email.toLowerCase() !== newAccount.email)];
      saveAccounts(next);
      return next;
    });
    applyAccountSession(newAccount);
    showToast(`Farm "${fullProfile.farmName}" registered with ${liveNasa.source === 'nasa-power-live' ? 'live NASA POWER data' : 'calibrated NASA baseline'}!`);
    return { ok: true };
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
    if (updates.stateName !== undefined) farmUpdates.stateName = updates.stateName;
    if (updates.localityName !== undefined) farmUpdates.localityName = updates.localityName;
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
    if ('financeInputs' in updates) farmUpdates.financeInputs = updates.financeInputs;

    if (Object.keys(farmUpdates).length > 0) {
      await updateActiveFarm(farmUpdates);
    } else if (refetchNasa) {
      await refreshLiveNasaData();
    } else {
      showToast('Profile settings updated.');
    }
  };

  const buildStrategyHistoryRecord = (params: {
    baseStrategy: ScoredRotationStrategy;
    nextCustom?: PlanCustomization;
    prevTitle?: string;
    source: StrategyChangeRecord['source'];
    actionType: StrategyChangeRecord['actionType'];
    summary: string;
  }): StrategyChangeRecord => {
    const resolved = applyPlanCustomization(params.baseStrategy, params.nextCustom);
    return {
      id: `sh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      recordedAt: new Date().toISOString(),
      source: params.source,
      actionType: params.actionType,
      summary: params.summary,
      fromStrategyTitle: params.prevTitle,
      strategyId: resolved.id,
      strategyTitle: resolved.title,
      tierLabel: resolved.tierLabel,
      focusTag: resolved.focusTag,
      stages: resolved.steps.map((st, idx) => ({
        cropName: st.cropName,
        cropFamily: st.cropFamily,
        cropColor: st.cropColor,
        durationMonths:
          params.nextCustom?.stageOverrides?.[idx]?.durationMonths ??
          params.nextCustom?.customStages?.[idx]?.durationMonths,
      })),
      metrics: {
        yieldImprovementPct: resolved.expectedOutput.yieldImprovementPct,
        chemicalReductionPct: resolved.expectedOutput.chemicalReductionPct,
        waterSavingsPct: resolved.expectedOutput.waterSavingsPct,
      },
    };
  };

  const selectRotationStrategy = (strategyId: string | null) => {
    mutateActiveFarm((f) => {
      const nextCustom =
        strategyId && strategyId !== f.selectedStrategyId ? undefined : f.planCustomization;
      let nextHistory = f.strategyHistory ?? [];

      if (strategyId) {
        const picked = top3Strategies.find((s) => s.id === strategyId);
        if (picked) {
          const prevBase =
            top3Strategies.find((s) => s.id === f.selectedStrategyId) ?? top3Strategies[0];
          const prevResolved = f.selectedStrategyId
            ? applyPlanCustomization(prevBase, f.planCustomization)
            : undefined;
          const hadAnyPrev = Boolean(f.selectedStrategyId) || nextHistory.length > 0;
          const isSameNoChange =
            f.selectedStrategyId === strategyId && !f.planCustomization && nextHistory.length > 0;

          if (!isSameNoChange) {
            const record = buildStrategyHistoryRecord({
              baseStrategy: picked,
              nextCustom,
              prevTitle: prevResolved?.title,
              source: 'rotation-lab',
              actionType: hadAnyPrev ? 'strategy-switch' : 'initial-selection',
              summary: hadAnyPrev
                ? `Switched strategy to ${picked.title}`
                : `Selected initial strategy: ${picked.title}`,
            });
            nextHistory = [...nextHistory, record].slice(-20);
          }
        }
      }

      return {
        ...f,
        selectedStrategyId: strategyId,
        planCustomization: nextCustom,
        strategyHistory: nextHistory,
      };
    });
    if (strategyId) {
      const picked = top3Strategies.find((s) => s.id === strategyId);
      if (picked) {
        showToast(`Selected ${picked.tierLabel}: "${picked.title}"`);
      }
    }
  };

  const resetPlanCustomization = () => {
    mutateActiveFarm((f) => {
      const baseStrategy =
        top3Strategies.find((s) => s.id === f.selectedStrategyId) ?? top3Strategies[0];
      const prevResolved = applyPlanCustomization(baseStrategy, f.planCustomization);
      const record = buildStrategyHistoryRecord({
        baseStrategy,
        nextCustom: undefined,
        prevTitle: prevResolved.title,
        source: 'reset',
        actionType: 'reset',
        summary: `Restored baseline "${baseStrategy.title}"`,
      });
      return {
        ...f,
        planCustomization: undefined,
        strategyHistory: [...(f.strategyHistory ?? []), record].slice(-20),
      };
    });
    showToast('Restored original Rotation Lab sequence and timing.');
  };

  const openAiAdvisorForCustomPlan = () => {
    setIsChatOpen(true);
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.id.startsWith('custom-prompt-')) return prev;
      return [
        ...prev,
        {
          id: `custom-prompt-${Date.now()}`,
          role: 'assistant',
          content: `Ready to customize **${activeStrategy.title}** or design your own strategy beyond the 3 presets! Try asking:\n\n• *"Build me a custom 5-stage plan with Wheat, Chickpeas, Tomatoes, Oats, and Clover"*\n• *"Add a 5th stage with Summer Cover Crop"*\n• *"Swap Stage 2 to Artichokes for 5 months"*\n• *"Heavy rain delayed sowing by 1 month"*\n\nI will show you a preview and always ask for your confirmation before applying any change.`,
          timestamp: ts,
        },
      ];
    });
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

  const saveFarmFinanceInputs = (inputs: FarmerFinanceInputs | undefined) => {
    mutateActiveFarm((f) => ({
      ...f,
      financeInputs: inputs,
    }));
    showToast(
      inputs?.enabled
        ? 'Planning costs saved. Profit graphs updated.'
        : 'Optional profit calculator cleared.'
    );
  };

  const applyProposalToFarm = (proposal: PendingPlanProposal) => {
    if (
      proposal.nextSelectedStrategyId !== undefined ||
      proposal.nextCustomization !== undefined ||
      proposal.calendarAlert
    ) {
      const nowDate = new Date();
      const alertMonth = nowDate.getMonth() + 1;
      const alertSeason: CalendarEvent['season'] =
        alertMonth >= 3 && alertMonth <= 5
          ? 'Spring'
          : alertMonth >= 6 && alertMonth <= 8
            ? 'Summer'
            : alertMonth >= 9 && alertMonth <= 11
              ? 'Autumn'
              : 'Winter';

      mutateActiveFarm((f) => {
        const nextCustomEvents: CalendarEvent[] = proposal.calendarAlert
          ? [
              ...(f.customCalendarEvents ?? []),
              {
                id: `ai-ev-${Date.now()}`,
                date: nowDate.toISOString().slice(0, 10),
                year: nowDate.getFullYear(),
                month: alertMonth,
                season: alertSeason,
                phase: 'current',
                category: proposal.calendarAlert.category,
                title: proposal.calendarAlert.title,
                description: proposal.calendarAlert.description,
                isCustom: true,
              },
            ]
          : f.customCalendarEvents;

        const nextStrategyId =
          proposal.nextSelectedStrategyId !== undefined
            ? proposal.nextSelectedStrategyId
            : f.selectedStrategyId ?? top3Strategies[0]?.id ?? null;

        const nextCustomization =
          proposal.nextCustomization === null
            ? undefined
            : proposal.nextCustomization !== undefined
              ? proposal.nextCustomization
              : f.planCustomization;

        const prevBase =
          top3Strategies.find((s) => s.id === f.selectedStrategyId) ?? top3Strategies[0];
        const prevResolved = f.selectedStrategyId
          ? applyPlanCustomization(prevBase, f.planCustomization)
          : undefined;
        const nextBase =
          top3Strategies.find((s) => s.id === nextStrategyId) ?? top3Strategies[0];

        const historyRecord = buildStrategyHistoryRecord({
          baseStrategy: nextBase,
          nextCustom: nextCustomization,
          prevTitle: prevResolved?.title,
          source: proposal.nextCustomization === null ? 'reset' : 'ai-advisor',
          actionType:
            proposal.nextCustomization === null
              ? 'reset'
              : proposal.changeType === 'strategy-switch'
                ? 'strategy-switch'
                : proposal.changeType === 'custom-plan'
                  ? 'custom-plan'
                  : 'stage-edit',
          summary: proposal.summary,
        });

        return {
          ...f,
          selectedStrategyId: nextStrategyId,
          planCustomization: nextCustomization,
          customCalendarEvents: nextCustomEvents,
          strategyHistory: [...(f.strategyHistory ?? []), historyRecord].slice(-20),
        };
      });
    }

    if (proposal.nextScenario) {
      updateContractSettings({
        scenario: proposal.nextScenario,
        rain_change_pct:
          proposal.nextScenario === 'drought' ? -22 : proposal.nextScenario === 'wet' ? 20 : 0,
      });
    }

    showToast(`Plan updated: ${proposal.summary}`);
  };

  const confirmPlanProposal = (messageId: string) => {
    const targetMsg = chatMessages.find(
      (m) => m.id === messageId && m.pendingProposal?.status === 'pending'
    );
    if (!targetMsg?.pendingProposal) return;

    const proposal = targetMsg.pendingProposal;
    applyProposalToFarm(proposal);

    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [
      ...prev.map((m) =>
        m.id === messageId && m.pendingProposal
          ? {
              ...m,
              planChangeSummary: proposal.summary,
              pendingProposal: { ...m.pendingProposal, status: 'applied' as const },
            }
          : m
      ),
      {
        id: `a-applied-${Date.now()}`,
        role: 'assistant',
        content: `Confirmed and applied **${proposal.summary}**! Your Dashboard Roadmap, Calendar, and 5-Year Outlook are now updated.`,
        timestamp: ts,
      },
    ]);
  };

  const cancelPlanProposal = (messageId: string) => {
    const targetMsg = chatMessages.find(
      (m) => m.id === messageId && m.pendingProposal?.status === 'pending'
    );
    if (!targetMsg?.pendingProposal) return;

    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [
      ...prev.map((m) =>
        m.id === messageId && m.pendingProposal
          ? {
              ...m,
              pendingProposal: { ...m.pendingProposal, status: 'cancelled' as const },
            }
          : m
      ),
      {
        id: `a-cancel-${Date.now()}`,
        role: 'assistant',
        content: `No changes were made to your active rotation plan. Let me know if you want to explore a different crop or custom stage layout!`,
        timestamp: ts,
      },
    ]);
  };

  const sendChatMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || chatThinkingRef.current) return;
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'user',
      content: trimmed,
      timestamp: ts,
    };

    const historySnapshot = [...chatMessages];
    const latestPendingMsg = [...historySnapshot]
      .reverse()
      .find((m) => m.pendingProposal?.status === 'pending');

    // Handle explicit typed cancellation of a pending proposal
    if (
      latestPendingMsg?.pendingProposal &&
      /^(no|nope|cancel|reject|stop|nevermind|never mind|non|annuler|لا)\b[!.?,\s]*$/i.test(
        trimmed
      )
    ) {
      setChatMessages((prev) => [
        ...prev.map((m) =>
          m.id === latestPendingMsg.id && m.pendingProposal
            ? { ...m, pendingProposal: { ...m.pendingProposal, status: 'cancelled' as const } }
            : m
        ),
        userMsg,
        {
          id: `a-cancel-${Date.now()}`,
          role: 'assistant',
          content: `Cancelled that proposed update, your current rotation plan remains untouched. Tell me what else you would like to try on **${profile.farmName}**.`,
          timestamp: ts,
        },
      ]);
      return;
    }

    // Handle explicit typed confirmation of a pending proposal
    if (
      latestPendingMsg?.pendingProposal &&
      /^(yes|yep|yeah|confirm|apply|confirm apply|yes apply|go ahead|oui|confirmer|نعم|ey)\b[!.?,\s]*$/i.test(
        trimmed
      )
    ) {
      const prop = latestPendingMsg.pendingProposal;
      const isStrongConfirm = /confirm\s*apply|yes\s*apply/i.test(trimmed);
      if (prop.requiresDoubleConfirm && !isStrongConfirm) {
        setChatMessages((prev) => [
          ...prev,
          userMsg,
          {
            id: `a-dbl-${Date.now()}`,
            role: 'assistant',
            content: `Because **${prop.summary}** changes your active strategy structure, please use the **2-step Confirm button** on the proposal card above (or reply **CONFIRM APPLY**) to lock it in.`,
            timestamp: ts,
          },
        ]);
        return;
      }

      applyProposalToFarm(prop);
      setChatMessages((prev) => [
        ...prev.map((m) =>
          m.id === latestPendingMsg.id && m.pendingProposal
            ? {
                ...m,
                planChangeSummary: prop.summary,
                pendingProposal: { ...m.pendingProposal, status: 'applied' as const },
              }
            : m
        ),
        userMsg,
        {
          id: `a-applied-${Date.now()}`,
          role: 'assistant',
          content: `Confirmed and applied **${prop.summary}**! Your Dashboard Roadmap, Calendar, and 5-Year Outlook are now updated.`,
          timestamp: ts,
        },
      ]);
      return;
    }

    setChatMessages((prev) => [...prev, userMsg]);
    chatThinkingRef.current = true;
    setIsChatThinking(true);

    try {
      const result = await Promise.race([
        askGrokAdvisor({
          question: trimmed,
          history: historySnapshot,
          profile,
          activeStrategy,
          top3: top3Strategies,
          selectedStrategyId,
          planCustomization,
          currentScreen: screen,
          serverGrokConfigured: serverAiConfigured,
        }),
        new Promise<never>((_, reject) =>
          window.setTimeout(() => reject(new Error('Response timed out')), 18000)
        ),
      ]);

      const replyTs = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'assistant',
        content:
          result.reply && result.reply.trim().length > 0
            ? result.reply
            : 'How can I help with your crops or rotation plan today?',
        timestamp: replyTs,
        pendingProposal: result.pendingProposal,
      };

      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Tadawol AI Advisor error:', err);
      const replyTs = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let fallbackReply =
        'I ran into a brief connection hiccup. Please ask your farm or rotation question again in a moment!';
      let fallbackProposal: PendingPlanProposal | undefined;
      try {
        const safeOffline = buildSmartOfflineReply(
          trimmed,
          historySnapshot,
          profile,
          activeStrategy,
          top3Strategies,
          selectedStrategyId,
          planCustomization,
          screen
        );
        if (safeOffline.reply) {
          fallbackReply = safeOffline.reply;
          fallbackProposal = safeOffline.pendingProposal;
        }
      } catch {
        // keep safe fallbackReply
      }
      setChatMessages((prev) => [
        ...prev,
        {
          id: `a-err-${Date.now()}`,
          role: 'assistant',
          content: fallbackReply,
          timestamp: replyTs,
          pendingProposal: fallbackProposal,
        },
      ]);
    } finally {
      chatThinkingRef.current = false;
      setIsChatThinking(false);
    }
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
        showToast(`API unreachable (${result.error}). Using local simulator.`);
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
        planCustomization,
        strategyHistory: activeFarm.strategyHistory ?? [],
        resetPlanCustomization,
        calendarEvents,
        toggleCalendarComplete,
        addCalendarEvent,
        isChatOpen,
        setIsChatOpen,
        openAiAdvisorForCustomPlan,
        chatMessages,
        isChatThinking,
        aiProviderLabel,
        sendChatMessage,
        confirmPlanProposal,
        cancelPlanProposal,
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
        registerAccount,
        logout,
        updateProfile,
        refreshLiveNasaData,
        selectRotationStrategy,
        saveFarmFinanceInputs,
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
