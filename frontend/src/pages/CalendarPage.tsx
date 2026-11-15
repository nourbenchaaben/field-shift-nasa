import React, { useMemo, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { CalendarEvent } from '../types/farm';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Droplets,
  Plus,
  Sprout,
  Wheat,
  X,
} from 'lucide-react';

type CalendarScale = 'days' | 'months' | 'seasons' | 'years';

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

const SEASONS_DEF: { id: CalendarEvent['season']; label: string; badge: string }[] = [
  { id: 'Winter', label: 'Winter', badge: 'Cool & Rain Recovery' },
  { id: 'Spring', label: 'Spring', badge: 'Main Growth Window' },
  { id: 'Summer', label: 'Summer', badge: 'Harvest & Cover Care' },
  { id: 'Autumn', label: 'Autumn', badge: 'Soil Prep & Seeding' },
];

function categoryStyle(cat: CalendarEvent['category']) {
  switch (cat) {
    case 'planting':
    case 'rotation':
      return {
        bg: 'bg-[#E3F5EB]',
        text: 'text-[#005A26]',
        border: 'border-[#B8E5CC]',
        label: cat === 'rotation' ? 'Rotation Switch' : 'Planting',
      };
    case 'harvest':
      return {
        bg: 'bg-[#FDF6DC]',
        text: 'text-[#7A5B00]',
        border: 'border-[#EFE0A8]',
        label: 'Harvest',
      };
    case 'water':
      return {
        bg: 'bg-[#E4F4F7]',
        text: 'text-[#0E5E6B]',
        border: 'border-[#B5DFE6]',
        label: 'Watering',
      };
    case 'alert':
      return {
        bg: 'bg-[#FCEBE6]',
        text: 'text-[#8C2B11]',
        border: 'border-[#E7A18E]',
        label: 'Bare-Field Alert',
      };
    default:
      return {
        bg: 'bg-[#F5F4F0]',
        text: 'text-[#333333]',
        border: 'border-[#DFDDD6]',
        label: 'Soil Care',
      };
  }
}

function monthToSeason(month: number): CalendarEvent['season'] {
  if (month === 12 || month <= 2) return 'Winter';
  if (month <= 5) return 'Spring';
  if (month <= 8) return 'Summer';
  return 'Autumn';
}

export const CalendarPage: React.FC = () => {
  const {
    profile,
    calendarEvents,
    toggleCalendarComplete,
    addCalendarEvent,
    activeStrategy,
  } = useFarm();

  const [scale, setScale] = useState<CalendarScale>('months');
  const [focusYear, setFocusYear] = useState<number>(2026);
  const [focusMonth, setFocusMonth] = useState<number>(10); // 0-indexed (10 = Nov 2026)
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'past' | 'current' | 'future'>('all');
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Add Task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('2026-11-22');
  const [newCategory, setNewCategory] = useState<CalendarEvent['category']>('soil');
  const [newCrop, setNewCrop] = useState(activeStrategy.steps[0]?.cropName ?? 'Field Crop');
  const [newDesc, setNewDesc] = useState('');

  const filteredEvents = useMemo(() => {
    return calendarEvents.filter((ev) => {
      if (phaseFilter !== 'all' && ev.phase !== phaseFilter) return false;
      return true;
    });
  }, [calendarEvents, phaseFilter]);

  const handlePrev = () => {
    if (scale === 'months' || scale === 'days') {
      if (focusMonth === 0) {
        setFocusMonth(11);
        setFocusYear((y) => y - 1);
      } else {
        setFocusMonth((m) => m - 1);
      }
    } else {
      setFocusYear((y) => y - 1);
    }
  };

  const handleNext = () => {
    if (scale === 'months' || scale === 'days') {
      if (focusMonth === 11) {
        setFocusMonth(0);
        setFocusYear((y) => y + 1);
      } else {
        setFocusMonth((m) => m + 1);
      }
    } else {
      setFocusYear((y) => y + 1);
    }
  };

  const jumpToday = () => {
    setFocusYear(2026);
    setFocusMonth(10);
  };

  const monthDaysGrid = useMemo(() => {
    const firstDay = new Date(focusYear, focusMonth, 1).getDay();
    const totalDays = new Date(focusYear, focusMonth + 1, 0).getDate();
    const cells: { day: number | null; iso: string | null }[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ day: null, iso: null });
    for (let d = 1; d <= totalDays; d++) {
      const mStr = String(focusMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      cells.push({ day: d, iso: `${focusYear}-${mStr}-${dStr}` });
    }
    return cells;
  }, [focusYear, focusMonth]);

  const eventsInFocusMonth = useMemo(() => {
    return filteredEvents.filter((e) => e.year === focusYear && e.month === focusMonth + 1);
  }, [filteredEvents, focusYear, focusMonth]);

  const eventsInFocusYear = useMemo(
    () => filteredEvents.filter((e) => e.year === focusYear),
    [filteredEvents, focusYear]
  );

  const multiYearRange = [focusYear - 1, focusYear, focusYear + 1, focusYear + 2];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const [yStr, mStr] = newDate.split('-');
    const yearNum = Number(yStr) || 2026;
    const monthNum = Number(mStr) || 11;
    const phase: CalendarEvent['phase'] =
      newDate < '2026-11-01' ? 'past' : newDate <= '2026-12-01' ? 'current' : 'future';

    addCalendarEvent({
      date: newDate,
      year: yearNum,
      month: monthNum,
      season: monthToSeason(monthNum),
      phase,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Farmer custom schedule task.',
      cropName: newCrop.trim() || 'Unified Field',
      category: newCategory,
      completed: phase === 'past',
    });
    setNewTitle('');
    setNewDesc('');
    setAddModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#007432]">
            Multi-Year Planting &amp; Harvest Schedule
          </span>
          <h2 className="text-2xl sm:text-[1.75rem] font-extrabold text-[#111111]">
            Farm Calendar &amp; Seasonal Roadmap
          </h2>
          <p className="text-xs sm:text-sm text-[#3A3A3A]">
            Synced with <strong className="text-[#111111]">{activeStrategy.title}</strong>,
            including past harvests, active field checks, and Bare-Field Clock cover alerts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="btn-pill btn-pill-primary text-xs sm:text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Farm Task
        </button>
      </div>

      {/* Time Scale Switcher (Days / Months / Seasons / Years) + Multi-Year Navigator */}
      <div className="surface-card p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center bg-[#EFECE4] p-1 rounded-full border border-[#D9D5CB] self-start">
          {(
            [
              { id: 'days', label: 'Days' },
              { id: 'months', label: 'Months' },
              { id: 'seasons', label: 'Seasons' },
              { id: 'years', label: 'Years' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setScale(tab.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer ${
                scale === tab.id
                  ? 'bg-[#007432] text-white shadow-xs'
                  : 'text-[#2E2E2E] hover:text-[#111111]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous period"
            className="w-9 h-9 rounded-full border border-[#CFCBC2] bg-white hover:bg-[#111111] hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="min-w-[165px] text-center text-sm font-extrabold text-[#111111]">
            {scale === 'days' || scale === 'months'
              ? `${MONTH_NAMES[focusMonth]} ${focusYear}`
              : scale === 'seasons'
                ? `${focusYear} Seasons`
                : `${multiYearRange[0]} – ${multiYearRange[3]}`}
          </div>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next period"
            className="w-9 h-9 rounded-full border border-[#CFCBC2] bg-white hover:bg-[#111111] hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={jumpToday}
            className="px-3.5 py-1.5 rounded-full bg-[#F5F4F0] hover:bg-[#EBB40E] border border-[#CFCBC2] text-xs font-extrabold text-[#111111] transition cursor-pointer"
          >
            Today
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'all', label: `All (${calendarEvents.length})` },
              {
                id: 'past',
                label: `Past (${calendarEvents.filter((e) => e.phase === 'past').length})`,
              },
              {
                id: 'current',
                label: `Current (${calendarEvents.filter((e) => e.phase === 'current').length})`,
              },
              {
                id: 'future',
                label: `Future (${calendarEvents.filter((e) => e.phase === 'future').length})`,
              },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setPhaseFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                phaseFilter === f.id
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-white text-[#2E2E2E] border-[#CFCBC2] hover:border-[#111111]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: DAYS */}
      {scale === 'days' && (
        <div className="surface-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-[#111111]">
              Daily Schedule: {MONTH_NAMES[focusMonth]} {focusYear}
            </h3>
            <span className="text-xs font-bold text-[#3A3A3A]">
              {eventsInFocusMonth.length} scheduled{' '}
              {eventsInFocusMonth.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          {eventsInFocusMonth.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#F5F4F0] space-y-2">
              <CalendarDays className="w-8 h-8 text-[#007432] mx-auto" />
              <div className="text-sm font-extrabold text-[#111111]">
                Quiet month in {MONTH_NAMES[focusMonth]} {focusYear}
              </div>
              <p className="text-xs sm:text-sm text-[#3A3A3A]">
                Use the arrows above to browse other months, switch to Seasons/Years view, or add a
                custom farm task.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {eventsInFocusMonth.map((ev) => {
                const st = categoryStyle(ev.category);
                return (
                  <div
                    key={ev.id}
                    className={`p-4 rounded-xl border ${st.border} bg-white flex items-start justify-between gap-4`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleCalendarComplete(ev.id)}
                        className="mt-0.5 text-[#00873A] cursor-pointer"
                        title="Toggle task completed"
                      >
                        {ev.completed ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Circle className="w-5 h-5 text-[#555555]" />
                        )}
                      </button>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono-tech text-xs font-bold text-[#111111]">
                            {ev.date}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${st.bg} ${st.text}`}
                          >
                            {st.label}
                          </span>
                          {ev.cropName && (
                            <span className="text-[11px] font-semibold text-[#3A3A3A]">
                              {ev.cropName}
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-sm font-extrabold mt-1 ${
                            ev.completed ? 'line-through text-[#3A3A3A]' : 'text-[#111111]'
                          }`}
                        >
                          {ev.title}
                        </div>
                        <p className="text-xs text-[#474747] mt-0.5">{ev.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: MONTHS */}
      {scale === 'months' && (
        <div className="surface-card p-5 space-y-4">
          <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-extrabold uppercase tracking-wider text-[#3A3A3A]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {monthDaysGrid.map((cell, idx) => {
              if (!cell.day || !cell.iso) {
                return (
                  <div key={`empty-${idx}`} className="min-h-[78px] rounded-xl bg-[#F5F4F0]/50" />
                );
              }
              const dayEvents = eventsInFocusMonth.filter((e) => e.date === cell.iso);
              const isToday = cell.iso === '2026-11-14';
              return (
                <div
                  key={cell.iso}
                  className={`min-h-[82px] sm:min-h-[96px] rounded-xl p-2 border flex flex-col gap-1 transition ${
                    isToday
                      ? 'bg-[#E3F5EB] border-[#00873A] ring-2 ring-[#00873A]/20'
                      : 'bg-white border-[#E5E3DB]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-extrabold ${
                        isToday ? 'text-[#00873A]' : 'text-[#111111]'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {isToday && (
                      <span className="text-[11px] font-extrabold uppercase bg-[#00873A] text-white px-1.5 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {dayEvents.map((ev) => {
                      const st = categoryStyle(ev.category);
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => toggleCalendarComplete(ev.id)}
                          title={`${ev.title}: ${ev.description}`}
                          className={`w-full text-left px-1.5 py-1 rounded-md text-[11px] font-bold truncate border cursor-pointer ${st.bg} ${st.text} ${st.border} ${
                            ev.completed ? 'opacity-60 line-through' : ''
                          }`}
                        >
                          {ev.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: SEASONS */}
      {scale === 'seasons' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SEASONS_DEF.map((season) => {
            const seasonEvents = eventsInFocusYear.filter((e) => e.season === season.id);

            return (
              <div key={season.id} className="surface-card p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-[#111111]">
                      {season.label} {focusYear}
                    </h3>
                    <div className="text-xs text-[#3A3A3A]">{season.badge}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#F5F4F0] text-xs font-bold text-[#00873A]">
                    {seasonEvents.length} {seasonEvents.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>

                {seasonEvents.length === 0 ? (
                  <p className="text-xs text-[#3A3A3A] py-3">
                    No tasks scheduled for {season.label} {focusYear}. Keep ground covered to
                    protect moisture.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {seasonEvents.map((ev) => {
                      const st = categoryStyle(ev.category);
                      return (
                        <div
                          key={ev.id}
                          className={`p-3 rounded-xl border ${st.border} ${st.bg}/40 flex items-start gap-2.5`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleCalendarComplete(ev.id)}
                            className="mt-0.5 text-[#00873A] cursor-pointer shrink-0"
                          >
                            {ev.completed ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Circle className="w-4 h-4 text-[#3A3A3A]" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                              <span className="font-mono-tech text-[#111111]">{ev.date}</span>
                              <span className={`px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                                {st.label}
                              </span>
                            </div>
                            <div className="text-xs sm:text-sm font-extrabold text-[#111111] mt-0.5">
                              {ev.title}
                            </div>
                            <p className="text-xs text-[#474747] mt-0.5">{ev.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 4: YEARS */}
      {scale === 'years' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {multiYearRange.map((yr) => {
            const yrEvents = filteredEvents.filter((e) => e.year === yr);
            const isCurrentYr = yr === 2026;
            return (
              <div
                key={yr}
                className={`surface-card p-5 space-y-3 ${
                  isCurrentYr ? 'border-[#00873A] ring-2 ring-[#00873A]/15' : ''
                }`}
              >
                <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold text-[#111111]">{yr}</span>
                    {isCurrentYr && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EBB40E] text-[#111111] text-[11px] font-extrabold">
                        Current Year
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFocusYear(yr);
                      setScale('seasons');
                    }}
                    className="text-xs font-bold text-[#00873A] hover:underline cursor-pointer"
                  >
                    Open Seasons →
                  </button>
                </div>

                {yrEvents.length === 0 ? (
                  <p className="text-xs text-[#3A3A3A]">
                    Long-term rotation carryover year. Add custom tasks anytime.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {yrEvents.map((ev) => {
                      const st = categoryStyle(ev.category);
                      return (
                        <div
                          key={ev.id}
                          className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-[#F5F4F0]"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-[#111111] truncate">
                              {ev.title}
                            </div>
                            <div className="text-[11px] text-[#3A3A3A] truncate">
                              {ev.date} {ev.cropName ? `· ${ev.cropName}` : ''}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${st.bg} ${st.text}`}
                          >
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Full Complete Roadmap Summary */}
      <div className="surface-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-[#111111]">
              Complete Farm Roadmap (Past History → Current → Future Schedule)
            </h3>
            <p className="text-xs text-[#3A3A3A]">
              Click any circle to mark field tasks done as you move through the year.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1 text-[#00873A]">
              <Sprout className="w-3.5 h-3.5" /> Planting
            </span>
            <span className="inline-flex items-center gap-1 text-[#A17800]">
              <Wheat className="w-3.5 h-3.5" /> Harvest
            </span>
            <span className="inline-flex items-center gap-1 text-[#1696A8]">
              <Droplets className="w-3.5 h-3.5" /> Watering
            </span>
            <span className="inline-flex items-center gap-1 text-[#B83B1A]">
              <AlertTriangle className="w-3.5 h-3.5" /> Bare-Field Alert
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredEvents.map((ev) => {
            const st = categoryStyle(ev.category);
            return (
              <div
                key={ev.id}
                className={`p-3.5 rounded-xl border ${st.border} bg-white flex items-start gap-2.5`}
              >
                <button
                  type="button"
                  onClick={() => toggleCalendarComplete(ev.id)}
                  className="mt-0.5 text-[#00873A] cursor-pointer shrink-0"
                >
                  {ev.completed ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4 text-[#555555]" />
                  )}
                </button>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono-tech text-[11px] font-bold text-[#111111]">
                      {ev.date}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${st.bg} ${st.text}`}
                    >
                      {st.label}
                    </span>
                  </div>
                  <div
                    className={`text-xs font-extrabold ${
                      ev.completed ? 'line-through text-[#3A3A3A]' : 'text-[#111111]'
                    }`}
                  >
                    {ev.title}
                  </div>
                  <p className="text-[11px] text-[#474747] leading-relaxed">{ev.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Custom Task Modal */}
      {addModalOpen && (
        <div
          className="fixed inset-0 z-[800] bg-[#111111]/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setAddModalOpen(false)}
        >
          <div
            className="bg-[#FFFEFB] border border-[#D9D9D9] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-[#00873A] text-white flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white">Add Custom Farm Task</h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Check drip lines before dry week"
                  className="w-full px-3 py-2 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as CalendarEvent['category'])}
                    className="w-full px-3 py-2 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm"
                  >
                    <option value="planting">Planting</option>
                    <option value="harvest">Harvest</option>
                    <option value="water">Watering</option>
                    <option value="soil">Soil Care</option>
                    <option value="rotation">Rotation Switch</option>
                    <option value="alert">Bare-Field Alert</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Crop Name</label>
                <input
                  type="text"
                  value={newCrop}
                  onChange={(e) => setNewCrop(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Plain-Language Notes</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Optional reminder..."
                  className="w-full px-3 py-2 bg-[#F5F4F0] border border-[#D1D1D1] rounded-xl text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#D9D9D9] text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-pill btn-pill-primary text-xs !px-5 !py-2">
                  Save to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
