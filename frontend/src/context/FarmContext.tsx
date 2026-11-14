import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AppScreen,
  ChatMessage,
  FarmerProfile,
  ProposedStrategyUpdate,
  RotationParameters,
  RotationStrategy,
  StrategyApprovalLog,
} from '../types/farm';
import {
  createInitialStrategy,
  createProposalFromParameters,
  DEFAULT_FARMER_PROFILE,
  generateNasaBaseline,
  processAgronomyChatPrompt,
} from '../data/agronomyData';
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
  slope_deg: number | null;
  weights: OptimizationWeights;
  scenario: ClimateScenario;
  replay_year: number | null;
  rain_change_pct: number;
}

interface FarmContextValue {
  screen: AppScreen;
  authTab: 'login' | 'register';
  isAuthenticated: boolean;
  profile: FarmerProfile;
  strategy: RotationStrategy;
  pendingProposal: ProposedStrategyUpdate | null;
  chatMessages: ChatMessage[];
  approvalLogs: StrategyApprovalLog[];
  toastMessage: string | null;
  // Shared contract.json API integration
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
  // Navigation & farm actions
  navigate: (screen: AppScreen, options?: { authTab?: 'login' | 'register' }) => void;
  loginDemo: (email?: string) => void;
  registerFarm: (newProfile: Omit<FarmerProfile, 'nasaBaseline'>) => void;
  logout: () => void;
  updateProfile: (updates: Partial<FarmerProfile>) => void;
  proposeFromParameters: (params: RotationParameters) => void;
  sendChatMessage: (text: string) => void;
  approvePendingProposal: () => void;
  discardPendingProposal: () => void;
  showToast: (msg: string) => void;
  resetDemoState: () => void;
}

const STORAGE_KEY = 'tadawol_platform_state_v2';

const DEFAULT_CONTRACT_SETTINGS: ContractSettings = {
  years: DEFAULT_CONTRACT_REQUEST.years,
  slope_deg: DEFAULT_CONTRACT_REQUEST.slope_deg,
  weights: { ...DEFAULT_CONTRACT_REQUEST.weights },
  scenario: DEFAULT_CONTRACT_REQUEST.scenario,
  replay_year: DEFAULT_CONTRACT_REQUEST.replay_year,
  rain_change_pct: DEFAULT_CONTRACT_REQUEST.rain_change_pct,
};

interface PersistedState {
  isAuthenticated: boolean;
  screen: AppScreen;
  profile: FarmerProfile;
  strategy: RotationStrategy;
  approvalLogs: StrategyApprovalLog[];
  contractSettings?: ContractSettings;
  apiEndpoint?: string;
}

function buildWelcomeChat(profile: FarmerProfile): ChatMessage[] {
  return [
    {
      id: 'msg-welcome-1',
      role: 'assistant',
      timestamp: '08:45 AM',
      content: `Welcome to the **AI Rotation Lab**, ${profile.name.split(' ')[0]}. I've synced **NASA SMAP soil moisture (${profile.nasaBaseline.smapSoilMoisturePct}%)**, **MODIS thermal telemetry (${profile.nasaBaseline.modisSurfaceTempC}°C)**, and your **${profile.soilType}** profile for **${profile.farmName}** (${profile.areaHectares} ha). Ask me any agronomy question or request a plot adjustment — e.g., *"Prioritize drought-resistant crops in S2"* — and I'll draft a strategy update for your approval.`,
    },
  ];
}

const FarmContext = createContext<FarmContextValue | null>(null);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const loadInitial = (): PersistedState | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as PersistedState;
      if (parsed && parsed.profile && parsed.strategy) return parsed;
    } catch {
      // ignore corrupted storage
    }
    return null;
  };

  const saved = loadInitial();
  const initialProfile = saved?.profile ?? DEFAULT_FARMER_PROFILE;
  const initialStrategy = saved?.strategy ?? createInitialStrategy(initialProfile);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(saved?.isAuthenticated ?? false);
  const [screen, setScreen] = useState<AppScreen>(saved?.screen ?? 'landing');
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [profile, setProfile] = useState<FarmerProfile>(initialProfile);
  const [strategy, setStrategy] = useState<RotationStrategy>(initialStrategy);
  const [pendingProposal, setPendingProposal] = useState<ProposedStrategyUpdate | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    buildWelcomeChat(initialProfile)
  );
  const [approvalLogs, setApprovalLogs] = useState<StrategyApprovalLog[]>(
    saved?.approvalLogs ?? [
      {
        id: 'log-init',
        timestamp: 'Nov 14, 2026 · 08:42',
        title: initialStrategy.name,
        source: 'initial',
        summary: 'Initialized 4-zone crop rotation baseline from NASA SMAP & MODIS pass.',
      },
    ]
  );

  // Shared contract.json state
  const [contractSettings, setContractSettings] = useState<ContractSettings>(
    saved?.contractSettings ?? DEFAULT_CONTRACT_SETTINGS
  );
  const [apiEndpoint, setApiEndpoint] = useState<string>(
    saved?.apiEndpoint ??
      ((import.meta.env.VITE_TADAWOL_API_URL as string | undefined) ??
        'http://localhost:8000/api/analyze')
  );
  const [remoteOverrideResponse, setRemoteOverrideResponse] = useState<TadawolApiResponse | null>(
    null
  );
  const [contractSource, setContractSource] = useState<'remote-api' | 'local-simulator'>(
    'local-simulator'
  );
  const [isSyncingApi, setIsSyncingApi] = useState(false);
  const [lastApiError, setLastApiError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const contractRequest: TadawolApiRequest = useMemo(() => {
    const activeStrat = pendingProposal ? pendingProposal.proposedStrategy : strategy;
    return buildContractRequest(profile, activeStrat, {
      years: contractSettings.years,
      slope_deg: contractSettings.slope_deg,
      weights: contractSettings.weights,
      scenario: contractSettings.scenario,
      replay_year: contractSettings.replay_year,
      rain_change_pct: contractSettings.rain_change_pct,
    });
  }, [profile, strategy, pendingProposal, contractSettings]);

  const localSimulatedResponse = useMemo(() => {
    const activeStrat = pendingProposal ? pendingProposal.proposedStrategy : strategy;
    return simulateContractResponse(contractRequest, profile, activeStrat);
  }, [contractRequest, profile, strategy, pendingProposal]);

  const contractResponse = remoteOverrideResponse ?? localSimulatedResponse;

  // Clear stale remote response whenever request inputs change unless re-synced
  useEffect(() => {
    if (!apiEndpoint.trim()) {
      setRemoteOverrideResponse(null);
      setContractSource('local-simulator');
    }
  }, [contractRequest, apiEndpoint]);

  useEffect(() => {
    try {
      const toSave: PersistedState = {
        isAuthenticated,
        screen,
        profile,
        strategy,
        approvalLogs,
        contractSettings,
        apiEndpoint,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // ignore storage quota
    }
  }, [isAuthenticated, screen, profile, strategy, approvalLogs, contractSettings, apiEndpoint]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4200);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const updateContractSettings = (updates: Partial<ContractSettings>) => {
    setContractSettings((prev) => ({
      ...prev,
      ...updates,
      weights: updates.weights ? { ...prev.weights, ...updates.weights } : prev.weights,
    }));
    setRemoteOverrideResponse(null);
  };

  const syncContractWithBackend = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl ?? apiEndpoint).trim();
    setIsSyncingApi(true);
    setLastApiError(null);
    const activeStrat = pendingProposal ? pendingProposal.proposedStrategy : strategy;
    const result = await executeOptimizationContract(
      contractRequest,
      profile,
      activeStrat,
      targetUrl
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
        showToast(`API unreachable (${result.error}) — using local contract simulator.`);
      } else {
        showToast('Contract response simulated locally (no remote URL configured).');
      }
    }
  };

  const navigate = (nextScreen: AppScreen, options?: { authTab?: 'login' | 'register' }) => {
    if (options?.authTab) setAuthTab(options.authTab);
    if (
      !isAuthenticated &&
      (nextScreen === 'dashboard' ||
        nextScreen === 'history' ||
        nextScreen === 'rotation-lab' ||
        nextScreen === 'predictions')
    ) {
      setScreen('auth');
      return;
    }
    setScreen(nextScreen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loginDemo = (email?: string) => {
    setIsAuthenticated(true);
    if (email && email.trim() && email.toLowerCase() !== profile.email.toLowerCase()) {
      const derivedName = email
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setProfile((prev) => ({
        ...prev,
        email: email.trim(),
        name: derivedName.length > 2 ? derivedName : prev.name,
      }));
    }
    setScreen('dashboard');
    showToast('Signed in · Live NASA SMAP & field telemetry synchronized.');
  };

  const registerFarm = (newFarm: Omit<FarmerProfile, 'nasaBaseline'>) => {
    const nasaBaseline = generateNasaBaseline(newFarm.coordinates, newFarm.soilType);
    const fullProfile: FarmerProfile = {
      ...newFarm,
      nasaBaseline,
    };
    const freshStrategy = createInitialStrategy(fullProfile);
    setProfile(fullProfile);
    setStrategy(freshStrategy);
    setPendingProposal(null);
    setRemoteOverrideResponse(null);
    setChatMessages(buildWelcomeChat(fullProfile));
    setApprovalLogs([
      {
        id: `log-${Date.now()}`,
        timestamp: 'Just now',
        title: freshStrategy.name,
        source: 'initial',
        summary: `Initialized farm (${fullProfile.areaHectares} ha, ${fullProfile.soilType}) with NASA baseline (${nasaBaseline.satellitePassId}).`,
      },
    ]);
    setIsAuthenticated(true);
    setScreen('dashboard');
    showToast(`Farm "${fullProfile.farmName}" (${fullProfile.areaHectares} ha) initialized!`);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setPendingProposal(null);
    setScreen('landing');
    showToast('Signed out cleanly.');
  };

  const updateProfile = (updates: Partial<FarmerProfile>) => {
    setProfile((prev) => {
      const merged = { ...prev, ...updates };
      if (updates.soilType || updates.coordinates) {
        merged.nasaBaseline = generateNasaBaseline(merged.coordinates, merged.soilType);
      }
      return merged;
    });
    showToast('Farm profile & baseline metrics updated.');
  };

  const proposeFromParameters = (params: RotationParameters) => {
    const proposal = createProposalFromParameters(params, strategy, profile);
    setPendingProposal(proposal);
  };

  const sendChatMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: nowLabel,
    };

    const { reply, proposal } = processAgronomyChatPrompt(trimmed, strategy, profile);

    const assistantMsg: ChatMessage = {
      id: `ai-${Date.now() + 1}`,
      role: 'assistant',
      content: reply,
      timestamp: nowLabel,
      proposalId: proposal?.id,
      proposalSnapshot: proposal,
      proposalStatus: proposal ? 'pending' : undefined,
    };

    setChatMessages((prev) => {
      const updated = proposal
        ? prev.map((m) =>
            m.proposalStatus === 'pending' ? { ...m, proposalStatus: 'discarded' as const } : m
          )
        : prev;
      return [...updated, userMsg, assistantMsg];
    });

    if (proposal) {
      setPendingProposal(proposal);
    }
  };

  const approvePendingProposal = () => {
    if (!pendingProposal) return;
    const committed: RotationStrategy = {
      ...pendingProposal.proposedStrategy,
      approvedAt: new Date().toISOString(),
    };
    setStrategy(committed);
    setChatMessages((prev) =>
      prev.map((m) =>
        m.proposalId === pendingProposal.id
          ? { ...m, proposalStatus: 'approved' as const }
          : m
      )
    );
    setApprovalLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: pendingProposal.title,
        source: pendingProposal.source,
        summary: pendingProposal.summary,
      },
      ...prev,
    ]);
    const approvedTitle = pendingProposal.title;
    setPendingProposal(null);
    showToast(`Approved "${approvedTitle}" — S1–S4 map, roadmap & forecast recalculated!`);
  };

  const discardPendingProposal = () => {
    if (!pendingProposal) return;
    const discardId = pendingProposal.id;
    setChatMessages((prev) =>
      prev.map((m) =>
        m.proposalId === discardId ? { ...m, proposalStatus: 'discarded' as const } : m
      )
    );
    setPendingProposal(null);
    showToast('Proposed changes discarded — active approved strategy kept.');
  };

  const resetDemoState = () => {
    localStorage.removeItem(STORAGE_KEY);
    const freshStrategy = createInitialStrategy(DEFAULT_FARMER_PROFILE);
    setProfile(DEFAULT_FARMER_PROFILE);
    setStrategy(freshStrategy);
    setPendingProposal(null);
    setContractSettings(DEFAULT_CONTRACT_SETTINGS);
    setRemoteOverrideResponse(null);
    setChatMessages(buildWelcomeChat(DEFAULT_FARMER_PROFILE));
    showToast('Demo farm state restored to default baseline.');
  };

  return (
    <FarmContext.Provider
      value={{
        screen,
        authTab,
        isAuthenticated,
        profile,
        strategy,
        pendingProposal,
        chatMessages,
        approvalLogs,
        toastMessage,
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
        navigate,
        loginDemo,
        registerFarm,
        logout,
        updateProfile,
        proposeFromParameters,
        sendChatMessage,
        approvePendingProposal,
        discardPendingProposal,
        showToast,
        resetDemoState,
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
