import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFarm } from '../context/FarmContext';
import { useTheme } from '../context/ThemeContext';
import { CurrencySelector } from '../components/CurrencySelector';
import {
  computeStrategyFinancials,
  CurrencyOption,
  formatFarmMoney,
  getCurrencyByCode,
  getRegionalMarketProfile,
  getTypicalPlanningCostsLocal,
} from '../data/regionalMarketData';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Fuel,
  Landmark,
  Pencil,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Target,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';

export const MarketFinancePage: React.FC = () => {
  const {
    profile,
    top3Strategies,
    activeStrategy,
    selectedStrategyId,
    selectRotationStrategy,
    saveFarmFinanceInputs,
    openAiAdvisorForCustomPlan,
    navigate,
  } = useFarm();
  const { isDark } = useTheme();

  const market = useMemo(() => getRegionalMarketProfile(profile), [profile]);
  const savedFin = profile.financeInputs;

  const activeCurrency: CurrencyOption = useMemo(
    () => getCurrencyByCode(savedFin?.currencyCode, profile.countryCode),
    [savedFin?.currencyCode, profile.countryCode]
  );

  const typicalCosts = useMemo(
    () => getTypicalPlanningCostsLocal(profile, activeCurrency.code),
    [profile, activeCurrency.code]
  );

  const [scaleMode, setScaleMode] = useState<'farm' | 'ha'>('farm');
  const [inputCostDeltaPct, setInputCostDeltaPct] = useState<number>(0);
  const [customPricesUsd, setCustomPricesUsd] = useState<Record<string, number>>({});
  const [focusedStrategyId, setFocusedStrategyId] = useState<string>(
    selectedStrategyId ?? activeStrategy.id
  );
  const [editingMyCosts, setEditingMyCosts] = useState<boolean>(false);

  const [draftCapacity, setDraftCapacity] = useState<string>(
    savedFin?.seasonBudgetCapacityLocal ? String(savedFin.seasonBudgetCapacityLocal) : ''
  );
  const [draftOp, setDraftOp] = useState<string>(
    savedFin?.operatingCostPerHaLocal ? String(savedFin.operatingCostPerHaLocal) : ''
  );
  const [draftFert, setDraftFert] = useState<string>(
    savedFin?.fertilizerCostPerHaLocal !== undefined ? String(savedFin.fertilizerCostPerHaLocal) : ''
  );
  const [draftLastProfit, setDraftLastProfit] = useState<string>(
    savedFin?.lastSeasonNetProfitLocal !== undefined ? String(savedFin.lastSeasonNetProfitLocal) : ''
  );
  const [draftTargetProfit, setDraftTargetProfit] = useState<string>(
    savedFin?.targetAnnualProfitLocal ? String(savedFin.targetAnnualProfitLocal) : ''
  );
  const [draftIrrEnergy, setDraftIrrEnergy] = useState<string>(
    savedFin?.irrigationEnergyCostPerHaLocal !== undefined
      ? String(savedFin.irrigationEnergyCostPerHaLocal)
      : ''
  );

  useEffect(() => {
    setDraftCapacity(
      savedFin?.seasonBudgetCapacityLocal ? String(savedFin.seasonBudgetCapacityLocal) : ''
    );
    setDraftOp(
      savedFin?.operatingCostPerHaLocal ? String(savedFin.operatingCostPerHaLocal) : ''
    );
    setDraftFert(
      savedFin?.fertilizerCostPerHaLocal !== undefined ? String(savedFin.fertilizerCostPerHaLocal) : ''
    );
    setDraftLastProfit(
      savedFin?.lastSeasonNetProfitLocal !== undefined ? String(savedFin.lastSeasonNetProfitLocal) : ''
    );
    setDraftTargetProfit(
      savedFin?.targetAnnualProfitLocal ? String(savedFin.targetAnnualProfitLocal) : ''
    );
    setDraftIrrEnergy(
      savedFin?.irrigationEnergyCostPerHaLocal !== undefined
        ? String(savedFin.irrigationEnergyCostPerHaLocal)
        : ''
    );
    setEditingMyCosts(false);
  }, [profile.farmName, profile.countryCode, savedFin]);

  const includeSubsidies = savedFin?.includeSubsidies ?? true;

  const candidateStrategies = useMemo(() => {
    const list = [...top3Strategies];
    if (!list.some((s) => s.id === activeStrategy.id)) {
      list.unshift(activeStrategy);
    }
    return list;
  }, [top3Strategies, activeStrategy]);

  const effectiveFocusedId = useMemo(() => {
    if (candidateStrategies.some((s) => s.id === focusedStrategyId)) return focusedStrategyId;
    return activeStrategy.id;
  }, [candidateStrategies, focusedStrategyId, activeStrategy.id]);

  const allFinancials = useMemo(() => {
    return candidateStrategies.map((strategy) => ({
      strategy,
      fin: computeStrategyFinancials(profile, strategy, {
        customPricesUsd,
        inputCostDeltaPct,
        includeSubsidies,
      }),
    }));
  }, [candidateStrategies, profile, customPricesUsd, inputCostDeltaPct, includeSubsidies]);

  const focusedEntry =
    allFinancials.find((e) => e.strategy.id === effectiveFocusedId) ?? allFinancials[0];
  const focusedFin = focusedEntry.fin;
  const focusedStrategy = focusedEntry.strategy;

  const bestFinancialEntry = useMemo(() => {
    return [...allFinancials].sort(
      (a, b) => b.fin.annualNetProfitUsdPerHa - a.fin.annualNetProfitUsdPerHa
    )[0];
  }, [allFinancials]);

  const area = Math.max(0.5, profile.areaHectares);
  const scaleMult = scaleMode === 'farm' ? area : 1;
  const fx = activeCurrency.fxPerUsd;
  const currencyLabel = activeCurrency.code;

  const fmt = (usdAmount: number, decimals = 0) =>
    formatFarmMoney(usdAmount, market, activeCurrency.code, decimals);
  const fmtScaled = (usdPerHa: number) => fmt(usdPerHa * scaleMult, 0);

  const comparisonChartData = useMemo(() => {
    const baseNet = Math.round(focusedFin.baselineAnnualNetProfitUsdPerHa * scaleMult * fx);
    return [
      {
        label: 'Same Crop',
        netProfit: baseNet,
        isBaseline: true,
        isFocused: false,
      },
      ...allFinancials.map((entry, idx) => ({
        label: `Option ${idx + 1}`,
        netProfit: Math.round(entry.fin.annualNetProfitUsdPerHa * scaleMult * fx),
        isBaseline: false,
        isFocused: entry.strategy.id === focusedStrategy.id,
      })),
    ];
  }, [allFinancials, focusedFin.baselineAnnualNetProfitUsdPerHa, focusedStrategy.id, scaleMult, fx]);

  const activeCropIds = useMemo(() => {
    const set = new Set<string>();
    allFinancials.forEach((e) => e.fin.seasonRows.forEach((r) => set.add(r.cropId)));
    return set;
  }, [allFinancials]);

  const orderedCropQuotes = useMemo(() => {
    const all = Object.values(market.cropPrices);
    return [...all].sort((a, b) => {
      const aAct = activeCropIds.has(a.cropId) ? 1 : 0;
      const bAct = activeCropIds.has(b.cropId) ? 1 : 0;
      if (aAct !== bAct) return bAct - aAct;
      const aVer = a.dataBasis === 'Verified 2026' ? 1 : 0;
      const bVer = b.dataBasis === 'Verified 2026' ? 1 : 0;
      if (aVer !== bVer) return bVer - aVer;
      return b.priceUsdPerTonne - a.priceUsdPerTonne;
    });
  }, [market.cropPrices, activeCropIds]);

  const hasOverrides = Object.keys(customPricesUsd).length > 0 || inputCostDeltaPct !== 0;

  const handleCurrencyChange = (nextCurr: CurrencyOption) => {
    const ratio = nextCurr.fxPerUsd / activeCurrency.fxPerUsd;
    const scaleNum = (v?: number) => (v !== undefined ? Math.round(v * ratio) : undefined);

    saveFarmFinanceInputs({
      ...(savedFin ?? { enabled: true, includeSubsidies: true }),
      enabled: true,
      currencyCode: nextCurr.code,
      seasonBudgetCapacityLocal: scaleNum(savedFin?.seasonBudgetCapacityLocal),
      operatingCostPerHaLocal: scaleNum(savedFin?.operatingCostPerHaLocal),
      fertilizerCostPerHaLocal: scaleNum(savedFin?.fertilizerCostPerHaLocal),
      lastSeasonNetProfitLocal: scaleNum(savedFin?.lastSeasonNetProfitLocal),
      targetAnnualProfitLocal: scaleNum(savedFin?.targetAnnualProfitLocal),
      irrigationEnergyCostPerHaLocal: scaleNum(savedFin?.irrigationEnergyCostPerHaLocal),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleSubsidies = () => {
    saveFarmFinanceInputs({
      ...(savedFin ?? { enabled: true, currencyCode: activeCurrency.code }),
      enabled: true,
      currencyCode: activeCurrency.code,
      includeSubsidies: !includeSubsidies,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveMyCosts = (e: React.FormEvent) => {
    e.preventDefault();
    saveFarmFinanceInputs({
      ...(savedFin ?? { includeSubsidies: true }),
      enabled: true,
      currencyCode: activeCurrency.code,
      seasonBudgetCapacityLocal:
        Number(draftCapacity) > 0 ? Math.round(Number(draftCapacity)) : undefined,
      operatingCostPerHaLocal: Number(draftOp) > 0 ? Math.round(Number(draftOp)) : undefined,
      fertilizerCostPerHaLocal:
        draftFert !== '' && Number.isFinite(Number(draftFert)) && Number(draftFert) >= 0
          ? Math.round(Number(draftFert))
          : undefined,
      lastSeasonNetProfitLocal:
        draftLastProfit !== '' && Number.isFinite(Number(draftLastProfit))
          ? Math.round(Number(draftLastProfit))
          : undefined,
      targetAnnualProfitLocal:
        Number(draftTargetProfit) > 0 ? Math.round(Number(draftTargetProfit)) : undefined,
      irrigationEnergyCostPerHaLocal:
        draftIrrEnergy !== '' &&
        Number.isFinite(Number(draftIrrEnergy)) &&
        Number(draftIrrEnergy) >= 0
          ? Math.round(Number(draftIrrEnergy))
          : undefined,
      includeSubsidies,
      updatedAt: new Date().toISOString(),
    });
    setEditingMyCosts(false);
  };

  const handlePriceOverrideChange = (cropId: string, rawInput: string) => {
    const cleaned = rawInput.replace(/[^0-9.]/g, '');
    if (!cleaned) {
      setCustomPricesUsd((prev) => {
        const next = { ...prev };
        delete next[cropId];
        return next;
      });
      return;
    }
    const parsed = Number(cleaned);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const usdEquivalent = parsed / activeCurrency.fxPerUsd;
    setCustomPricesUsd((prev) => ({
      ...prev,
      [cropId]: Math.max(25, Math.min(5000, usdEquivalent)),
    }));
  };

  const resetOverrides = () => {
    setCustomPricesUsd({});
    setInputCostDeltaPct(0);
  };

  const chartGridColor = isDark ? '#273A2E' : '#E6E4DC';
  const chartAxisColor = isDark ? '#B7C7BA' : '#3A3A3A';
  const tooltipStyle = {
    backgroundColor: isDark ? '#16201A' : '#FFFFFF',
    borderColor: isDark ? '#2E4537' : '#DFDDD6',
    borderRadius: 12,
    fontSize: 12,
    color: isDark ? '#F2F6F1' : '#111111',
  };

  const hasTrackingStrip =
    focusedFin.budgetCapacityUsd !== undefined ||
    focusedFin.lastSeasonProfitUsd !== undefined ||
    focusedFin.targetProfitUsd !== undefined;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Global Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111]">
            {profile.countryFlag} {profile.countryName} Market &amp; Finance
          </h2>
          <p className="text-xs text-[#4A4A4A] mt-0.5">
            {profile.farmName} ({profile.areaHectares} ha) · {market.marketHeadline}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CurrencySelector
            compact
            align="right"
            value={activeCurrency.code}
            fallbackCountryCode={profile.countryCode}
            onChange={handleCurrencyChange}
          />

          <div className="inline-flex p-0.5 rounded-full bg-[#EFECE4] border border-[#DDD9CF] text-xs font-bold">
            <button
              type="button"
              onClick={() => setScaleMode('farm')}
              className={`px-3 py-1 rounded-full transition cursor-pointer ${
                scaleMode === 'farm' ? 'bg-[#111111] text-white' : 'text-[#3A3A3A]'
              }`}
            >
              {profile.areaHectares} ha
            </button>
            <button
              type="button"
              onClick={() => setScaleMode('ha')}
              className={`px-3 py-1 rounded-full transition cursor-pointer ${
                scaleMode === 'ha' ? 'bg-[#111111] text-white' : 'text-[#3A3A3A]'
              }`}
            >
              Per ha
            </button>
          </div>

          <button
            type="button"
            onClick={handleToggleSubsidies}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-extrabold transition cursor-pointer ${
              includeSubsidies
                ? 'bg-[#E3F5EB] border-[#00873A] text-[#005222]'
                : 'bg-[#FFFEFB] border-[#D9D5CB] text-[#4A4A4A]'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            Subsidies {includeSubsidies ? 'On' : 'Off'}
          </button>

          <button
            type="button"
            onClick={() => setEditingMyCosts((v) => !v)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F5F4F0] border border-[#DFDDD6] hover:border-[#111111] text-xs font-extrabold text-[#111111] cursor-pointer"
          >
            <Pencil className="w-3 h-3" />
            My Capacity &amp; Costs
          </button>

          {hasOverrides && (
            <button
              type="button"
              onClick={resetOverrides}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FDF6DC] border border-[#EBD58B] text-[#6E5100] text-xs font-extrabold cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Inline Farm Capacity, Costs & Profit Goal Editor */}
      {editingMyCosts && (
        <form
          onSubmit={handleSaveMyCosts}
          className="surface-card p-4 sm:p-5 bg-[#FFFEFB] border border-[#00873A] space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-[#005222]">
              Your Farm Capacity, Costs &amp; Profit Tracking ({currencyLabel} · No confidential data)
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setDraftCapacity(String(typicalCosts.seasonBudgetCapacityLocal));
                  setDraftOp(String(typicalCosts.operatingCostPerHaLocal));
                  setDraftFert(String(typicalCosts.fertilizerCostPerHaLocal));
                  setDraftIrrEnergy(String(typicalCosts.irrigationEnergyCostPerHaLocal));
                }}
                className="text-[11px] font-extrabold text-[#007432] hover:underline cursor-pointer"
              >
                Fill typical {profile.countryName} range
              </button>
              <button
                type="button"
                onClick={() => setEditingMyCosts(false)}
                className="p-1 text-[#555555] hover:text-[#111111] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#111111] mb-1">
                Season Cash Capacity ({currencyLabel}) *
              </label>
              <input
                type="number"
                min={1}
                step={50}
                required
                value={draftCapacity}
                onChange={(e) => setDraftCapacity(e.target.value)}
                placeholder={`e.g. ${typicalCosts.seasonBudgetCapacityLocal}`}
                className="w-full px-3 py-2 rounded-xl border border-[#C9C6BC] bg-white text-sm font-extrabold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#111111] mb-1">
                Avg. Cost / ha ({currencyLabel}) *
              </label>
              <input
                type="number"
                min={1}
                step={10}
                required
                value={draftOp}
                onChange={(e) => setDraftOp(e.target.value)}
                placeholder={`e.g. ${typicalCosts.operatingCostPerHaLocal}`}
                className="w-full px-3 py-2 rounded-xl border border-[#C9C6BC] bg-white text-sm font-extrabold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#111111] mb-1">
                Fertilizer / ha ({currencyLabel}) *
              </label>
              <input
                type="number"
                min={0}
                step={10}
                required
                value={draftFert}
                onChange={(e) => setDraftFert(e.target.value)}
                placeholder={`e.g. ${typicalCosts.fertilizerCostPerHaLocal}`}
                className="w-full px-3 py-2 rounded-xl border border-[#C9C6BC] bg-white text-sm font-extrabold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end pt-2 border-t border-[#ECEAE2]">
            <div>
              <label className="block text-[11px] font-bold text-[#4A4A4A] mb-1">
                Last Season Profit (Optional)
              </label>
              <input
                type="number"
                step={50}
                value={draftLastProfit}
                onChange={(e) => setDraftLastProfit(e.target.value)}
                placeholder="Whole farm"
                className="w-full px-3 py-2 rounded-xl border border-[#D6D3C9] bg-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#4A4A4A] mb-1">
                Target Profit Goal (Optional)
              </label>
              <input
                type="number"
                min={0}
                step={50}
                value={draftTargetProfit}
                onChange={(e) => setDraftTargetProfit(e.target.value)}
                placeholder="Whole farm / yr"
                className="w-full px-3 py-2 rounded-xl border border-[#D6D3C9] bg-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#4A4A4A] mb-1">
                Water &amp; Fuel / ha (Optional)
              </label>
              <input
                type="number"
                min={0}
                step={10}
                value={draftIrrEnergy}
                onChange={(e) => setDraftIrrEnergy(e.target.value)}
                placeholder={`e.g. ${typicalCosts.irrigationEnergyCostPerHaLocal}`}
                className="w-full px-3 py-2 rounded-xl border border-[#D6D3C9] bg-white text-xs font-bold"
              />
            </div>
            <button type="submit" className="btn-pill btn-pill-primary text-xs justify-center py-2.5">
              Save Farm Finance
            </button>
          </div>
        </form>
      )}

      {/* Farm Cash Capacity, Last Season Comparison & Target Profit Goal Strip */}
      {hasTrackingStrip && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {focusedFin.budgetCapacityUsd !== undefined &&
            focusedFin.budgetUsagePct !== undefined && (
              <div
                className={`surface-card p-4 border-l-4 ${
                  focusedFin.withinBudget ? 'border-l-[#00873A]' : 'border-l-[#D94E28]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-[#4A4A4A] inline-flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-[#007432]" />
                    Season Cash Capacity
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 ${
                      focusedFin.withinBudget
                        ? 'bg-[#E3F5EB] text-[#005222]'
                        : 'bg-[#FDE8E2] text-[#9A2D11]'
                    }`}
                  >
                    {focusedFin.withinBudget ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Within Budget
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3" /> Over Budget
                      </>
                    )}
                  </span>
                </div>
                <div className="text-sm font-extrabold text-[#111111] mt-1.5">
                  {fmt(focusedFin.annualFarmCostUsd)} / {fmt(focusedFin.budgetCapacityUsd)} (
                  {focusedFin.budgetUsagePct}%)
                </div>
                <div className="h-2 rounded-full bg-[#EFECE4] overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full ${
                      focusedFin.withinBudget ? 'bg-[#00873A]' : 'bg-[#D94E28]'
                    }`}
                    style={{ width: `${Math.min(100, focusedFin.budgetUsagePct)}%` }}
                  />
                </div>
              </div>
            )}

          {focusedFin.lastSeasonProfitUsd !== undefined &&
            focusedFin.vsLastSeasonProfitUsd !== undefined && (
              <div className="surface-card p-4 border-l-4 border-l-[#00873A]">
                <div className="text-xs font-bold text-[#4A4A4A] inline-flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#007432]" />
                  vs. Last Season Actual Profit
                </div>
                <div
                  className={`text-sm font-extrabold mt-1.5 ${
                    focusedFin.vsLastSeasonProfitUsd >= 0 ? 'text-[#007432]' : 'text-[#B83B1A]'
                  }`}
                >
                  {focusedFin.vsLastSeasonProfitUsd >= 0 ? '+' : ''}
                  {fmt(focusedFin.vsLastSeasonProfitUsd)} predicted change
                </div>
                <div className="text-[11px] text-[#555555] mt-1">
                  Last season: {fmt(focusedFin.lastSeasonProfitUsd)} · Predicted:{' '}
                  {fmt(focusedFin.annualFarmNetProfitUsd)}
                </div>
              </div>
            )}

          {focusedFin.targetProfitUsd !== undefined &&
            focusedFin.targetGoalPct !== undefined && (
              <div className="surface-card p-4 border-l-4 border-l-[#EBB40E]">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-[#4A4A4A] inline-flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#8E6900]" />
                    Target Annual Profit Goal
                  </span>
                  <span className="text-xs font-extrabold text-[#007432]">
                    {focusedFin.targetGoalPct}%
                  </span>
                </div>
                <div className="text-sm font-extrabold text-[#111111] mt-1.5">
                  {fmt(focusedFin.annualFarmNetProfitUsd)} / {fmt(focusedFin.targetProfitUsd)}
                </div>
                <div className="h-2 rounded-full bg-[#EFECE4] overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full bg-[#EBB40E]"
                    style={{ width: `${Math.min(100, focusedFin.targetGoalPct)}%` }}
                  />
                </div>
              </div>
            )}
        </div>
      )}

      {/* SECTION 1: 4 High-Clarity KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="surface-card p-4 sm:p-5 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-[#4A4A4A]">Est. Net Profit / yr</div>
            <div className="text-2xl font-extrabold text-[#111111] mt-1">
              {fmtScaled(focusedFin.annualNetProfitUsdPerHa)}
            </div>
            <div className="text-xs font-semibold text-[#555555] mt-1.5">
              ROI {focusedFin.roiPct}% · Margin {focusedFin.profitMarginPct}%
            </div>
          </div>
          <span className="w-10 h-10 rounded-xl bg-[#E3F5EB] text-[#007432] flex items-center justify-center shrink-0">
            <Banknote className="w-5 h-5" />
          </span>
        </div>

        <div className="surface-card p-4 sm:p-5 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-[#4A4A4A]">Extra Profit vs Same Crop</div>
            <div
              className={`text-2xl font-extrabold mt-1 flex items-center gap-1 ${
                focusedFin.extraAnnualProfitUsdPerHa >= 0 ? 'text-[#007432]' : 'text-[#B83B1A]'
              }`}
            >
              {focusedFin.extraAnnualProfitUsdPerHa >= 0 ? (
                <ArrowUpRight className="w-5 h-5 shrink-0" />
              ) : (
                <ArrowDownRight className="w-5 h-5 shrink-0" />
              )}
              {focusedFin.extraAnnualProfitUsdPerHa >= 0 ? '+' : ''}
              {fmtScaled(focusedFin.extraAnnualProfitUsdPerHa)}
            </div>
            <div className="text-xs font-semibold text-[#555555] mt-1.5">
              5-yr gain: {focusedFin.fiveYearExtraFarmProfitUsd >= 0 ? '+' : ''}
              {fmt(focusedFin.fiveYearExtraFarmProfitUsd)}
            </div>
          </div>
          <span className="w-10 h-10 rounded-xl bg-[#FDF6DC] text-[#8E6900] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </span>
        </div>

        <div className="surface-card p-4 sm:p-5 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-[#4A4A4A]">Fertilizer Saved / yr</div>
            <div className="text-2xl font-extrabold text-[#007432] mt-1">
              {fmtScaled(focusedFin.annualFertilizerSavedUsdPerHa)}
            </div>
            <div className="text-xs font-semibold text-[#555555] mt-1.5">
              2026 DAP: {fmt(market.inputs.dapUsdPerTonne * (1 + inputCostDeltaPct / 100))}/t
            </div>
          </div>
          <span className="w-10 h-10 rounded-xl bg-[#E3F5EB] text-[#007432] flex items-center justify-center shrink-0">
            <Sprout className="w-5 h-5" />
          </span>
        </div>

        <div className="surface-card p-4 sm:p-5 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-[#4A4A4A]">Break-Even Harvest</div>
            <div className="text-2xl font-extrabold text-[#111111] mt-1">
              {focusedFin.avgBreakEvenRatioPct}%
            </div>
            <div className="text-xs font-semibold text-[#555555] mt-1.5">
              {focusedFin.cashFlowRisk} risk · {focusedFin.marketFitScore}/100 market fit
            </div>
          </div>
          <span className="w-10 h-10 rounded-xl bg-[#EFECE4] text-[#111111] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* SECTION 2: Strategy Profit Comparison (All Visible Together) */}
      <div className="surface-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#007432]" />
            <h3 className="text-base font-extrabold text-[#111111]">
              Rotation Strategy Profit Comparison
            </h3>
          </div>
          <span className="text-xs font-semibold text-[#555555]">
            Annual net profit ({currencyLabel} · {scaleMode === 'farm' ? `${profile.areaHectares} ha` : 'per ha'})
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-5 space-y-2.5">
            {allFinancials.map((entry, idx) => {
              const isFocused = entry.strategy.id === focusedStrategy.id;
              const isBest = entry.strategy.id === bestFinancialEntry.strategy.id;
              return (
                <button
                  key={entry.strategy.id}
                  type="button"
                  onClick={() => setFocusedStrategyId(entry.strategy.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                    isFocused
                      ? 'bg-[#E3F5EB]/70 border-[#00873A] ring-1 ring-[#00873A]'
                      : 'bg-[#FFFEFB] border-[#DFDDD6] hover:border-[#111111]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-extrabold text-[#111111]">
                        Option {idx + 1} · {entry.strategy.focusTag}
                      </span>
                      {isBest && (
                        <span className="px-2 py-0.5 rounded-full bg-[#EBB40E] text-[#111111] text-[10px] font-extrabold">
                          Top Profit
                        </span>
                      )}
                      {entry.fin.withinBudget === false && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FDE8E2] text-[#9A2D11] text-[10px] font-extrabold">
                          Over Budget
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#555555] truncate mt-0.5">
                      {entry.strategy.steps.map((s) => s.cropName.split('(')[0].trim()).join(' → ')}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-extrabold text-[#007432]">
                      {fmtScaled(entry.fin.annualNetProfitUsdPerHa)}
                    </div>
                    <div className="text-[10px] font-bold text-[#555555]">per yr</div>
                  </div>
                </button>
              );
            })}

            <div className="p-3 rounded-xl bg-[#F5F4F0] border border-[#E5E3DB] text-xs font-medium text-[#2E2E2E]">
              {focusedFin.plainVerdict}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  selectRotationStrategy(focusedStrategy.id);
                  navigate('rotation-lab');
                }}
                className="flex-1 btn-pill btn-pill-primary text-xs justify-center"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Use Plan in Rotation Lab
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={openAiAdvisorForCustomPlan}
                className="btn-pill btn-pill-outline text-xs"
              >
                <Bot className="w-3.5 h-3.5" />
                Ask AI
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparisonChartData}
                  margin={{ top: 10, right: 12, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: chartAxisColor, fontWeight: 700 }}
                    axisLine={{ stroke: chartGridColor }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: chartAxisColor }}
                    axisLine={{ stroke: chartGridColor }}
                    tickFormatter={(v) =>
                      Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`
                    }
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [
                      `${Number(value).toLocaleString()} ${currencyLabel}`,
                      'Est. Net Profit / yr',
                    ]}
                  />
                  <Bar dataKey="netProfit" radius={[8, 8, 0, 0]} maxBarSize={56}>
                    {comparisonChartData.map((entry, idx) => (
                      <Cell
                        key={`bar-${idx}`}
                        fill={
                          entry.isBaseline
                            ? '#9CA3AF'
                            : entry.isFocused
                              ? '#00873A'
                              : '#63B57D'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Season-by-Season Financial Budget Breakdown */}
      <div className="surface-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#007432]" />
            <h3 className="text-base font-extrabold text-[#111111]">
              Season-by-Season Budget ({focusedStrategy.title})
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {allFinancials.map((entry, idx) => (
              <button
                key={entry.strategy.id}
                type="button"
                onClick={() => setFocusedStrategyId(entry.strategy.id)}
                className={`px-3 py-1 rounded-full text-xs font-extrabold border transition cursor-pointer ${
                  entry.strategy.id === focusedStrategy.id
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-[#FFFEFB] text-[#3A3A3A] border-[#DFDDD6]'
                }`}
              >
                Option {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#DFDDD6] text-[#555555] text-[11px] uppercase">
                <th className="py-2.5 pr-3 font-extrabold">Season &amp; Crop</th>
                <th className="py-2.5 px-3 font-extrabold text-right">Yield (Break-Even)</th>
                <th className="py-2.5 px-3 font-extrabold text-right">Price / t</th>
                <th className="py-2.5 px-3 font-extrabold text-right">Revenue</th>
                <th className="py-2.5 px-3 font-extrabold text-right">Costs</th>
                {includeSubsidies && (
                  <th className="py-2.5 px-3 font-extrabold text-right">Subsidy</th>
                )}
                <th className="py-2.5 pl-3 font-extrabold text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECEAE2]">
              {focusedFin.seasonRows.map((row) => (
                <tr key={row.stepNumber} className="hover:bg-[#F5F4F0]/60 transition">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: row.cropColor }}
                      />
                      <span className="font-extrabold text-[#111111]">
                        S{row.stepNumber}: {row.cropName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-bold text-[#111111]">{row.expectedYieldTha} t/ha</span>
                    <span className="text-[11px] text-[#555555] ml-1.5">
                      (BE {row.breakEvenYieldTha})
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#111111]">
                    {fmt(row.priceUsdPerTonne)}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-[#111111]">
                    {fmtScaled(row.grossRevenueUsdPerHa)}
                  </td>
                  <td className="py-3 px-3 text-right text-[#4A4A4A] font-semibold">
                    {fmtScaled(row.totalCostUsdPerHa)}
                  </td>
                  {includeSubsidies && (
                    <td className="py-3 px-3 text-right text-[#007432] font-bold">
                      {row.subsidyUsdPerHa > 0 ? `+${fmtScaled(row.subsidyUsdPerHa)}` : '0'}
                    </td>
                  )}
                  <td
                    className={`py-3 pl-3 text-right font-extrabold ${
                      row.netProfitUsdPerHa >= 0 ? 'text-[#007432]' : 'text-[#B83B1A]'
                    }`}
                  >
                    {fmtScaled(row.netProfitUsdPerHa)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: Editable 2026 Regional Crop Prices & Input Costs */}
      <div className="surface-card p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#007432]" />
            <h3 className="text-base font-extrabold text-[#111111]">
              2026 Regional Crop &amp; Input Prices ({currencyLabel})
            </h3>
          </div>
          <span className="text-xs text-[#555555]">
            Edit any buyer price to test live what-if returns
          </span>
        </div>

        {/* Input Cost Benchmarks + Stress Slider */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-[#E5E3DB]">
            <div className="text-[11px] font-bold text-[#555555]">Urea Fertilizer</div>
            <div className="text-base font-extrabold text-[#111111] mt-0.5">
              {fmt(market.inputs.ureaUsdPerTonne * (1 + inputCostDeltaPct / 100))}/t
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-[#E5E3DB]">
            <div className="text-[11px] font-bold text-[#555555]">DAP Fertilizer</div>
            <div className="text-base font-extrabold text-[#B83B1A] mt-0.5">
              {fmt(market.inputs.dapUsdPerTonne * (1 + inputCostDeltaPct / 100))}/t
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-[#E5E3DB] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-[#555555]">Farm Diesel</div>
              <div className="text-base font-extrabold text-[#111111] mt-0.5">
                {fmt(market.inputs.dieselUsdPerLiter * (1 + inputCostDeltaPct / 100), 2)}/L
              </div>
            </div>
            <Fuel className="w-4 h-4 text-[#555555]" />
          </div>
          <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-[#E5E3DB] space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#111111]">
              <span>Input Price Shift</span>
              <span className={inputCostDeltaPct > 0 ? 'text-[#B83B1A]' : 'text-[#007432]'}>
                {inputCostDeltaPct > 0 ? `+${inputCostDeltaPct}%` : `${inputCostDeltaPct}%`}
              </span>
            </div>
            <input
              type="range"
              min={-20}
              max={35}
              step={5}
              value={inputCostDeltaPct}
              onChange={(e) => setInputCostDeltaPct(Number(e.target.value))}
              className="w-full accent-[#00873A] cursor-pointer"
            />
          </div>
        </div>

        {/* Editable 2-Column Crop Price Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {orderedCropQuotes.map((quote) => {
            const isOverridden = customPricesUsd[quote.cropId] !== undefined;
            const currentUsd = customPricesUsd[quote.cropId] ?? quote.priceUsdPerTonne;
            const displayVal = Math.round(currentUsd * fx);
            const inActivePlans = activeCropIds.has(quote.cropId);

            return (
              <div
                key={quote.cropId}
                className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                  inActivePlans
                    ? 'bg-[#FFFEFB] border-[#C8DFD1]'
                    : 'bg-[#FFFEFB] border-[#E5E3DB]'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-extrabold text-[#111111] truncate">
                      {quote.cropName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        quote.dataBasis === 'Verified 2026'
                          ? 'bg-[#E3F5EB] text-[#005222]'
                          : 'bg-[#EFECE4] text-[#4A4A4A]'
                      }`}
                    >
                      {quote.sourceShort}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#555555] mt-0.5">
                    <span>{quote.demand} demand</span>
                    <span>·</span>
                    <span
                      className={`font-extrabold ${
                        quote.trendYoYPct >= 0 ? 'text-[#007432]' : 'text-[#B83B1A]'
                      }`}
                    >
                      {quote.trendYoYPct >= 0 ? '+' : ''}
                      {quote.trendYoYPct}% YoY
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min={1}
                    step={5}
                    value={displayVal}
                    onChange={(e) => handlePriceOverrideChange(quote.cropId, e.target.value)}
                    aria-label={`${quote.cropName} price per tonne`}
                    className={`w-24 px-2.5 py-1.5 rounded-lg border text-right text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-[#00873A] ${
                      isOverridden
                        ? 'bg-[#FDF6DC] border-[#EBB40E] text-[#111111]'
                        : 'bg-white border-[#D6D3C9] text-[#111111]'
                    }`}
                  />
                  <span className="text-[11px] font-bold text-[#555555] w-12">
                    {currencyLabel}/t
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 5: Government Subsidies, Credit & Support Programs WITH Official Portal Links */}
      <div className="surface-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-[#007432]" />
            <h3 className="text-base font-extrabold text-[#111111]">
              {profile.countryFlag} {profile.countryName} Subsidies, Credit &amp; Support Programs
            </h3>
          </div>
          <span className="text-xs font-bold text-[#007432]">
            {includeSubsidies ? 'Included in net profit' : 'Excluded from net profit'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {market.subsidies.map((sub) => (
            <div
              key={sub.title}
              className="p-4 rounded-xl bg-[#F5F4F0] border border-[#E5E3DB] flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-[#EFECE4] text-[#3A3A3A] text-[10px] font-extrabold uppercase tracking-wide">
                    {sub.category}
                  </span>
                  {sub.estimatedUsdPerHa > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#E3F5EB] text-[#005222] text-[11px] font-extrabold shrink-0">
                      +{fmt(sub.estimatedUsdPerHa)}/ha
                    </span>
                  )}
                </div>

                <div className="text-sm font-extrabold text-[#111111] leading-snug mt-2">
                  {sub.title}
                </div>

                <p className="text-xs text-[#3A3A3A] mt-1.5 leading-relaxed">
                  {sub.benefitSummary}
                </p>
              </div>

              <div className="pt-2.5 border-t border-[#E4E1D9] flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[#555555] truncate">
                  {sub.agency}
                </span>
                {sub.officialUrl && (
                  <a
                    href={sub.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white hover:bg-[#00873A] text-[#006B2E] hover:text-white border border-[#C8DFD1] hover:border-[#00873A] text-[11px] font-extrabold transition shrink-0"
                  >
                    Official Portal
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-[#555555]">
          Coverage across all 42 supported countries · 2025-2026 benchmarks: World Bank Commodity
          Markets, USDA NASS, European Commission Agri-food Data Portal &amp; national farm
          ministries (documented in Full Data Spec).
        </p>
      </div>
    </div>
  );
};
