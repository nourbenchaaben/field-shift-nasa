import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  Database,
  ExternalLink,
  Globe,
  Layers,
  Satellite,
  Search,
  Sliders,
  X,
  XCircle,
} from 'lucide-react';
import {
  CALCULATED_INDICATORS,
  DATA_SOURCES_REGISTRY,
  DataSourceEntry,
  LIVE_BACKEND_DATASETS,
  NON_SATELLITE_INPUTS,
  NOT_USED_IN_LIVE_BACKEND,
} from '../data/dataSourcesRegistry';

interface DataSourcesModalProps {
  open: boolean;
  onClose: () => void;
  liveNasaStatus?: 'nasa-power-live' | 'nasa-power-fallback';
}

const PHASE_SECTIONS: {
  id: DataSourceEntry['phase'];
  title: string;
  subtitle: string;
  badgeClass: string;
}[] = [
  {
    id: 'phase1',
    title: 'Phase 1 — Always-On Live Backend Pipeline',
    subtitle: 'Connected directly in Tadawol via NASA POWER REST API (no API key).',
    badgeClass: 'bg-[#00873A] text-white',
  },
  {
    id: 'phase2',
    title: 'Phase 2 — Optional Earth Engine Satellite Layers',
    subtitle: 'SMAP L4 v008, MODIS MOD13Q1 v061, and SRTM GL1 v003 when GEE is enabled.',
    badgeClass: 'bg-[#EBB40E] text-[#111111]',
  },
  {
    id: 'phase3-nasa',
    title: 'NASA & Global Earth Observation Portals',
    subtitle: 'Additional global portals evaluated or available as reference.',
    badgeClass: 'bg-[#111111] text-white',
  },
  {
    id: 'phase3-partner',
    title: 'Space Agency & Weather Partner Resources',
    subtitle: 'ESA Sentinel-2, ECMWF ERA5, and Meteomatics prototype reference.',
    badgeClass: 'bg-[#1696A8] text-white',
  },
  {
    id: 'phase3-regional',
    title: 'U.S. & Regional Agricultural Reference Portals',
    subtitle: 'USDA, USGS, PRISM, CoCoRaHS, and USFS LANDFIRE reference links.',
    badgeClass: 'bg-[#474747] text-white',
  },
];

export const DataSourcesModal: React.FC<DataSourcesModalProps> = ({
  open,
  onClose,
  liveNasaStatus = 'nasa-power-live',
}) => {
  const [activeTab, setActiveTab] = useState<'pitch-spec' | 'all-portals'>('pitch-spec');
  const [search, setSearch] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<'all' | DataSourceEntry['phase']>('all');

  const filteredPortals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return DATA_SOURCES_REGISTRY.filter((item) => {
      if (phaseFilter !== 'all' && item.phase !== phaseFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.agency.toLowerCase().includes(q) ||
        item.farmerBenefit.toLowerCase().includes(q) ||
        item.links.some((l) => l.label.toLowerCase().includes(q))
      );
    });
  }, [search, phaseFilter]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[900] bg-[#111111]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="bg-[#FFFEFB] border border-[#D9D9D9] rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#00873A] text-white px-6 py-5 flex items-start justify-between gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-survey-pattern-light opacity-30 pointer-events-none" />
          <div className="relative z-10 space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#92D500]">
              <Satellite className="w-4 h-4" />
              Final Data Specification &amp; Satellite Transparency
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Data Used in Tadawol — Live Backend Datasets, Thresholds &amp; Limitations
            </h2>
            <p className="text-xs sm:text-sm text-white/90 max-w-3xl">
              Aligned directly with <code>backend/main.py</code> &amp;{' '}
              <code>backend/data/climate.py</code>: transparent about every live NASA variable,
              optional Earth Engine asset, calculated risk threshold, and limitation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Data Sources"
            className="relative z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white hover:text-[#111111] flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Mode Tabs */}
        <div className="px-6 py-3 bg-[#F5F4F0] border-b border-[#DFDDD6] flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex bg-white p-1 rounded-full border border-[#D9D9D9]">
            <button
              type="button"
              onClick={() => setActiveTab('pitch-spec')}
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'pitch-spec'
                  ? 'bg-[#00873A] text-white'
                  : 'text-[#474747] hover:text-[#111111]'
              }`}
            >
              Final Live Data Spec (4 Active + Thresholds)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all-portals')}
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'all-portals'
                  ? 'bg-[#111111] text-white'
                  : 'text-[#474747] hover:text-[#111111]'
              }`}
            >
              All External Satellite &amp; Ag Portals ({DATA_SOURCES_REGISTRY.length})
            </button>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
              liveNasaStatus === 'nasa-power-live'
                ? 'bg-[#E3F5EB] text-[#005A26]'
                : 'bg-[#FDF6DC] text-[#7A5B00]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {liveNasaStatus === 'nasa-power-live'
              ? 'NASA POWER REST API Live Connected'
              : 'NASA POWER Offline Fallback Active'}
          </span>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {activeTab === 'pitch-spec' ? (
            <>
              {/* SECTION 1: 4 LIVE BACKEND DATASETS */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#00873A]" />
                  <h3 className="text-base font-extrabold text-[#111111]">
                    1. Datasets Used by the Live Backend
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {LIVE_BACKEND_DATASETS.map((ds) => (
                    <div
                      key={ds.id}
                      className="bg-white border border-[#DFDDD6] rounded-2xl p-4 space-y-3 hover:border-[#00873A] transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-extrabold text-[#111111]">{ds.name}</h4>
                          <p className="text-[11px] text-[#6F6F6F] mt-0.5">{ds.provider}</p>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shrink-0 ${
                            ds.modeBadge === 'Always On'
                              ? 'bg-[#00873A] text-white'
                              : 'bg-[#FDF6DC] text-[#7A5B00]'
                          }`}
                        >
                          {ds.modeBadge}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5 text-xs bg-[#F5F4F0] rounded-xl p-3">
                        <div>
                          <span className="font-bold text-[#111111]">Variables: </span>
                          <span className="text-[#474747]">{ds.variables}</span>
                        </div>
                        <div>
                          <span className="font-bold text-[#111111]">Resolution / Period: </span>
                          <span className="text-[#474747]">
                            {ds.resolution} · {ds.period}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-[#111111]">Access: </span>
                          <span className="text-[#474747]">{ds.access}</span>
                        </div>
                        <div>
                          <span className="font-bold text-[#00873A]">Used for: </span>
                          <span className="text-[#2D2D2D]">{ds.usedFor}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5 text-[11px] text-[#8C2B11] bg-[#FCEBE6]/65 border border-[#F0C4B8] rounded-xl p-2.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>
                          <strong>Main limitation:</strong> {ds.limitation}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {ds.links.map((lnk) => (
                          <a
                            key={lnk.url}
                            href={lnk.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F4F0] hover:bg-[#EBB40E] border border-[#D9D9D9] text-[11px] font-bold text-[#111111] no-underline transition"
                          >
                            <Globe className="w-3 h-3 text-[#00873A]" />
                            {lnk.label}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 2: NON-SATELLITE INPUTS */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#00873A]" />
                  <h3 className="text-base font-extrabold text-[#111111]">
                    2. Inputs That Are Not Satellite Datasets
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {NON_SATELLITE_INPUTS.map((inp) => (
                    <div
                      key={inp.input}
                      className="bg-white border border-[#DFDDD6] rounded-xl p-4 space-y-1.5 text-xs"
                    >
                      <div className="text-sm font-extrabold text-[#111111]">{inp.input}</div>
                      <div>
                        <strong className="text-[#474747]">Source:</strong> {inp.origin}
                      </div>
                      <div>
                        <strong className="text-[#00873A]">Used for:</strong> {inp.usedFor}
                      </div>
                      <div className="text-[#8C2B11] pt-1">
                        <strong>Limitation:</strong> {inp.limitation}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 3: EXACT CALCULATED INDICATORS & THRESHOLDS */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#00873A]" />
                  <h3 className="text-base font-extrabold text-[#111111]">
                    3. Indicators &amp; Risk Calendar Thresholds Calculated From the Data
                  </h3>
                </div>
                <div className="border border-[#DFDDD6] rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5F4F0] text-[10px] uppercase tracking-wider text-[#6F6F6F]">
                      <tr>
                        <th className="px-4 py-2.5">Indicator</th>
                        <th className="px-4 py-2.5">From</th>
                        <th className="px-4 py-2.5">Exact Definition / Threshold</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFECE6]">
                      {CALCULATED_INDICATORS.map((row) => (
                        <tr key={row.indicator}>
                          <td className="px-4 py-2.5 font-extrabold text-[#111111] whitespace-nowrap">
                            {row.indicator}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-[#00873A] whitespace-nowrap">
                            {row.source}
                          </td>
                          <td className="px-4 py-2.5 text-[#333333]">{row.definition}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* SECTION 4: CONSIDERED BUT NOT USED IN LIVE BACKEND */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-[#6F6F6F]" />
                  <h3 className="text-base font-extrabold text-[#111111]">
                    4. Considered But Not Used in the Live Backend (Scope Transparency)
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {NOT_USED_IN_LIVE_BACKEND.map((item) => (
                    <div
                      key={item.dataset}
                      className="bg-[#F5F4F0] border border-[#E2E0D8] rounded-xl p-3.5 flex flex-col justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-extrabold text-[#111111]">{item.dataset}</div>
                        <p className="text-[#474747] mt-1 leading-relaxed">{item.reasonNotUsed}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.links.map((lnk) => (
                          <a
                            key={lnk.url}
                            href={lnk.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#D9D9D9] text-[10px] font-bold text-[#111111] hover:border-[#00873A] no-underline"
                          >
                            {lnk.label}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            /* TAB 2: SEARCHABLE FULL REFERENCE PORTALS */
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#6F6F6F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search NASA POWER, SMAP, MODIS, SRTM, SoilGrids, USDA..."
                    className="w-full pl-9 pr-3 py-2 bg-[#F5F4F0] border border-[#D1D1D1] rounded-full text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'all', label: `All (${DATA_SOURCES_REGISTRY.length})` },
                      { id: 'phase1', label: 'Phase 1 Live' },
                      { id: 'phase2', label: 'Phase 2 EE' },
                      { id: 'phase3-nasa', label: 'NASA / Global' },
                      { id: 'phase3-partner', label: 'ESA / Partners' },
                      { id: 'phase3-regional', label: 'USDA / USGS' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setPhaseFilter(f.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                        phaseFilter === f.id
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white text-[#474747] border-[#D9D9D9] hover:border-[#111111]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {PHASE_SECTIONS.map((section) => {
                const items = filteredPortals.filter((it) => it.phase === section.id);
                if (items.length === 0) return null;
                return (
                  <div key={section.id} className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#EFECE6]">
                      <div>
                        <h3 className="text-base font-extrabold text-[#111111] flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#00873A]" />
                          {section.title}
                        </h3>
                        <p className="text-xs text-[#6F6F6F] mt-0.5">{section.subtitle}</p>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${section.badgeClass}`}
                      >
                        {items.length} {items.length === 1 ? 'Portal' : 'Portals'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {items.map((entry) => (
                        <div
                          key={entry.id}
                          className="bg-white border border-[#DFDDD6] rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-[#00873A] transition"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F6F6F]">
                                  {entry.agency}
                                </div>
                                <h4 className="text-sm font-extrabold text-[#111111]">
                                  {entry.name}
                                </h4>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F4F0] text-[#474747] shrink-0">
                                {entry.statusBadge}
                              </span>
                            </div>
                            <p className="text-xs text-[#474747] leading-relaxed">
                              {entry.farmerBenefit}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F1F0EE]">
                            {entry.links.map((lnk) => (
                              <a
                                key={lnk.url + lnk.label}
                                href={lnk.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F4F0] hover:bg-[#EBB40E] border border-[#D9D9D9] text-[11px] font-bold text-[#111111] no-underline transition"
                              >
                                <Globe className="w-3 h-3 text-[#00873A]" />
                                <span>{lnk.label}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
