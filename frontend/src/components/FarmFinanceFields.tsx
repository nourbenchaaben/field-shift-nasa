import React from 'react';
import { CurrencySelector } from './CurrencySelector';
import {
  CurrencyOption,
  getTypicalPlanningCostsLocal,
} from '../data/regionalMarketData';
import { IrrigationType } from '../types/farm';
import { Coins } from 'lucide-react';

export interface FarmFinanceDraft {
  enabled: boolean;
  currencyCode: string;
  seasonBudgetCapacity: string;
  operatingCostPerHa: string;
  fertilizerCostPerHa: string;
  lastSeasonNetProfit: string;
  targetAnnualProfit: string;
  irrigationEnergyCostPerHa: string;
}

interface FarmFinanceFieldsProps {
  draft: FarmFinanceDraft;
  onChange: (next: FarmFinanceDraft, currencyManuallyChanged?: boolean) => void;
  countryCode: string;
  countryName: string;
  irrigationType: IrrigationType;
  areaHectares: number;
  validationError?: string | null;
}

export const FarmFinanceFields: React.FC<FarmFinanceFieldsProps> = ({
  draft,
  onChange,
  countryCode,
  countryName,
  irrigationType,
  areaHectares,
  validationError,
}) => {
  const handleFillTypical = () => {
    const hint = getTypicalPlanningCostsLocal(
      {
        countryCode,
        countryName,
        irrigationType,
        areaHectares,
      },
      draft.currencyCode
    );
    onChange({
      ...draft,
      seasonBudgetCapacity: String(hint.seasonBudgetCapacityLocal),
      operatingCostPerHa: String(hint.operatingCostPerHaLocal),
      fertilizerCostPerHa: String(hint.fertilizerCostPerHaLocal),
      irrigationEnergyCostPerHa: draft.irrigationEnergyCostPerHa || String(hint.irrigationEnergyCostPerHaLocal),
    });
  };

  const handleCurrencyChange = (curr: CurrencyOption) => {
    onChange({ ...draft, currencyCode: curr.code }, true);
  };

  return (
    <div className="p-4 rounded-xl bg-[#F5F4F0] border border-[#E2E0D8] space-y-3.5">
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={draft.enabled}
          onChange={(e) => onChange({ ...draft, enabled: e.target.checked })}
          className="mt-0.5 w-4 h-4 rounded accent-[#00873A] cursor-pointer shrink-0"
        />
        <div className="min-w-0">
          <div className="text-xs font-extrabold text-[#111111] flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-[#00873A] shrink-0" />
            Include Farm Finance &amp; Market Planning (Optional)
          </div>
          <div className="text-[11px] text-[#555555] mt-0.5">
            Tracks budget capacity &amp; profits across all 42+ countries, factors profitability into
            Rotation Lab, and unlocks Market &amp; Finance. No bank or confidential data.
          </div>
        </div>
      </label>

      {draft.enabled && (
        <div className="space-y-4 pt-3 border-t border-[#E4E1D9]">
          {/* Currency Picker + Typical Fill Helper */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#111111]">
                Farm Currency (42+ countries)
              </span>
              <button
                type="button"
                onClick={handleFillTypical}
                className="text-[11px] font-extrabold text-[#007432] hover:underline cursor-pointer"
              >
                Fill typical {countryName} range ({Math.round(areaHectares)} ha)
              </button>
            </div>
            <CurrencySelector
              value={draft.currencyCode}
              fallbackCountryCode={countryCode}
              onChange={handleCurrencyChange}
            />
          </div>

          {/* REQUIRED FARM CAPACITY & COST INPUTS */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#E3F5EB] text-[#005222] text-[10px] font-extrabold uppercase tracking-wide">
                Required to track &amp; predict
              </span>
              <span className="text-[11px] text-[#555555]">
                Core money capacity &amp; season cost numbers
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#111111] mb-1">
                  Season Cash Capacity ({draft.currencyCode}) *
                </label>
                <input
                  type="number"
                  min={1}
                  step={50}
                  required={draft.enabled}
                  value={draft.seasonBudgetCapacity}
                  onChange={(e) =>
                    onChange({ ...draft, seasonBudgetCapacity: e.target.value })
                  }
                  placeholder="Total farm budget"
                  className="w-full px-3 py-2 bg-white border border-[#C9C6BC] rounded-xl text-xs font-bold text-[#111111] focus:outline-none focus:border-[#00873A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#111111] mb-1">
                  Avg. Cost / ha ({draft.currencyCode}) *
                </label>
                <input
                  type="number"
                  min={1}
                  step={10}
                  required={draft.enabled}
                  value={draft.operatingCostPerHa}
                  onChange={(e) =>
                    onChange({ ...draft, operatingCostPerHa: e.target.value })
                  }
                  placeholder="Seeds, labor, harvest"
                  className="w-full px-3 py-2 bg-white border border-[#C9C6BC] rounded-xl text-xs font-bold text-[#111111] focus:outline-none focus:border-[#00873A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#111111] mb-1">
                  Fertilizer / ha ({draft.currencyCode}) *
                </label>
                <input
                  type="number"
                  min={0}
                  step={10}
                  required={draft.enabled}
                  value={draft.fertilizerCostPerHa}
                  onChange={(e) =>
                    onChange({ ...draft, fertilizerCostPerHa: e.target.value })
                  }
                  placeholder="Urea / DAP / season"
                  className="w-full px-3 py-2 bg-white border border-[#C9C6BC] rounded-xl text-xs font-bold text-[#111111] focus:outline-none focus:border-[#00873A]"
                />
              </div>
            </div>
          </div>

          {/* OPTIONAL PROFIT HISTORY & GOAL TRACKING */}
          <div className="space-y-2.5 pt-2 border-t border-[#E6E3DA]">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#EFECE4] text-[#4A4A4A] text-[10px] font-extrabold uppercase tracking-wide">
                Optional
              </span>
              <span className="text-[11px] text-[#555555]">
                Helps compare predicted profit against your history &amp; target goal
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#3A3A3A] mb-1">
                  Last Season Net Profit ({draft.currencyCode})
                </label>
                <input
                  type="number"
                  step={50}
                  value={draft.lastSeasonNetProfit}
                  onChange={(e) =>
                    onChange({ ...draft, lastSeasonNetProfit: e.target.value })
                  }
                  placeholder="Whole farm (optional)"
                  className="w-full px-3 py-2 bg-white border border-[#D6D3C9] rounded-xl text-xs font-bold text-[#111111] focus:outline-none focus:border-[#00873A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#3A3A3A] mb-1">
                  Target Annual Profit ({draft.currencyCode})
                </label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={draft.targetAnnualProfit}
                  onChange={(e) =>
                    onChange({ ...draft, targetAnnualProfit: e.target.value })
                  }
                  placeholder="Profit goal (optional)"
                  className="w-full px-3 py-2 bg-white border border-[#D6D3C9] rounded-xl text-xs font-bold text-[#111111] focus:outline-none focus:border-[#00873A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#3A3A3A] mb-1">
                  Water &amp; Fuel / ha ({draft.currencyCode})
                </label>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={draft.irrigationEnergyCostPerHa}
                  onChange={(e) =>
                    onChange({ ...draft, irrigationEnergyCostPerHa: e.target.value })
                  }
                  placeholder="Pumping / diesel"
                  className="w-full px-3 py-2 bg-white border border-[#D6D3C9] rounded-xl text-xs font-bold text-[#111111] focus:outline-none focus:border-[#00873A]"
                />
              </div>
            </div>
          </div>

          {validationError && (
            <div className="p-2.5 rounded-xl bg-[#FDE8E2] border border-[#F5B7A6] text-xs font-bold text-[#9A2D11]">
              {validationError}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
