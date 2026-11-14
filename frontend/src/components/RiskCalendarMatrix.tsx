import React from 'react';
import { NasaPowerDataset, RiskLevel } from '../types/farm';
import { AlertTriangle, Calendar, CloudRain, Droplets, Info, Snowflake, Sprout } from 'lucide-react';

interface RiskCalendarMatrixProps {
  nasa: NasaPowerDataset;
  countryName: string;
  onOpenDataSources?: () => void;
}

function cellClasses(level: RiskLevel): string {
  if (level === 'red') {
    return 'bg-[#D93829] text-white border-[#B3281B]';
  }
  if (level === 'yellow') {
    return 'bg-[#EBB40E] text-[#111111] border-[#C99600]';
  }
  return 'bg-[#E3F5EB] text-[#005A26] border-[#B8E5CC]';
}

function levelLabel(level: RiskLevel): string {
  if (level === 'red') return 'High Risk';
  if (level === 'yellow') return 'Watch';
  return 'Low Risk';
}

export const RiskCalendarMatrix: React.FC<RiskCalendarMatrixProps> = ({
  nasa,
  countryName,
  onOpenDataSources,
}) => {
  const rows = nasa.riskCalendarMonthly;

  return (
    <div className="surface-card p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#00873A]">
            <Calendar className="w-3.5 h-3.5" />
            NASA POWER + Earth Engine Risk Calendar ({nasa.yearsAnalyzed})
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#111111]">
            12-Month Field Risk Matrix — {countryName}
          </h3>
          <p className="text-xs text-[#6F6F6F]">
            Calculated directly from daily NASA POWER rainfall (<code>PRECTOTCORR</code>), minimum
            temperature (<code>T2M_MIN</code>), root-zone wetness (<code>GWETROOT</code> / SMAP
            L4), and MODIS NDVI greenness.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E3F5EB] text-[#005A26]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00873A]" />
            Low Risk
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FDF6DC] text-[#7A5B00]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EBB40E]" />
            Watch (Yellow)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FCEBE6] text-[#8C2B11]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D93829]" />
            High Risk (Red)
          </span>
        </div>
      </div>

      {/* Exact Backend Calculated Climate Indicators Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="p-3 rounded-xl bg-[#F5F4F0] border border-[#E5E3DB]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F6F6F]">
            Annual Rainfall
          </div>
          <div className="text-base font-extrabold text-[#111111] mt-0.5">
            {nasa.annualRainMm} mm/yr
          </div>
          <div className="text-[10px] text-[#6F6F6F]">POWER mean</div>
        </div>
        <div className="p-3 rounded-xl bg-[#F5F4F0] border border-[#E5E3DB]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F6F6F]">
            Driest Year
          </div>
          <div className="text-base font-extrabold text-[#B83B1A] mt-0.5">
            {nasa.driestYearMm} mm
          </div>
          <div className="text-[10px] text-[#6F6F6F]">Worst year: {nasa.driestYear}</div>
        </div>
        <div className="p-3 rounded-xl bg-[#F5F4F0] border border-[#E5E3DB]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F6F6F]">
            Autumn Rain Onset
          </div>
          <div className="text-base font-extrabold text-[#00873A] mt-0.5">
            {nasa.autumnRainOnset}
          </div>
          <div className="text-[10px] text-[#6F6F6F]">1st ≥20mm / 3-day</div>
        </div>
        <div className="p-3 rounded-xl bg-[#F5F4F0] border border-[#E5E3DB]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F6F6F]">
            Heavy-Rain Days
          </div>
          <div className="text-base font-extrabold text-[#1696A8] mt-0.5">
            {nasa.heavyRainDaysPerYear} d/yr
          </div>
          <div className="text-[10px] text-[#6F6F6F]">Days ≥ 20 mm</div>
        </div>
        <div className="p-3 rounded-xl bg-[#F5F4F0] border border-[#E5E3DB] col-span-2 sm:col-span-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F6F6F]">
            Frost Days
          </div>
          <div className="text-base font-extrabold text-[#111111] mt-0.5">
            {nasa.frostDaysPerYear} d/yr
          </div>
          <div className="text-[10px] text-[#6F6F6F]">T2M_MIN &lt; 0 °C</div>
        </div>
      </div>

      {/* 4-Row × 12-Month Matrix Matching Exact Backend Thresholds */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-separate border-spacing-1 text-center">
          <thead>
            <tr>
              <th className="text-left text-[11px] font-extrabold uppercase tracking-wider text-[#474747] px-2 py-1.5 w-[175px]">
                Risk Indicator
              </th>
              {rows.map((r) => (
                <th
                  key={r.month}
                  className="text-[11px] font-extrabold text-[#474747] py-1.5"
                >
                  {r.month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[11px] font-bold">
            {/* Row 1: Frost */}
            <tr>
              <td className="text-left px-2 py-1.5 bg-[#F5F4F0] rounded-lg">
                <div className="flex items-center gap-1.5 text-[#111111] font-extrabold">
                  <Snowflake className="w-3.5 h-3.5 text-[#1696A8] shrink-0" />
                  <span>Frost Risk</span>
                </div>
                <div className="text-[9px] text-[#6F6F6F] font-medium">
                  Yellow ≥0.2 · Red ≥1.0 d/yr
                </div>
              </td>
              {rows.map((r) => (
                <td
                  key={`frost-${r.month}`}
                  title={`${r.month} Frost: ${r.frostDaysPerYr} days/yr below 0°C (${levelLabel(r.frostLevel)})`}
                  className={`rounded-lg border py-2 px-1 font-mono-tech ${cellClasses(r.frostLevel)}`}
                >
                  {r.frostDaysPerYr.toFixed(1)}
                </td>
              ))}
            </tr>

            {/* Row 2: Heavy Rain */}
            <tr>
              <td className="text-left px-2 py-1.5 bg-[#F5F4F0] rounded-lg">
                <div className="flex items-center gap-1.5 text-[#111111] font-extrabold">
                  <CloudRain className="w-3.5 h-3.5 text-[#00873A] shrink-0" />
                  <span>Heavy Rain (≥20mm)</span>
                </div>
                <div className="text-[9px] text-[#6F6F6F] font-medium">
                  Yellow ≥0.3 · Red ≥1.0 d/yr
                </div>
              </td>
              {rows.map((r) => (
                <td
                  key={`heavy-${r.month}`}
                  title={`${r.month} Heavy Rain: ${r.heavyRainDaysPerYr} days/yr ≥20mm (${levelLabel(r.heavyRainLevel)})`}
                  className={`rounded-lg border py-2 px-1 font-mono-tech ${cellClasses(r.heavyRainLevel)}`}
                >
                  {r.heavyRainDaysPerYr.toFixed(1)}
                </td>
              ))}
            </tr>

            {/* Row 3: Dry Soil */}
            <tr>
              <td className="text-left px-2 py-1.5 bg-[#F5F4F0] rounded-lg">
                <div className="flex items-center gap-1.5 text-[#111111] font-extrabold">
                  <Droplets className="w-3.5 h-3.5 text-[#A17800] shrink-0" />
                  <span>Dry Soil (Wetness)</span>
                </div>
                <div className="text-[9px] text-[#6F6F6F] font-medium">
                  Yellow ≤0.45 · Red ≤0.30
                </div>
              </td>
              {rows.map((r) => (
                <td
                  key={`dry-${r.month}`}
                  title={`${r.month} Root Soil Wetness: ${r.soilWetness.toFixed(2)} (${levelLabel(r.drySoilLevel)})`}
                  className={`rounded-lg border py-2 px-1 font-mono-tech ${cellClasses(r.drySoilLevel)}`}
                >
                  {r.soilWetness.toFixed(2)}
                </td>
              ))}
            </tr>

            {/* Row 4: Bare Field (NDVI) */}
            <tr>
              <td className="text-left px-2 py-1.5 bg-[#F5F4F0] rounded-lg">
                <div className="flex items-center gap-1.5 text-[#111111] font-extrabold">
                  <Sprout className="w-3.5 h-3.5 text-[#4E7A00] shrink-0" />
                  <span>Bare Field (NDVI)</span>
                </div>
                <div className="text-[9px] text-[#6F6F6F] font-medium">
                  Yellow ≤0.35 · Red ≤0.25
                </div>
              </td>
              {rows.map((r) => (
                <td
                  key={`ndvi-${r.month}`}
                  title={`${r.month} MODIS NDVI Greenness: ${r.ndvi.toFixed(2)} (${levelLabel(r.bareFieldLevel)})`}
                  className={`rounded-lg border py-2 px-1 font-mono-tech ${cellClasses(r.bareFieldLevel)}`}
                >
                  {r.ndvi.toFixed(2)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Honest Data Limitation Note + Data Spec Link */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EFECE6] text-[11px] text-[#6F6F6F]">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-[#A17800] shrink-0" />
          <span>
            Note: NASA POWER (~50 km reanalysis) &amp; SMAP L4 (~9–11 km) are modelled regional
            datasets, not in-field sensors; MODIS NDVI (250 m) shows greenness, not crop type.
          </span>
        </div>
        {onOpenDataSources && (
          <button
            type="button"
            onClick={onOpenDataSources}
            className="inline-flex items-center gap-1 font-bold text-[#00873A] hover:underline cursor-pointer shrink-0"
          >
            <Info className="w-3.5 h-3.5" />
            Full Data Spec &amp; Limitations →
          </button>
        )}
      </div>
    </div>
  );
};
