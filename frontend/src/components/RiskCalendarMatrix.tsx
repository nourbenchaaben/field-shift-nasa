import React, { useState } from 'react';
import { NasaPowerDataset, RiskLevel } from '../types/farm';
import { useFarmLocalDate } from '../utils/farmLocalClock';
import {
  AlertTriangle,
  Calendar,
  CloudRain,
  Droplets,
  Info,
  Snowflake,
  Sprout,
} from 'lucide-react';

type RiskMonthRow = NasaPowerDataset['riskCalendarMonthly'][number];

interface RiskCalendarMatrixProps {
  nasa: NasaPowerDataset;
  countryName: string;
  countryCode?: string;
  lng?: number;
  onOpenDataSources?: () => void;
}

type RiskMetricKey = 'frost' | 'heavyRain' | 'drySoil' | 'bareField';

function cellClasses(level: RiskLevel, selected: boolean, isCurrentMonth: boolean): string {
  const ring = selected
    ? 'ring-2 ring-[#111111] ring-offset-1 scale-[1.04]'
    : isCurrentMonth
      ? 'risk-current-pulse'
      : 'hover:opacity-90';
  if (level === 'red') {
    return `bg-[#D93829] text-white border-[#A82418] ${ring}`;
  }
  if (level === 'yellow') {
    return `bg-[#EBB40E] text-[#111111] border-[#C49200] ${ring}`;
  }
  return `bg-[#E3F5EB] text-[#005222] border-[#A8DEC0] ${ring}`;
}

function levelLabel(level: RiskLevel): string {
  if (level === 'red') return 'High Risk';
  if (level === 'yellow') return 'Watch';
  return 'Low Risk';
}

function buildCellDetail(row: RiskMonthRow, metric: RiskMetricKey): {
  title: string;
  level: RiskLevel;
  summary: string;
  advice: string;
} {
  switch (metric) {
    case 'frost':
      return {
        title: `${row.month} · Frost Risk (${row.frostDaysPerYr.toFixed(1)} days/yr below 0°C)`,
        level: row.frostLevel,
        summary:
          row.frostLevel === 'red'
            ? 'Frequent freezing nights can damage tender seedlings.'
            : row.frostLevel === 'yellow'
              ? 'Occasional freezing nights occur in some years.'
              : 'Freezing temperatures are rare or absent in this month.',
        advice:
          row.frostLevel === 'green'
            ? 'Safe window for frost-sensitive crops.'
            : 'Choose hardy winter varieties or delay sensitive sowing until frost clears.',
      };
    case 'heavyRain':
      return {
        title: `${row.month} · Heavy Rain (${row.heavyRainDaysPerYr.toFixed(1)} days/yr ≥ 20 mm)`,
        level: row.heavyRainLevel,
        summary:
          row.heavyRainLevel === 'red'
            ? 'Intense storms can wash away exposed topsoil and nutrients.'
            : row.heavyRainLevel === 'yellow'
              ? 'Occasional heavy downpours can trigger surface runoff.'
              : 'Rainfall events are normally gentle and manageable.',
        advice:
          row.heavyRainLevel === 'green'
            ? 'Low washout pressure for fieldwork and seeding.'
            : 'Keep living roots or crop residue on the field to prevent erosion.',
      };
    case 'drySoil':
      return {
        title: `${row.month} · Root-Zone Soil Wetness (${Math.round(row.soilWetness * 100)}%)`,
        level: row.drySoilLevel,
        summary:
          row.drySoilLevel === 'red'
            ? 'Soil moisture is very low across the root zone.'
            : row.drySoilLevel === 'yellow'
              ? 'Soil begins drying down and crops face moderate water stress.'
              : 'Soil holds reliable moisture for healthy root growth.',
        advice:
          row.drySoilLevel === 'green'
            ? 'Good moisture window for planting and active growth.'
            : 'Use mulch, drought-tolerant crops, or targeted drip watering.',
      };
    case 'bareField':
      return {
        title: row.ndvi === null
          ? `${row.month} · Field Vegetation Cover (MODIS NDVI unavailable)`
          : `${row.month} · Field Vegetation Cover (NDVI ${row.ndvi.toFixed(2)})`,
        level: row.bareFieldLevel,
        summary: row.ndvi === null
          ? 'MODIS NDVI observations are unavailable for this farm.'
          : row.bareFieldLevel === 'red'
            ? 'Land typically sits bare, exposing soil to sun, wind, and crusting.'
            : row.bareFieldLevel === 'yellow'
              ? 'Partial vegetation cover leaves patches of soil exposed.'
              : 'Healthy green canopy keeps the soil shaded and protected.',
        advice: row.ndvi === null
          ? 'Connect an authenticated MODIS source to assess vegetation cover.'
          : row.bareFieldLevel === 'green'
            ? 'Keep the field covered with residue or a suitable cover crop.'
            : 'Use cover crops and residue to protect exposed soil.',
      };
  }
}

export const RiskCalendarMatrix: React.FC<RiskCalendarMatrixProps> = ({
  nasa,
  countryName,
  countryCode = 'TN',
  lng = 10,
  onOpenDataSources,
}) => {
  const rows = nasa.riskCalendarMonthly;
  const farmClock = useFarmLocalDate(countryCode, lng);
  const currentMonthIdx = farmClock.monthIndex;
  const todayLabel = farmClock.shortDate;
  const [selectedCell, setSelectedCell] = useState<{
    monthIdx: number;
    metric: RiskMetricKey;
  } | null>(null);

  const selectedDetail =
    selectedCell && rows[selectedCell.monthIdx]
      ? buildCellDetail(rows[selectedCell.monthIdx], selectedCell.metric)
      : null;

  return (
    <div className="surface-card p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#007432]">
            <Calendar className="w-3.5 h-3.5" />
            NASA Weather &amp; Soil Risk Calendar ({nasa.yearsAnalyzed})
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-[#111111]">
            12-Month Field Risk Matrix: {countryName}
          </h3>
          <p className="text-xs sm:text-sm text-[#3A3A3A] max-w-2xl">
            Click any month box below to see what the weather and soil signals mean for your field.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111111] text-[#EBB40E] border border-[#111111]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EBB40E] opacity-80" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#EBB40E]" />
            </span>
            Today: {todayLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E3F5EB] text-[#005222] border border-[#B8E5CC]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00873A]" />
            Low Risk
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF6DC] text-[#6E5100] border border-[#EBD58B]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EBB40E]" />
            Watch
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCEBE6] text-[#8C2B11] border border-[#E7A18E]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D93829]" />
            High Risk
          </span>
        </div>
      </div>

      {/* Climate Indicators Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-[#DFDDD6]">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#3A3A3A]">
            Annual Rainfall
          </div>
          <div className="text-lg font-extrabold text-[#111111] mt-1">
            {nasa.annualRainMm} mm/yr
          </div>
          <div className="text-xs text-[#3A3A3A] mt-0.5">5-year average</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-[#DFDDD6]">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#3A3A3A]">
            Driest Year
          </div>
          <div className="text-lg font-extrabold text-[#B83B1A] mt-1">{nasa.driestYearMm} mm</div>
          <div className="text-xs text-[#3A3A3A] mt-0.5">Year: {nasa.driestYear}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-[#DFDDD6]">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#3A3A3A]">
            Autumn Rain Onset
          </div>
          <div className="text-lg font-extrabold text-[#007432] mt-1">{nasa.autumnRainOnset}</div>
          <div className="text-xs text-[#3A3A3A] mt-0.5">First ≥ 20 mm / 3 days</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-[#DFDDD6]">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#3A3A3A]">
            Heavy-Rain Days
          </div>
          <div className="text-lg font-extrabold text-[#0F7B8A] mt-1">
            {nasa.heavyRainDaysPerYear} d/yr
          </div>
          <div className="text-xs text-[#3A3A3A] mt-0.5">Days ≥ 20 mm rain</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-[#DFDDD6] col-span-2 sm:col-span-1">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#3A3A3A]">
            Frost Days
          </div>
          <div className="text-lg font-extrabold text-[#111111] mt-1">
            {nasa.frostDaysPerYear} d/yr
          </div>
          <div className="text-xs text-[#3A3A3A] mt-0.5">Nights below 0°C</div>
        </div>
      </div>

      {/* 4-Row × 12-Month Matrix */}
      <div className="overflow-x-auto pb-1">
        <table className="w-full min-w-[740px] border-separate border-spacing-1.5 text-center">
          <thead>
            <tr>
              <th className="text-left text-xs font-extrabold uppercase tracking-wider text-[#2E2E2E] px-2.5 py-2 w-[200px]">
                Risk Indicator
              </th>
              {rows.map((r, idx) => {
                const isCurrent = idx === currentMonthIdx;
                return (
                  <th
                    key={r.month}
                    className={`text-xs font-extrabold py-2 ${
                      isCurrent ? 'text-[#111111]' : 'text-[#2E2E2E]'
                    }`}
                  >
                    {isCurrent ? (
                      <div className="inline-flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl bg-[#111111] text-[#EBB40E] shadow-xs">
                        <span className="inline-flex items-center gap-1 leading-none">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EBB40E] opacity-85" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EBB40E]" />
                          </span>
                          {r.month}
                        </span>
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-white leading-none">
                          Now
                        </span>
                      </div>
                    ) : (
                      r.month
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="text-xs font-bold">
            {/* Row 1: Frost */}
            <tr>
              <td className="text-left px-3 py-2 bg-[#F5F4F0] rounded-xl border border-[#E5E3DB]">
                <div className="flex items-center gap-1.5 text-[#111111] font-extrabold">
                  <Snowflake className="w-4 h-4 text-[#0F7B8A] shrink-0" />
                  <span>Frost Risk</span>
                </div>
                <div className="text-[11px] text-[#3A3A3A] font-medium mt-0.5">
                  Watch ≥0.2 · High ≥1.0 d/yr
                </div>
              </td>
              {rows.map((r, idx) => {
                const isSelected =
                  selectedCell?.monthIdx === idx && selectedCell?.metric === 'frost';
                const isCurrent = idx === currentMonthIdx;
                return (
                  <td key={`frost-${r.month}`} className="p-0">
                    <button
                      type="button"
                      onClick={() => setSelectedCell({ monthIdx: idx, metric: 'frost' })}
                      title={`${r.month}${isCurrent ? ' (Current Month)' : ''} Frost: ${r.frostDaysPerYr} days/yr below 0°C (${levelLabel(r.frostLevel)})`}
                      className={`w-full rounded-xl border py-2.5 px-1 font-mono-tech font-bold transition cursor-pointer ${cellClasses(r.frostLevel, isSelected, isCurrent)}`}
                    >
                      {r.frostDaysPerYr.toFixed(1)}
                    </button>
                  </td>
                );
              })}
            </tr>

            {/* Row 2: Heavy Rain */}
            <tr>
              <td className="text-left px-3 py-2 bg-[#F5F4F0] rounded-xl border border-[#E5E3DB]">
                <div className="flex items-center gap-1.5 text-[#111111] font-extrabold">
                  <CloudRain className="w-4 h-4 text-[#007432] shrink-0" />
                  <span>Heavy Rain (≥20mm)</span>
                </div>
                <div className="text-[11px] text-[#3A3A3A] font-medium mt-0.5">
                  Watch ≥0.3 · High ≥1.0 d/yr
                </div>
              </td>
              {rows.map((r, idx) => {
                const isSelected =
                  selectedCell?.monthIdx === idx && selectedCell?.metric === 'heavyRain';
                const isCurrent = idx === currentMonthIdx;
                return (
                  <td key={`heavy-${r.month}`} className="p-0">
                    <button
                      type="button"
                      onClick={() => setSelectedCell({ monthIdx: idx, metric: 'heavyRain' })}
                      title={`${r.month}${isCurrent ? ' (Current Month)' : ''} Heavy Rain: ${r.heavyRainDaysPerYr} days/yr ≥20mm (${levelLabel(r.heavyRainLevel)})`}
                      className={`w-full rounded-xl border py-2.5 px-1 font-mono-tech font-bold transition cursor-pointer ${cellClasses(r.heavyRainLevel, isSelected, isCurrent)}`}
                    >
                      {r.heavyRainDaysPerYr.toFixed(1)}
                    </button>
                  </td>
                );
              })}
            </tr>

            {/* Row 3: Dry Soil */}
            <tr>
              <td className="text-left px-3 py-2 bg-[#F5F4F0] rounded-xl border border-[#E5E3DB]">
                <div className="flex items-center gap-1.5 text-[#111111] font-extrabold">
                  <Droplets className="w-4 h-4 text-[#946D00] shrink-0" />
                  <span>Dry Soil (Wetness)</span>
                </div>
                <div className="text-[11px] text-[#3A3A3A] font-medium mt-0.5">
                  Watch ≤0.45 · High ≤0.30
                </div>
              </td>
              {rows.map((r, idx) => {
                const isSelected =
                  selectedCell?.monthIdx === idx && selectedCell?.metric === 'drySoil';
                const isCurrent = idx === currentMonthIdx;
                return (
                  <td key={`dry-${r.month}`} className="p-0">
                    <button
                      type="button"
                      onClick={() => setSelectedCell({ monthIdx: idx, metric: 'drySoil' })}
                      title={`${r.month}${isCurrent ? ' (Current Month)' : ''} Root Soil Wetness: ${r.soilWetness.toFixed(2)} (${levelLabel(r.drySoilLevel)})`}
                      className={`w-full rounded-xl border py-2.5 px-1 font-mono-tech font-bold transition cursor-pointer ${cellClasses(r.drySoilLevel, isSelected, isCurrent)}`}
                    >
                      {r.soilWetness.toFixed(2)}
                    </button>
                  </td>
                );
              })}
            </tr>

            {/* Row 4: Bare Field (NDVI) */}
            <tr>
              <td className="text-left px-3 py-2 bg-[#F5F4F0] rounded-xl border border-[#E5E3DB]">
                <div className="flex items-center gap-1.5 text-[#111111] font-extrabold">
                  <Sprout className="w-4 h-4 text-[#4E7A00] shrink-0" />
                  <span>Bare Field (Cover)</span>
                </div>
                <div className="text-[11px] text-[#3A3A3A] font-medium mt-0.5">
                  Watch ≤0.35 · High ≤0.25
                </div>
              </td>
              {rows.map((r, idx) => {
                const isSelected =
                  selectedCell?.monthIdx === idx && selectedCell?.metric === 'bareField';
                const isCurrent = idx === currentMonthIdx;
                return (
                  <td key={`ndvi-${r.month}`} className="p-0">
                    <button
                      type="button"
                      onClick={() => setSelectedCell({ monthIdx: idx, metric: 'bareField' })}
                      title={`${r.month}${isCurrent ? ' (Current Month)' : ''} MODIS NDVI: ${r.ndvi === null ? 'unavailable' : `${r.ndvi.toFixed(2)} (${levelLabel(r.bareFieldLevel)})`}`}
                      className={`w-full rounded-xl border py-2.5 px-1 font-mono-tech font-bold transition cursor-pointer ${cellClasses(r.bareFieldLevel, isSelected, isCurrent)}`}
                    >
                      {r.ndvi === null ? '—' : r.ndvi.toFixed(2)}
                    </button>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Interactive Selected Cell Plain-Language Callout */}
      {selectedDetail && (
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in ${
            selectedDetail.level === 'red'
              ? 'bg-[#FCEBE6] border-[#E7A18E] text-[#111111]'
              : selectedDetail.level === 'yellow'
                ? 'bg-[#FDF6DC] border-[#EBD58B] text-[#111111]'
                : 'bg-[#E3F5EB] border-[#B8E5CC] text-[#111111]'
          }`}
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-[#111111]">
                {selectedDetail.title}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                  selectedDetail.level === 'red'
                    ? 'bg-[#D93829] text-white'
                    : selectedDetail.level === 'yellow'
                      ? 'bg-[#EBB40E] text-[#111111]'
                      : 'bg-[#00873A] text-white'
                }`}
              >
                {levelLabel(selectedDetail.level)}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#2E2E2E]">
              {selectedDetail.summary} <strong className="text-[#111111]">{selectedDetail.advice}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedCell(null)}
            className="text-xs font-bold text-[#2E2E2E] hover:text-[#111111] underline self-start sm:self-center shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Honest Data Limitation Note */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E8E5DC] text-xs text-[#3A3A3A]">
        <div className="flex items-start sm:items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#946D00] shrink-0 mt-0.5 sm:mt-0" />
          <span>
            Note: NASA POWER (~50 km reanalysis) &amp; SMAP L4 (~9–11 km) are modelled regional
            datasets, not in-field sensors; MODIS NDVI (250 m) shows greenness, not crop type.
          </span>
        </div>
        {onOpenDataSources && (
          <button
            type="button"
            onClick={onOpenDataSources}
            className="inline-flex items-center gap-1 font-bold text-[#007432] hover:underline cursor-pointer shrink-0"
          >
            <Info className="w-3.5 h-3.5" />
            Full Data Spec &amp; Limitations →
          </button>
        )}
      </div>
    </div>
  );
};
