import React, { useEffect, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { FarmLeafletMap } from '../components/FarmLeafletMap';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Droplets,
  Leaf,
  Pause,
  Play,
  SkipForward,
  Sparkles,
  Sprout,
  TrendingUp,
} from 'lucide-react';

export const RotationLabPage: React.FC = () => {
  const {
    profile,
    beforeAnalysis,
    top3Strategies,
    selectedStrategyId,
    activeStrategy,
    selectRotationStrategy,
    navigate,
  } = useFarm();

  const [seasonIndex, setSeasonIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setSeasonIndex(0);
    setIsPlaying(false);
  }, [selectedStrategyId]);

  useEffect(() => {
    if (!isPlaying || !selectedStrategyId) return;
    const timer = setInterval(() => {
      setSeasonIndex((prev) => (prev + 1) % activeStrategy.steps.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [isPlaying, selectedStrategyId, activeStrategy.steps.length]);

  const currentStep = activeStrategy.steps[seasonIndex] ?? activeStrategy.steps[0];
  const centerTuple: [number, number] = [profile.coordinates.lat, profile.coordinates.lng];

  // =========================================================================
  // STEP 1: "BEFORE" FARM SUMMARY + TOP 3 VISUAL CROP ROTATION STRATEGY CARDS
  // =========================================================================
  if (!selectedStrategyId) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#00873A]">
            Step 1 of 2 · Before Analysis &amp; Top 3 AI Choices
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111]">
            AI Rotation Lab — Choose Your Best Plan
          </h2>
          <p className="text-xs sm:text-sm text-[#6F6F6F]">
            Based on your <strong>{profile.soilType}</strong> soil,{' '}
            <strong>
              {profile.countryFlag} {profile.countryName}
            </strong>{' '}
            NASA weather, and recent crop history, Tadawol ranked your Top 3 rotation strategies.
          </p>
        </div>

        {/* Plain-Language "BEFORE" Current Farm Condition Card */}
        <div className="surface-card p-5 sm:p-6 bg-[#FFFEFB] border-l-4 border-l-[#EBB40E] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#A17800]">
                <Sprout className="w-3.5 h-3.5" />
                &ldquo;Before&rdquo; — Your Current Field Baseline
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-[#111111] mt-0.5">
                {beforeAnalysis.headline}
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#FDF6DC] text-[#7A5B00] text-xs font-bold">
              {profile.areaHectares} ha Unified Surface
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#F5F4F0]">
              <div className="text-[11px] font-bold text-[#6F6F6F]">Current Soil Status</div>
              <div className="text-sm sm:text-base font-extrabold text-[#111111] mt-1">
                {beforeAnalysis.soilStatusLabel}
              </div>
              <div className="text-[11px] text-[#00873A] font-semibold">
                {profile.soilType} topsoil
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F5F4F0]">
              <div className="text-[11px] font-bold text-[#6F6F6F]">Chemical Fertilizer Need</div>
              <div className="text-sm sm:text-base font-extrabold text-[#B83B1A] mt-1">
                {beforeAnalysis.chemicalRiskLabel}
              </div>
              <div className="text-[11px] text-[#6F6F6F]">Can be cut naturally with legumes</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F5F4F0]">
              <div className="text-[11px] font-bold text-[#6F6F6F]">Moisture Readiness</div>
              <div className="text-sm sm:text-base font-extrabold text-[#111111] mt-1">
                {beforeAnalysis.moistureStatusLabel}
              </div>
              <div className="text-[11px] text-[#6F6F6F]">
                NASA root wetness: {profile.nasaPower.rootMoisturePct}%
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F5F4F0]">
              <div className="text-[11px] font-bold text-[#6F6F6F]">Slope &amp; Runoff</div>
              <div className="text-sm sm:text-base font-extrabold text-[#111111] mt-1">
                {beforeAnalysis.slopeStatusLabel}
              </div>
              <div className="text-[11px] text-[#6F6F6F]">
                Recent crops: {profile.previousCrops.join(', ') || 'Grains'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-[#E3F5EB]/60 border border-[#B8E5CC] space-y-1.5">
              <div className="text-xs font-extrabold text-[#005A26]">What&apos;s Working Well</div>
              {beforeAnalysis.strengths.map((s) => (
                <div key={s} className="flex items-start gap-1.5 text-xs text-[#2D2D2D]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00873A] shrink-0 mt-0.5" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
            <div className="p-3.5 rounded-xl bg-[#FDF6DC]/70 border border-[#EFE0A8] space-y-1.5">
              <div className="text-xs font-extrabold text-[#7A5B00]">What Rotation Fixes Next</div>
              {beforeAnalysis.needsAttention.map((n) => (
                <div key={n} className="flex items-start gap-1.5 text-xs text-[#2D2D2D]">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#A17800] shrink-0 mt-0.5" />
                  <span>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TOP 3 RECOMMENDED CROP ROTATION STRATEGY BOXES */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-extrabold text-[#111111] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#00873A]" />
              Pick 1 of Your Top 3 Tailored Crop Rotation Strategies
            </h3>
            <span className="text-xs text-[#6F6F6F] hidden sm:inline">
              Click any plan to unlock its interactive &ldquo;After&rdquo; map simulation
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {top3Strategies.map((strategy) => (
              <div
                key={strategy.id}
                className={`surface-card overflow-hidden flex flex-col justify-between transition hover:-translate-y-0.5 hover:shadow-lg ${
                  strategy.rank === 1 ? 'border-2 border-[#00873A]' : 'hover:border-[#111111]'
                }`}
              >
                <div>
                  {/* Curated Photo Header */}
                  <div className="relative h-44 w-full overflow-hidden bg-[#111111]">
                    <img
                      src={strategy.image}
                      alt={strategy.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/85 via-[#111111]/20 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold shadow ${
                          strategy.rank === 1
                            ? 'bg-[#EBB40E] text-[#111111]'
                            : 'bg-[#111111]/90 text-white'
                        }`}
                      >
                        {strategy.tierLabel} · {strategy.focusTag}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full bg-[#00873A] text-white text-xs font-extrabold shadow">
                        {strategy.matchScore}% Match
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h4 className="text-base font-extrabold text-white leading-snug">
                        {strategy.title}
                      </h4>
                    </div>
                  </div>

                  {/* Plain-Language Strategy Body */}
                  <div className="p-5 space-y-4">
                    <p className="text-xs sm:text-sm text-[#474747] leading-relaxed">
                      {strategy.subtitle}
                    </p>

                    {/* Sequence Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {strategy.steps.map((st, idx) => (
                        <React.Fragment key={st.stepNumber}>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F5F4F0] border border-[#DFDDD6] text-[11px] font-bold text-[#111111]">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: st.cropColor }}
                            />
                            {st.cropName}
                          </span>
                          {idx < strategy.steps.length - 1 && (
                            <span className="text-[#979797] text-xs">→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Key Farmer Highlight Bullets */}
                    <ul className="space-y-2 pt-1 border-t border-[#EFECE6]">
                      {strategy.highlights.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-2 text-xs font-semibold text-[#111111]"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#00873A] shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    type="button"
                    onClick={() => selectRotationStrategy(strategy.id)}
                    className={`w-full btn-pill text-xs sm:text-sm ${
                      strategy.rank === 1 ? 'btn-pill-primary' : 'btn-pill-green'
                    }`}
                  >
                    Simulate This Plan on My Map
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STEP 2: SELECTED STRATEGY "AFTER" UNIFIED SIMULATION & ROADMAP
  // =========================================================================
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with "Change Strategy" button (other 2 cards hidden!) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#00873A]">
            <Sparkles className="w-3.5 h-3.5" />
            Step 2 of 2 · &ldquo;After&rdquo; Unified Field Simulation · {activeStrategy.tierLabel}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111]">
            {activeStrategy.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#6F6F6F]">
            Match Score: <strong className="text-[#00873A]">{activeStrategy.matchScore}%</strong> ·
            Watch your single unified {profile.areaHectares} ha field improve season by season.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => selectRotationStrategy(null)}
            className="btn-pill btn-pill-outline text-xs !px-4 !py-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Change Strategy
          </button>
          <button
            type="button"
            onClick={() => navigate('predictions')}
            className="btn-pill btn-pill-primary text-xs sm:text-sm !px-5 !py-2"
          >
            View Future Predictions
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* UNIFIED SINGLE-SURFACE FIELD MAP + SEASONAL PLAY/NEXT SIMULATION */}
      <div className="surface-card p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#00873A]">
              {currentStep.seasonName} ({currentStep.timingLabel})
            </div>
            <h3 className="text-lg font-extrabold text-[#111111]">
              Unified Field Surface: {currentStep.cropName}{' '}
              <span className="text-sm font-semibold text-[#6F6F6F]">
                ({currentStep.cropFamily})
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="btn-pill btn-pill-primary text-xs !px-4 !py-2"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Pause Simulation' : 'Play Seasonal Animation'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setSeasonIndex((prev) => (prev + 1) % activeStrategy.steps.length);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#F5F4F0] hover:bg-[#111111] hover:text-white border border-[#D9D9D9] text-xs font-bold text-[#111111] transition cursor-pointer"
            >
              Next Season
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Single Unified Surface Map — NO 4-plot splitting! */}
        <FarmLeafletMap
          mode="rotation-lab"
          center={centerTuple}
          boundary={profile.boundary}
          heightClass="h-[360px] sm:h-[420px]"
          fieldOverlay={{
            cropName: currentStep.cropName,
            cropColor: currentStep.cropColor,
            topBadge: `${currentStep.shortSeason} · ${currentStep.stageLabel}`,
            bottomMetric: `Soil Richness ${currentStep.soilRichnessScore}/100 · ${currentStep.chemicalReductionPct}% Less Fertilizer`,
            soilRichnessScore: currentStep.soilRichnessScore,
            chemicalReductionPct: currentStep.chemicalReductionPct,
          }}
        />

        {/* Live Step Metric Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-[#E3F5EB] border border-[#B8E5CC]">
            <div className="text-[11px] font-bold text-[#005A26]">Soil Benefit &amp; Action</div>
            <div className="text-sm font-extrabold text-[#111111] mt-0.5">
              {currentStep.soilImprovementNote}
            </div>
            <p className="text-xs text-[#2D2D2D] mt-1">{currentStep.whatToDo}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-[#E2E0D8]">
            <div className="text-[11px] font-bold text-[#6F6F6F]">Soil Richness Progress</div>
            <div className="text-2xl font-extrabold text-[#00873A] mt-0.5">
              {currentStep.soilRichnessScore}{' '}
              <span className="text-xs font-bold text-[#6F6F6F]">/ 100</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white mt-2 overflow-hidden">
              <div
                className="h-full bg-[#00873A] rounded-full transition-all duration-500"
                style={{ width: `${currentStep.soilRichnessScore}%` }}
              />
            </div>
            <p className="text-[11px] text-[#6F6F6F] mt-1.5">{currentStep.pestBreakNote}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FDF6DC] border border-[#EFE0A8]">
            <div className="text-[11px] font-bold text-[#7A5B00]">Chemical Fertilizer Saved</div>
            <div className="text-2xl font-extrabold text-[#111111] mt-0.5">
              -{currentStep.chemicalReductionPct}%
            </div>
            <div className="text-xs text-[#7A5B00] mt-0.5">
              Soil Moisture Retention: <strong>+{currentStep.moistureRetentionPct}%</strong>
            </div>
          </div>
        </div>

        {/* VISUAL HORIZONTAL ROADMAP DIRECTLY BELOW MAP */}
        <div className="pt-2">
          <div className="text-xs font-extrabold uppercase tracking-wider text-[#6F6F6F] mb-3">
            Visual Seasonal Roadmap — Click any season to preview on the map
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {activeStrategy.steps.map((step, idx) => {
              const active = idx === seasonIndex;
              return (
                <button
                  key={step.stepNumber}
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setSeasonIndex(idx);
                  }}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer relative ${
                    active
                      ? 'bg-[#00873A] text-white border-[#00873A] shadow-md'
                      : 'bg-[#F5F4F0] text-[#111111] border-[#DFDDD6] hover:border-[#111111]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider ${
                        active ? 'text-[#92D500]' : 'text-[#00873A]'
                      }`}
                    >
                      {step.shortSeason}
                    </span>
                    <span
                      className="w-3 h-3 rounded-full border border-white/60"
                      style={{ backgroundColor: step.cropColor }}
                    />
                  </div>
                  <div className="text-sm font-extrabold mt-1">{step.cropName}</div>
                  <div
                    className={`text-[11px] mt-0.5 ${active ? 'text-white/85' : 'text-[#6F6F6F]'}`}
                  >
                    {step.timingLabel}
                  </div>
                  <div
                    className={`mt-2.5 text-[11px] font-bold px-2.5 py-1 rounded-full inline-block ${
                      active ? 'bg-white/15 text-[#EBB40E]' : 'bg-white text-[#111111]'
                    }`}
                  >
                    {step.stageLabel}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* PLAIN-LANGUAGE AI SUGGESTIONS + POSITIVE ASPECTS + EXPECTED OUTPUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="surface-card p-5 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#00873A]">
            <Sparkles className="w-4 h-4" />
            AI Farmer Suggestions
          </div>
          <h4 className="text-base font-extrabold text-[#111111]">Practical Steps to Succeed</h4>
          <ul className="space-y-2.5">
            {activeStrategy.aiSuggestions.map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-xs sm:text-sm text-[#333333]">
                <CheckCircle2 className="w-4 h-4 text-[#00873A] shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-card p-5 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#4E7A00]">
            <Leaf className="w-4 h-4" />
            Positive Aspects &amp; Benefits
          </div>
          <h4 className="text-base font-extrabold text-[#111111]">How Your Land Improves</h4>
          <div className="space-y-2.5">
            {activeStrategy.benefits.map((b) => (
              <div
                key={b.title}
                className="p-3 rounded-xl bg-[#F5F4F0] flex items-start justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-extrabold text-[#111111]">{b.title}</div>
                  <p className="text-[11px] text-[#474747] mt-0.5">{b.detail}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#E3F5EB] text-[#005A26] text-[10px] font-extrabold shrink-0">
                  {b.metric}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-5 bg-[#111111] text-white border-[#111111] flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#EBB40E]">
              <TrendingUp className="w-4 h-4" />
              Expected Output
            </div>
            <h4 className="text-base font-extrabold text-white">Clear Multi-Season Results</h4>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
              {activeStrategy.expectedOutput.plainSummary}
            </p>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="p-2.5 rounded-xl bg-white/10 text-center">
                <div className="text-lg font-extrabold text-[#92D500]">
                  +{activeStrategy.expectedOutput.yieldImprovementPct}%
                </div>
                <div className="text-[10px] text-white/75">Harvest Yield</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/10 text-center">
                <div className="text-lg font-extrabold text-[#EBB40E]">
                  -{activeStrategy.expectedOutput.chemicalReductionPct}%
                </div>
                <div className="text-[10px] text-white/75">Chemicals</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/10 text-center">
                <div className="text-lg font-extrabold text-[#44BE7E] flex items-center justify-center gap-0.5">
                  <Droplets className="w-3.5 h-3.5" />
                  {activeStrategy.expectedOutput.waterSavingsPct}%
                </div>
                <div className="text-[10px] text-white/75">Water Saved</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('predictions')}
            className="w-full btn-pill btn-pill-primary text-xs sm:text-sm"
          >
            View 5-Year Future Predictions
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
