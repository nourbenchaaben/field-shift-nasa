import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  GitBranch,
  Plus,
  X,
} from 'lucide-react';
import {
  CalendarEvent,
  FarmerProfile,
  PlanCustomization,
  ScoredRotationStrategy,
  StrategyChangeRecord,
} from '../types/farm';
import { FarmLocalClock } from '../utils/farmLocalClock';

interface YearOverviewCalendarProps {
  profile: FarmerProfile;
  activeStrategy: ScoredRotationStrategy;
  selectedStrategyId: string | null;
  planCustomization?: PlanCustomization;
  calendarEvents: CalendarEvent[];
  strategyHistory: StrategyChangeRecord[];
  farmDate: FarmLocalClock;
  onToggleComplete: (eventId: string) => void;
  onAddEvent: (ev: Omit<CalendarEvent, 'id' | 'isCustom'>) => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type SpanKind =
  | 'planting'
  | 'growth'
  | 'harvest'
  | 'rotation'
  | 'water'
  | 'soil'
  | 'alert'
  | 'strategy'
  | 'past';

interface DaySpanSegment {
  id: string;
  kind: SpanKind;
  label: string;
  startDay: number;
  endDay: number;
  priority: number;
}

interface DayEntryItem {
  id: string;
  kind: Exclude<SpanKind, 'growth' | 'past'>;
  title: string;
  description: string;
  dateStr: string;
  cropName?: string;
  completed?: boolean;
  isStrategyChange?: boolean;
  sourceEventId?: string;
}

const SPAN_STYLES: Record<
  SpanKind,
  {
    label: string;
    fillRgba: string;
    edgeBg: string;
    lineColor: string;
    textClass: string;
    dotColor: string;
    pillBg: string;
    pillText: string;
  }
> = {
  planting: {
    label: 'Planting Window',
    fillRgba: 'rgba(0, 135, 58, 0.24)',
    edgeBg: 'bg-[#00873A] text-white',
    lineColor: '#00873A',
    textClass: 'text-[#004A20]',
    dotColor: '#00873A',
    pillBg: 'bg-[#E3F5EB] border-[#A9DEC0]',
    pillText: 'text-[#005222]',
  },
  growth: {
    label: 'Active Crop Growth',
    fillRgba: 'rgba(68, 190, 126, 0.20)',
    edgeBg: 'bg-[#1D7A49] text-white',
    lineColor: '#2EA365',
    textClass: 'text-[#14532D]',
    dotColor: '#2EA365',
    pillBg: 'bg-[#ECFDF5] border-[#A7F3D0]',
    pillText: 'text-[#065F46]',
  },
  harvest: {
    label: 'Harvest Window',
    fillRgba: 'rgba(235, 180, 14, 0.30)',
    edgeBg: 'bg-[#D99B00] text-[#111111]',
    lineColor: '#D99B00',
    textClass: 'text-[#614300]',
    dotColor: '#EBB40E',
    pillBg: 'bg-[#FDF6DC] border-[#EBD58B]',
    pillText: 'text-[#6E5100]',
  },
  rotation: {
    label: 'Rotation Transition',
    fillRgba: 'rgba(15, 123, 138, 0.22)',
    edgeBg: 'bg-[#0F7B8A] text-white',
    lineColor: '#0F7B8A',
    textClass: 'text-[#084C56]',
    dotColor: '#0F7B8A',
    pillBg: 'bg-[#E4F5F8] border-[#A8DAE3]',
    pillText: 'text-[#095560]',
  },
  water: {
    label: 'Irrigation / Moisture',
    fillRgba: 'rgba(2, 132, 199, 0.22)',
    edgeBg: 'bg-[#0284C7] text-white',
    lineColor: '#0284C7',
    textClass: 'text-[#075985]',
    dotColor: '#0284C7',
    pillBg: 'bg-[#E0F2FE] border-[#7DD3FC]',
    pillText: 'text-[#075985]',
  },
  soil: {
    label: 'Soil Care & Nutrition',
    fillRgba: 'rgba(101, 163, 13, 0.22)',
    edgeBg: 'bg-[#4E7A00] text-white',
    lineColor: '#4E7A00',
    textClass: 'text-[#2F4D00]',
    dotColor: '#4E7A00',
    pillBg: 'bg-[#ECF7DC] border-[#C5E49A]',
    pillText: 'text-[#2F4D00]',
  },
  alert: {
    label: 'Weather / Risk Window',
    fillRgba: 'rgba(220, 38, 38, 0.20)',
    edgeBg: 'bg-[#DC2626] text-white',
    lineColor: '#DC2626',
    textClass: 'text-[#881313]',
    dotColor: '#DC2626',
    pillBg: 'bg-[#FEE2E2] border-[#FCA5A5]',
    pillText: 'text-[#991B1B]',
  },
  strategy: {
    label: 'Strategy Change',
    fillRgba: 'rgba(109, 40, 217, 0.24)',
    edgeBg: 'bg-[#6D28D9] text-white',
    lineColor: '#6D28D9',
    textClass: 'text-[#4C1D95]',
    dotColor: '#6D28D9',
    pillBg: 'bg-[#F3E8FF] border-[#D8B4FE]',
    pillText: 'text-[#581C87]',
  },
  past: {
    label: 'Past Season Growth',
    fillRgba: 'rgba(68, 138, 98, 0.16)',
    edgeBg: 'bg-[#3F6A52] text-white',
    lineColor: '#5B8C70',
    textClass: 'text-[#1F4230]',
    dotColor: '#5B8C70',
    pillBg: 'bg-[#EDF5F0] border-[#C4DDD0]',
    pillText: 'text-[#1F4230]',
  },
};

function getFamilyHeaderBg(family: string, isPastBaseline?: boolean): string {
  if (isPastBaseline) return 'bg-[#3F4A44]';
  if (family === 'Legume') return 'bg-[#007432]';
  if (family === 'Cover Crop') return 'bg-[#3F6300]';
  if (family === 'Vegetable') return 'bg-[#9F1239]';
  if (family === 'Oilseed') return 'bg-[#946D00]';
  return 'bg-[#1D5B3A]';
}

function getDefaultStageMonths(cropFamily: string, cropName: string): number {
  const n = cropName.toLowerCase();
  if (cropFamily === 'Cover Crop') return n.includes('vetch') || n.includes('rye') ? 4 : 3;
  if (cropFamily === 'Legume') return n.includes('alfalfa') ? 6 : 5;
  if (cropFamily === 'Oilseed') return 5;
  if (cropFamily === 'Vegetable') return 4;
  return n.includes('sorghum') || n.includes('millet') ? 4 : 6;
}

function toIsoDate(year: number, month0: number, day: number): string {
  return `${year}-${String(month0 + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

interface MonthPhaseInfo {
  label: string;
  family: string;
  stageBadge: string;
  isPastBaseline?: boolean;
  monthInStage: number; // 0-based index within stage
  totalStageMonths: number;
}

export const YearOverviewCalendar: React.FC<YearOverviewCalendarProps> = ({
  profile,
  activeStrategy,
  selectedStrategyId,
  planCustomization,
  calendarEvents,
  strategyHistory,
  farmDate,
  onToggleComplete,
  onAddEvent,
}) => {
  const todayYear = farmDate.year;
  const todayMonth0 = farmDate.monthIndex;
  const todayDay = farmDate.dayOfMonth;
  const todayIso = toIsoDate(todayYear, todayMonth0, todayDay);

  // Full span of past + current + future years
  const yearOptions = useMemo(() => {
    const baseYears = new Set<number>([
      todayYear - 2,
      todayYear - 1,
      todayYear,
      todayYear + 1,
      todayYear + 2,
      todayYear + 3,
    ]);
    for (const ev of calendarEvents) {
      if (ev.year >= todayYear - 4 && ev.year <= todayYear + 5) baseYears.add(ev.year);
    }
    return Array.from(baseYears).sort((a, b) => a - b);
  }, [todayYear, calendarEvents]);

  const [selectedYear, setSelectedYear] = useState<number>(todayYear);
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(todayIso);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(todayMonth0);
  const [showAddForm, setShowAddForm] = useState(false);

  // Inline Add Task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(todayIso);
  const [newCategory, setNewCategory] = useState<CalendarEvent['category']>('planting');
  const [newDesc, setNewDesc] = useState('');

  // Map every YYYY-MM-DD date to all events + strategy changes on that date
  const entriesByDate = useMemo(() => {
    const map = new Map<string, DayEntryItem[]>();

    const push = (dateStr: string, item: DayEntryItem) => {
      const list = map.get(dateStr) ?? [];
      list.push(item);
      map.set(dateStr, list);
    };

    for (const ev of calendarEvents) {
      const d = ev.date.slice(0, 10);
      push(d, {
        id: ev.id,
        kind: ev.category,
        title: ev.title,
        description: ev.description,
        dateStr: d,
        cropName: ev.cropName,
        completed: ev.completed,
        sourceEventId: ev.id,
      });
    }

    for (const sh of strategyHistory) {
      const parsed = new Date(sh.recordedAt);
      if (Number.isNaN(parsed.getTime())) continue;
      const d = toIsoDate(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
      push(d, {
        id: sh.id,
        kind: 'strategy',
        title: `Strategy Update: ${sh.strategyTitle}`,
        description: `${sh.summary} (${sh.stages.map((s) => s.cropName).join(' -> ')})`,
        dateStr: d,
        isStrategyChange: true,
      });
    }

    return map;
  }, [calendarEvents, strategyHistory]);

  // Compute which crop phase occupies each (year, month0) across past, present & future
  const monthPhaseMap = useMemo(() => {
    const map = new Map<string, MonthPhaseInfo>();

    // Past baseline crops (before current active cycle start, including any positive monthShift bridge)
    const pastCrop = profile.previousCrops[0] || 'Wheat';
    const shift = planCustomization?.monthShift ?? 0;
    const activeStartAbs = todayYear * 12 + todayMonth0 + shift;
    const minAbs = (todayYear - 4) * 12;
    for (let abs = minAbs; abs < activeStartAbs; abs += 1) {
      const y = Math.floor(abs / 12);
      const m = ((abs % 12) + 12) % 12;
      const mInCycle = m >= 9 ? m - 9 : m + 3; // Autumn-to-Summer seasonal cadence
      map.set(`${y}-${m}`, {
        label: pastCrop,
        family: 'Cereal',
        stageBadge: abs >= todayYear * 12 + todayMonth0 ? 'Pre-Sowing Prep' : 'Past Season',
        isPastBaseline: true,
        monthInStage: mInCycle,
        totalStageMonths: 9,
      });
    }

    // Current & Future rotation cycle rolling forward from farmDate + monthShift
    const steps = activeStrategy.steps;
    if (steps.length > 0) {
      const startAbs = activeStartAbs;
      const endAbs = (todayYear + 5) * 12 + 11;
      let cursor = startAbs;
      let cycleIdx = 0;

      while (cursor <= endAbs) {
        const stepIdx = cycleIdx % steps.length;
        const step = steps[stepIdx];
        const ov = planCustomization?.stageOverrides?.[stepIdx];
        const spec = planCustomization?.customStages?.[stepIdx];
        const dur =
          ov?.durationMonths ??
          spec?.durationMonths ??
          getDefaultStageMonths(step.cropFamily, step.cropName);

        for (let k = 0; k < dur && cursor <= endAbs; k += 1) {
          const yr = Math.floor(cursor / 12);
          const mo = ((cursor % 12) + 12) % 12;
          map.set(`${yr}-${mo}`, {
            label: step.cropName,
            family: step.cropFamily,
            stageBadge: selectedStrategyId
              ? `Stage ${step.stepNumber}`
              : `Preview S${step.stepNumber}`,
            monthInStage: k,
            totalStageMonths: dur,
          });
          cursor += 1;
        }
        cycleIdx += 1;
      }
    }

    return map;
  }, [
    profile.previousCrops,
    activeStrategy.steps,
    planCustomization,
    selectedStrategyId,
    todayYear,
    todayMonth0,
  ]);

  // Build continuous start-date -> end-date filled spans for any (year, month0)
  const buildMonthSpans = (year: number, month0: number, daysInMonth: number): DaySpanSegment[] => {
    const phase = monthPhaseMap.get(`${year}-${month0}`);
    const spans: DaySpanSegment[] = [];

    // 1) Continuous seasonal crop phase bars filling start -> end dates across ALL 12 months
    if (phase) {
      if (phase.isPastBaseline) {
        // Continuous base field growth fill across every day of the month
        spans.push({
          id: `p-base-${year}-${month0}`,
          kind: 'past',
          label: `Past Field Growth (${phase.label})`,
          startDay: 1,
          endDay: daysInMonth,
          priority: 1,
        });

        if (month0 === 0) {
          spans.push({
            id: `p-jan-${year}`,
            kind: 'water',
            label: `Winter Drainage & Root Moisture (${phase.label})`,
            startDay: 8,
            endDay: 18,
            priority: 2,
          });
        } else if (month0 === 1) {
          spans.push({
            id: `p-feb-${year}`,
            kind: 'soil',
            label: `Late-Winter Root & Weed Check (${phase.label})`,
            startDay: 10,
            endDay: 20,
            priority: 2,
          });
        } else if (month0 === 2 || month0 === 3) {
          spans.push({
            id: `p-spr-${year}-${month0}`,
            kind: month0 === 2 ? 'soil' : 'water',
            label:
              month0 === 2
                ? `Spring Soil Nutrition (${phase.label})`
                : `Spring Moisture Check (${phase.label})`,
            startDay: 10,
            endDay: 19,
            priority: 2,
          });
        } else if (month0 === 5) {
          spans.push({
            id: `p-harv-${year}-${month0}`,
            kind: 'harvest',
            label: `Past Harvest (${phase.label})`,
            startDay: 10,
            endDay: 24,
            priority: 2,
          });
        } else if (month0 === 8) {
          spans.push({
            id: `p-prep-${year}`,
            kind: 'rotation',
            label: `Stubble Mulch & Autumn Bed Prep`,
            startDay: 15,
            endDay: 26,
            priority: 2,
          });
        } else if (month0 === 9 || month0 === 10) {
          spans.push({
            id: `p-sow-${year}-${month0}`,
            kind: 'planting',
            label: `Past Sowing (${phase.label})`,
            startDay: 5,
            endDay: 20,
            priority: 2,
          });
        }
      } else {
        const isFirstMonth = phase.monthInStage === 0;
        const isLastMonth = phase.monthInStage === phase.totalStageMonths - 1;

        if (isFirstMonth) {
          spans.push({
            id: `s-plant-${year}-${month0}`,
            kind: 'planting',
            label: `Planting Window: ${phase.label}`,
            startDay: 1,
            endDay: 14,
            priority: 3,
          });
          spans.push({
            id: `s-grow-${year}-${month0}`,
            kind: 'growth',
            label: `Early Growth: ${phase.label}`,
            startDay: 15,
            endDay: daysInMonth,
            priority: 1,
          });
        } else if (isLastMonth) {
          spans.push({
            id: `s-grow-${year}-${month0}`,
            kind: 'growth',
            label: `Ripening: ${phase.label}`,
            startDay: 1,
            endDay: 10,
            priority: 1,
          });
          spans.push({
            id: `s-harv-${year}-${month0}`,
            kind: 'harvest',
            label: `Harvest Window: ${phase.label}`,
            startDay: 11,
            endDay: 24,
            priority: 3,
          });
          spans.push({
            id: `s-rot-${year}-${month0}`,
            kind: 'rotation',
            label: `Soil Prep & Next Stage Transition`,
            startDay: 25,
            endDay: daysInMonth,
            priority: 2,
          });
        } else {
          spans.push({
            id: `s-grow-${year}-${month0}`,
            kind: 'growth',
            label: `Active Growth: ${phase.label}`,
            startDay: 1,
            endDay: daysInMonth,
            priority: 1,
          });
          // Mid-cycle moisture & soil nutrition care windows
          if (phase.monthInStage === 1) {
            spans.push({
              id: `s-soil-${year}-${month0}`,
              kind: 'soil',
              label: `Soil & Root Health Window (${phase.label})`,
              startDay: 10,
              endDay: 18,
              priority: 2,
            });
          } else if (phase.monthInStage === 2) {
            spans.push({
              id: `s-water-${year}-${month0}`,
              kind: 'water',
              label: `NASA Moisture & Irrigation Window`,
              startDay: 12,
              endDay: 20,
              priority: 2,
            });
          }
        }
      }
    }

    // 2) Overlay explicit Calendar events & Strategy changes as vivid multi-day connected spans
    const monthPrefix = `${year}-${String(month0 + 1).padStart(2, '0')}-`;
    entriesByDate.forEach((items, dateStr) => {
      if (!dateStr.startsWith(monthPrefix)) return;
      const dayNum = Number(dateStr.slice(8, 10));
      if (!Number.isFinite(dayNum)) return;

      for (const item of items) {
        if (item.kind === 'strategy') {
          spans.push({
            id: `ev-${item.id}`,
            kind: 'strategy',
            label: item.title,
            startDay: Math.max(1, dayNum - 1),
            endDay: Math.min(daysInMonth, dayNum + 1),
            priority: 6,
          });
        } else if (item.kind === 'alert') {
          spans.push({
            id: `ev-${item.id}`,
            kind: 'alert',
            label: item.title,
            startDay: Math.max(1, dayNum - 2),
            endDay: Math.min(daysInMonth, dayNum + 2),
            priority: 5,
          });
        } else {
          spans.push({
            id: `ev-${item.id}`,
            kind: item.kind,
            label: item.title,
            startDay: Math.max(1, dayNum - 2),
            endDay: Math.min(daysInMonth, dayNum + 2),
            priority: 4,
          });
        }
      }
    });

    return spans;
  };

  // Count total highlights in selectedYear
  const yearEntries = useMemo(() => {
    const prefix = `${selectedYear}-`;
    const list: DayEntryItem[] = [];
    entriesByDate.forEach((items, key) => {
      if (key.startsWith(prefix)) list.push(...items);
    });
    return list.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [entriesByDate, selectedYear]);

  // Entries shown in the interactive bottom inspector (either selected day or selected month)
  const inspectorEntries = useMemo(() => {
    if (selectedDateIso && selectedDateIso.startsWith(`${selectedYear}-`)) {
      const exact = entriesByDate.get(selectedDateIso) ?? [];
      if (exact.length > 0) return exact;
    }
    const monthPrefix = `${selectedYear}-${String(selectedMonthIdx + 1).padStart(2, '0')}-`;
    const monthly: DayEntryItem[] = [];
    entriesByDate.forEach((items, key) => {
      if (key.startsWith(monthPrefix)) monthly.push(...items);
    });
    return monthly.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [entriesByDate, selectedDateIso, selectedYear, selectedMonthIdx]);

  const inspectedPhase = monthPhaseMap.get(`${selectedYear}-${selectedMonthIdx}`);
  const inspectedMonthSpans = useMemo(() => {
    const dim = new Date(selectedYear, selectedMonthIdx + 1, 0).getDate();
    return buildMonthSpans(selectedYear, selectedMonthIdx, dim).filter(
      (s) => s.priority >= 2 || s.kind === 'growth'
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonthIdx, monthPhaseMap, entriesByDate]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;
    const [yrStr, moStr] = newDate.split('-');
    const yr = Number(yrStr) || selectedYear;
    const mo = Number(moStr) || 1;
    const season: CalendarEvent['season'] =
      mo >= 3 && mo <= 5
        ? 'Spring'
        : mo >= 6 && mo <= 8
          ? 'Summer'
          : mo >= 9 && mo <= 11
            ? 'Autumn'
            : 'Winter';
    const phase: CalendarEvent['phase'] =
      yr < todayYear || (yr === todayYear && mo - 1 < todayMonth0)
        ? 'past'
        : yr === todayYear && mo - 1 === todayMonth0
          ? 'current'
          : 'future';

    onAddEvent({
      date: newDate,
      year: yr,
      month: mo,
      season,
      phase,
      category: newCategory,
      title: newTitle.trim(),
      description: newDesc.trim() || `Custom farm reminder for ${profile.farmName}.`,
      completed: phase === 'past',
    });

    setSelectedYear(yr);
    setSelectedMonthIdx(mo - 1);
    setSelectedDateIso(newDate);
    setNewTitle('');
    setNewDesc('');
    setShowAddForm(false);
  };

  const yearTag =
    selectedYear < todayYear
      ? 'Past Year Archive'
      : selectedYear === todayYear
        ? 'Current Active Year'
        : 'Future Rotation Year';

  return (
    <section
      id="dashboard-calendar"
      className="surface-card p-5 sm:p-6 space-y-5 bg-[#FFFEFB] scroll-mt-6"
    >
      {/* Top Header + Year Switcher (Past + Current + Future) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex flex-col gap-1 pt-1 shrink-0" aria-hidden="true">
            <span className="w-1.5 h-5 rounded-full bg-[#00873A]" />
            <span className="w-1.5 h-5 rounded-full bg-[#EBB40E]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#007432]">
                <CalendarDays className="w-3.5 h-3.5" />
                Full Farm Calendar · Past, Present &amp; Future
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border ${
                  selectedYear < todayYear
                    ? 'bg-[#F3F2EE] text-[#3A3A3A] border-[#CFCBC2]'
                    : selectedYear === todayYear
                      ? 'bg-[#E3F5EB] text-[#005222] border-[#A9DEC0]'
                      : 'bg-[#FDF6DC] text-[#6E5100] border-[#EBD58B]'
                }`}
              >
                {yearTag}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#111111] leading-tight mt-0.5">
              {selectedYear} Annual Crop &amp; Field Calendar
            </h3>
            <p className="text-xs sm:text-sm text-[#3A3A3A] mt-0.5">
              Continuous color-filled date spans connect every planting window, growth phase,
              harvest, irrigation check, and strategy switch across past and future years.
            </p>
          </div>
        </div>

        {/* Year Navigation Pills + Add Task */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex items-center bg-[#F5F4F0] p-1 rounded-full border border-[#CFCBC2]">
            <button
              type="button"
              onClick={() => setSelectedYear((y) => Math.max(todayYear - 3, y - 1))}
              className="w-7 h-7 rounded-full hover:bg-white text-[#111111] flex items-center justify-center transition cursor-pointer"
              aria-label="Previous year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-0.5 px-1 overflow-x-auto">
              {yearOptions.map((yr) => {
                const isSelected = yr === selectedYear;
                const isNowYr = yr === todayYear;
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => {
                      setSelectedYear(yr);
                      setSelectedDateIso(yr === todayYear ? todayIso : null);
                      setSelectedMonthIdx(yr === todayYear ? todayMonth0 : 0);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-extrabold transition cursor-pointer relative ${
                      isSelected
                        ? 'bg-[#111111] text-white shadow-xs'
                        : isNowYr
                          ? 'text-[#007432] hover:bg-white'
                          : 'text-[#3A3A3A] hover:bg-white hover:text-[#111111]'
                    }`}
                  >
                    {yr}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setSelectedYear((y) => Math.min(todayYear + 4, y + 1))}
              className="w-7 h-7 rounded-full hover:bg-white text-[#111111] flex items-center justify-center transition cursor-pointer"
              aria-label="Next year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {selectedYear !== todayYear && (
            <button
              type="button"
              onClick={() => {
                setSelectedYear(todayYear);
                setSelectedMonthIdx(todayMonth0);
                setSelectedDateIso(todayIso);
              }}
              className="px-3 py-2 rounded-full bg-[#E3F5EB] hover:bg-[#00873A] text-[#005222] hover:text-white border border-[#A9DEC0] text-xs font-extrabold transition cursor-pointer"
            >
              Today ({farmDate.shortDate})
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setNewDate(selectedDateIso || toIsoDate(selectedYear, selectedMonthIdx, 15));
              setShowAddForm((prev) => !prev);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#EBB40E] hover:bg-[#111111] text-[#111111] hover:text-white text-xs font-extrabold transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>
        </div>
      </div>

      {/* Inline Add Custom Task Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="rounded-2xl bg-[#F8F7F2] border-2 border-[#EBB40E] p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end animate-fade-in"
        >
          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#2E2E2E]">
              Task / Milestone Title
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., Drip line flush & chickpea seeding"
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#CFCBC2] text-xs sm:text-sm focus:outline-none focus:border-[#00873A]"
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#2E2E2E]">
              Date
            </label>
            <input
              type="date"
              required
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#CFCBC2] text-xs sm:text-sm focus:outline-none focus:border-[#00873A]"
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#2E2E2E]">
              Category
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as CalendarEvent['category'])}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#CFCBC2] text-xs sm:text-sm focus:outline-none focus:border-[#00873A]"
            >
              <option value="planting">Planting</option>
              <option value="harvest">Harvest</option>
              <option value="rotation">Rotation Phase</option>
              <option value="water">Water / Irrigation</option>
              <option value="soil">Soil Care</option>
              <option value="alert">Weather / Risk Alert</option>
            </select>
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#2E2E2E]">
              Note (Optional)
            </label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Field details..."
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#CFCBC2] text-xs sm:text-sm focus:outline-none focus:border-[#00873A]"
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-1.5">
            <button
              type="submit"
              className="flex-1 px-3 py-2 rounded-xl bg-[#00873A] hover:bg-[#111111] text-white text-xs font-extrabold transition cursor-pointer"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="w-9 h-9 rounded-xl bg-white border border-[#CFCBC2] hover:bg-[#F3F2EE] text-[#3A3A3A] flex items-center justify-center transition cursor-pointer shrink-0"
              aria-label="Cancel add task"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Visual Filled-Span Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#F8F7F2] border border-[#E5E2D9] text-[11px] font-bold text-[#2E2E2E]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="inline-flex items-center gap-1.5">
            <span className="relative flex h-3 w-3 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EBB40E] opacity-80" />
              <span className="relative inline-flex w-3 h-3 rounded-full bg-[#111111] ring-2 ring-[#EBB40E]" />
            </span>
            Today (Live)
          </span>
          {(
            [
              'planting',
              'growth',
              'harvest',
              'rotation',
              'water',
              'soil',
              'alert',
              'strategy',
            ] as SpanKind[]
          ).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span
                className="w-5 h-2 rounded-full"
                style={{ backgroundColor: SPAN_STYLES[k].lineColor }}
              />
              {SPAN_STYLES[k].label}
            </span>
          ))}
        </div>
        <span className="text-[11px] font-extrabold text-[#007432]">
          {yearEntries.length} key date{yearEntries.length === 1 ? '' : 's'} in {selectedYear}
        </span>
      </div>

      {/* 12-MONTH YEAR-AT-A-GLANCE GRID WITH CONTINUOUS FILLED DATE-TO-DATE PHASE BARS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MONTH_NAMES.map((monthName, month0) => {
          const daysInMonth = new Date(selectedYear, month0 + 1, 0).getDate();
          const firstWeekday = new Date(selectedYear, month0, 1).getDay();
          const phase = monthPhaseMap.get(`${selectedYear}-${month0}`);
          const isCurrentMonth = selectedYear === todayYear && month0 === todayMonth0;
          const isInspectedMonth = month0 === selectedMonthIdx;

          const monthSpans = buildMonthSpans(selectedYear, month0, daysInMonth);

          // Resolve highest-priority filled span for every day 1..daysInMonth
          const daySpanMap = new Map<number, DaySpanSegment>();
          for (let d = 1; d <= daysInMonth; d += 1) {
            let best: DaySpanSegment | null = null;
            for (const sp of monthSpans) {
              if (d >= sp.startDay && d <= sp.endDay) {
                if (!best || sp.priority > best.priority) best = sp;
              }
            }
            if (best) daySpanMap.set(d, best);
          }

          // Build grid cells (leading blanks + 1..daysInMonth)
          const cells: (number | null)[] = [];
          for (let b = 0; b < firstWeekday; b += 1) cells.push(null);
          for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

          // Compact readable summary of primary ranges in this month
          const keyWindowLabels = monthSpans
            .filter((s) => s.priority >= 2)
            .sort((a, b) => a.startDay - b.startDay)
            .slice(0, 2)
            .map((s) => `${s.startDay}-${s.endDay} ${SPAN_STYLES[s.kind].label.split(' ')[0]}`);

          return (
            <div
              key={`${selectedYear}-${monthName}`}
              onClick={() => setSelectedMonthIdx(month0)}
              className={`rounded-2xl overflow-hidden border bg-white transition-all duration-200 cursor-pointer ${
                isCurrentMonth
                  ? 'border-[#00873A] ring-2 ring-[#EBB40E]/75 shadow-md'
                  : isInspectedMonth
                    ? 'border-[#111111] shadow-sm'
                    : 'border-[#DFDDD6] hover:border-[#00873A]/70'
              }`}
            >
              {/* Month Header Bar */}
              <div
                className={`px-3 py-2 flex items-center justify-between gap-2 text-white ${
                  isCurrentMonth
                    ? 'bg-[#111111]'
                    : getFamilyHeaderBg(phase?.family || 'Cereal', phase?.isPastBaseline)
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs sm:text-[13px] font-extrabold tracking-wide">
                    {monthName}
                  </span>
                  {isCurrentMonth && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EBB40E] text-[#111111] text-[9px] font-extrabold uppercase">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#111111] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#111111]" />
                      </span>
                      Today
                    </span>
                  )}
                </div>
                {phase && (
                  <span
                    className="px-2 py-0.5 rounded-full bg-white/18 text-[10px] font-bold text-white truncate max-w-[122px]"
                    title={`${phase.stageBadge}: ${phase.label} (${phase.family})`}
                  >
                    {phase.label}
                  </span>
                )}
              </div>

              {/* Weekday Headers (S M T W T F S) */}
              <div className="px-2 pt-2 pb-1 grid grid-cols-7 gap-0 text-center border-b border-[#EFECE4]">
                {WEEKDAYS.map((w, wIdx) => (
                  <div
                    key={`${monthName}-w-${wIdx}`}
                    className="text-[10px] font-extrabold text-[#4A4A4A]"
                  >
                    {w}
                  </div>
                ))}
              </div>

              {/* Day Numbers Grid WITH CONTINUOUS FILLED START -> END DATE BARS (gap-x-0 fuses consecutive days!) */}
              <div className="px-2 py-2 grid grid-cols-7 gap-x-0 gap-y-1.5 text-center">
                {cells.map((dayNum, cIdx) => {
                  if (dayNum === null) {
                    return <div key={`${monthName}-b-${cIdx}`} className="h-7" />;
                  }

                  const colIdx = cIdx % 7;
                  const iso = toIsoDate(selectedYear, month0, dayNum);
                  const dayItems = entriesByDate.get(iso) ?? [];
                  const isToday = iso === todayIso;
                  const isSelectedDay = iso === selectedDateIso;

                  const span = daySpanMap.get(dayNum);
                  const prevSpan = dayNum > 1 ? daySpanMap.get(dayNum - 1) : undefined;
                  const nextSpan = dayNum < daysInMonth ? daySpanMap.get(dayNum + 1) : undefined;

                  const sameAsPrev =
                    Boolean(span) && prevSpan?.id === span?.id && colIdx !== 0;
                  const sameAsNext =
                    Boolean(span) && nextSpan?.id === span?.id && colIdx !== 6;
                  const isSpanStartEdge = Boolean(span) && dayNum === span?.startDay;
                  const isSpanEndEdge = Boolean(span) && dayNum === span?.endDay;
                  const isHighlightedAnchor =
                    dayItems.length > 0 || (span && span.priority >= 2 && (isSpanStartEdge || isSpanEndEdge));

                  const spanStyle = span ? SPAN_STYLES[span.kind] : null;

                  // Continuous bar shape: seamless filled line connecting start date -> end date
                  const barRadiusClass =
                    !sameAsPrev && !sameAsNext
                      ? 'rounded-full'
                      : !sameAsPrev && sameAsNext
                        ? 'rounded-l-full rounded-r-none'
                        : sameAsPrev && !sameAsNext
                          ? 'rounded-r-full rounded-l-none'
                          : 'rounded-none';

                  const tooltipText = isToday
                    ? `Today (${farmDate.shortDate})${span ? ` · ${span.label} (${monthName} ${span.startDay}-${span.endDay})` : ''}`
                    : dayItems.length > 0
                      ? dayItems.map((i) => i.title).join(' | ')
                      : span
                        ? `${span.label} (${monthName} ${span.startDay} to ${monthName} ${span.endDay})`
                        : `${monthName} ${dayNum}, ${selectedYear}`;

                  return (
                    <div
                      key={iso}
                      className={`relative h-7 flex items-center justify-center ${
                        spanStyle ? barRadiusClass : ''
                      }`}
                      style={
                        spanStyle
                          ? {
                              backgroundColor: spanStyle.fillRgba,
                              borderBottom: `2.5px solid ${spanStyle.lineColor}`,
                            }
                          : undefined
                      }
                    >
                      <button
                        type="button"
                        title={tooltipText}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMonthIdx(month0);
                          setSelectedDateIso(iso);
                        }}
                        className={`relative h-6 w-6 rounded-full text-[11px] font-bold flex items-center justify-center transition cursor-pointer ${
                          isToday
                            ? 'bg-[#111111] text-[#EBB40E] font-extrabold today-calendar-pulse z-20'
                            : isHighlightedAnchor && spanStyle
                              ? `${spanStyle.edgeBg} font-extrabold shadow-xs z-10 hover:scale-110`
                              : isSelectedDay
                                ? 'bg-[#111111] text-white font-extrabold z-10'
                                : spanStyle
                                  ? `${spanStyle.textClass} font-bold hover:bg-black/10`
                                  : 'text-[#222222] hover:bg-black/8'
                        }`}
                      >
                        {isToday && (
                          <span
                            className="animate-ping absolute -inset-1 rounded-full bg-[#EBB40E]/55 pointer-events-none"
                            aria-hidden="true"
                          />
                        )}
                        <span className="relative z-10">{dayNum}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Month Filled-Range Footer Strip */}
              <div className="px-3 py-1.5 bg-[#F8F7F2] border-t border-[#ECEAE2] flex items-center justify-between gap-1 text-[10px]">
                <span className="font-bold text-[#3A3A3A] truncate">
                  {phase ? `${phase.stageBadge} · ${phase.family}` : 'Open window'}
                </span>
                <span className="font-extrabold text-[#007432] truncate max-w-[140px]">
                  {keyWindowLabels.length > 0
                    ? keyWindowLabels.join(' · ')
                    : `1-${daysInMonth} Active`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Selected Date / Month Inspector Panel */}
      <div className="rounded-2xl bg-[#F5F4F0] border border-[#DFDDD6] p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#007432]">
              {selectedDateIso && selectedDateIso.startsWith(`${selectedYear}-`)
                ? `Selected Date · ${selectedDateIso}`
                : `${MONTH_NAMES[selectedMonthIdx]} ${selectedYear} Schedule`}
            </div>
            <h4 className="text-sm sm:text-base font-extrabold text-[#111111] mt-0.5">
              {inspectedPhase
                ? `${inspectedPhase.stageBadge}: ${inspectedPhase.label} (${inspectedPhase.family})`
                : `${MONTH_NAMES[selectedMonthIdx]} ${selectedYear} Field Overview`}
            </h4>
          </div>

          <button
            type="button"
            onClick={() => {
              setNewDate(selectedDateIso || toIsoDate(selectedYear, selectedMonthIdx, 15));
              setShowAddForm(true);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white hover:bg-[#111111] text-[#111111] hover:text-white border border-[#CFCBC2] text-xs font-extrabold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Note on {MONTH_NAMES[selectedMonthIdx]}
          </button>
        </div>

        {/* Visual Date-Span Pills for the Selected Month */}
        {inspectedMonthSpans.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {inspectedMonthSpans.map((sp) => {
              const st = SPAN_STYLES[sp.kind];
              return (
                <span
                  key={sp.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-extrabold ${st.pillBg} ${st.pillText}`}
                >
                  <span
                    className="w-3 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: st.lineColor }}
                  />
                  <span>
                    {MONTH_NAMES[selectedMonthIdx].slice(0, 3)} {sp.startDay} to{' '}
                    {MONTH_NAMES[selectedMonthIdx].slice(0, 3)} {sp.endDay}:
                  </span>
                  <span className="font-bold">{sp.label}</span>
                </span>
              );
            })}
          </div>
        )}

        {inspectorEntries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {inspectorEntries.map((item) => {
              const st = SPAN_STYLES[item.kind];
              return (
                <div
                  key={item.id}
                  className="rounded-xl bg-white border border-[#DFDDD6] p-3.5 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${st.pillBg} ${st.pillText}`}
                      >
                        {item.isStrategyChange && <GitBranch className="w-3 h-3" />}
                        {st.label}
                      </span>
                      <span className="text-[11px] font-mono-tech font-bold text-[#4A4A4A]">
                        {item.dateStr}
                      </span>
                    </div>
                    <div
                      className={`text-xs sm:text-sm font-extrabold ${
                        item.completed ? 'line-through text-[#555555]' : 'text-[#111111]'
                      }`}
                    >
                      {item.title}
                    </div>
                    <p className="text-xs text-[#3A3A3A] leading-relaxed">{item.description}</p>
                  </div>

                  {item.sourceEventId && (
                    <button
                      type="button"
                      onClick={() => onToggleComplete(item.sourceEventId!)}
                      className="shrink-0 mt-0.5 text-[#00873A] hover:scale-110 transition cursor-pointer"
                      title={item.completed ? 'Mark incomplete' : 'Mark task complete'}
                      aria-label={item.completed ? 'Mark incomplete' : 'Mark task complete'}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-[#00873A]" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#9A988E]" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
