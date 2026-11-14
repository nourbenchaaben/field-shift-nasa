import React, { useEffect, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { BrandMark } from '../components/BrandMark';
import { DataSourcesModal } from '../components/DataSourcesModal';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Compass,
  Mail,
  Map as MapIcon,
  Satellite,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

const HERO_SLIDES = [
  {
    image: '/images/hero-smart-farming.jpg',
    tag: 'NASA POWER · Daily 1981–2025',
    title: 'Field-level climate & moisture tracking',
    meta: 'PRECTOTCORR · T2M_MIN · GWETROOT',
  },
  {
    image: '/images/hero-crop-rotation.jpg',
    tag: 'AI Rotation Lab',
    title: 'Top 3 ranked multi-season sequences',
    meta: 'Legume nitrogen · Water fit · Runoff cover',
  },
  {
    image: '/images/hero-satellite-mapping.jpg',
    tag: 'Unified Parcel Map',
    title: 'Pin, resize & monitor multiple farms',
    meta: 'SMAP L4 · MODIS NDVI · SRTM 30m Slope',
  },
];

const FEATURE_CARDS = [
  {
    num: '01',
    title: 'Smart Rotation Advisor',
    tag: 'Decision Engine',
    accent: '#00873A',
    icon: <Sparkles className="w-5 h-5" />,
    summary:
      'Ranks your Top 3 crop rotation plans from local rainfall, soil type, slope, and previous crops, then simulates each season on your field.',
  },
  {
    num: '02',
    title: 'Interactive Global Field Map',
    tag: 'Single-Surface Parcel',
    accent: '#44BE7E',
    icon: <MapIcon className="w-5 h-5" />,
    summary:
      'Locate any parcel worldwide, drag corners to adjust hectares, add multiple farms under one account, and preview seasonal crop transitions.',
  },
  {
    num: '03',
    title: 'Live NASA Satellite Insights',
    tag: 'POWER + Earth Engine',
    accent: '#EBB40E',
    icon: <Satellite className="w-5 h-5" />,
    summary:
      'Live NASA POWER rainfall, frost days, heavy-rain days, autumn onset, and root-zone wetness alongside SMAP L4, MODIS NDVI, and SRTM slope.',
  },
  {
    num: '04',
    title: 'Farm Calendar & History',
    tag: 'Days · Months · Years',
    accent: '#92D500',
    icon: <CalendarDays className="w-5 h-5" />,
    summary:
      '12-month Frost, Heavy Rain, Dry Soil, and Bare-Field risk calendar paired with multi-year task scheduling and 2022–2026 harvest logs.',
  },
  {
    num: '05',
    title: 'Future Farm Outlook',
    tag: '5-Year Forecast',
    accent: '#111111',
    icon: <TrendingUp className="w-5 h-5" />,
    summary:
      'Before-and-after 5-year projections for soil organic matter, chemical input savings, water efficiency, and yield under Normal, Drought, or Wet years.',
  },
];

export const LandingPage: React.FC = () => {
  const { navigate, isAuthenticated, isDataSourcesOpen, setIsDataSourcesOpen } = useFarm();
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5800);
    return () => clearInterval(timer);
  }, []);

  const currentSlide = HERO_SLIDES[slideIdx];
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div id="homepage" className="min-h-screen bg-[#FFFEFB] text-[#111111]">
      {/* Clean Modernist Top Header — transform-rotations.eu architecture */}
      <header className="sticky top-0 z-40 bg-[#FFFEFB]/95 backdrop-blur-md border-b border-[#E6E4DC]">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 h-[82px] flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => scrollTo('homepage')}
            className="cursor-pointer"
          >
            <BrandMark subtitle="Crop Rotation & EO" />
          </button>

          <nav className="hidden md:flex items-center gap-8 text-[14px] font-semibold text-[#474747]">
            <button
              type="button"
              onClick={() => scrollTo('homepage')}
              className="hover:text-[#00873A] transition cursor-pointer"
            >
              Homepage
            </button>
            <button
              type="button"
              onClick={() => scrollTo('features')}
              className="hover:text-[#00873A] transition cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollTo('about')}
              className="hover:text-[#00873A] transition cursor-pointer"
            >
              About Us
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate('dashboard')}
                className="btn-harvest text-sm"
              >
                Open Workspace
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('auth', { authTab: 'login' })}
                  className="btn-outline-ink !min-h-[42px] !px-5 text-sm"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => navigate('auth', { authTab: 'register' })}
                  className="btn-harvest !min-h-[42px] !px-5 text-sm"
                >
                  Register
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION — Warm Paper Editorial Split with Signature Green Architectural Frame & Carousel */}
      <section className="relative overflow-hidden bg-[#FFFEFB] border-b border-[#E8E6DE]">
        {/* Subtle survey dot pattern on left & architectural green wash on right */}
        <div className="absolute inset-y-0 left-0 w-full lg:w-7/12 bg-survey-pattern opacity-70 pointer-events-none" />
        <div className="hidden lg:block absolute inset-y-0 right-0 w-[44%] bg-[#00873A] pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-survey-pattern-light opacity-50" />
          <div className="absolute -right-32 -top-32 w-[520px] h-[520px] rounded-full border-[24px] border-white/15" />
          <div className="absolute -left-24 -bottom-36 w-[380px] h-[380px] rounded-full border-[20px] border-[#92D500]/20" />
        </div>

        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 py-14 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Editorial Column */}
          <div className="lg:col-span-6 space-y-6 pr-0 lg:pr-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5F4F0] border border-[#DFDDD6] text-xs font-bold text-[#00873A]">
              <span className="w-2 h-2 rounded-full bg-[#00873A]" />
              NASA POWER · SMAP L4 · MODIS · SRTM
            </div>

            <h1 className="text-[2.35rem] sm:text-[3.25rem] font-extrabold text-[#111111] leading-[1.09] tracking-[-0.03em]">
              Data-driven crop rotation for resilient fields.
            </h1>

            <p className="text-[15px] sm:text-[17px] text-[#474747] leading-[1.6] max-w-xl">
              Map your parcels, read 5 years of NASA POWER rainfall, frost, and root-zone soil
              wetness, compare your Top 3 rotation plans, and track every season in one workspace.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button
                type="button"
                onClick={() => navigate('auth', { authTab: 'register' })}
                className="btn-harvest text-sm sm:text-[15px]"
              >
                Register Your Farm
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('auth', { authTab: 'login' })}
                className="btn-outline-ink text-sm sm:text-[15px]"
              >
                Login / Demo Farm
              </button>
            </div>

            {/* Crisp Data Metrics Strip */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#E5E3DB] max-w-lg">
              <div>
                <div className="text-2xl font-extrabold text-[#00873A] font-mono-tech">5 yr</div>
                <div className="text-xs font-medium text-[#6F6F6F] mt-0.5">
                  Daily NASA POWER series
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[#111111] font-mono-tech">Top 3</div>
                <div className="text-xs font-medium text-[#6F6F6F] mt-0.5">
                  Scored rotation plans
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[#111111] font-mono-tech">42+</div>
                <div className="text-xs font-medium text-[#6F6F6F] mt-0.5">
                  Countries &amp; climates
                </div>
              </div>
            </div>
          </div>

          {/* Right Framed Editorial Carousel with Signature Offset Geometric Accents */}
          <div className="lg:col-span-6 relative">
            {/* Offset geometric accent blocks matching transform-rotations.eu */}
            <div
              className="hidden sm:block absolute -top-4 -left-4 w-20 h-20 bg-[#92D500] rounded-2xl pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="hidden sm:block absolute -bottom-4 -right-4 w-28 h-28 bg-[#EBB40E] rounded-2xl pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative z-10 rounded-[22px] overflow-hidden border border-[#111111]/15 shadow-[0_24px_54px_rgba(17,17,17,0.18)] bg-[#111111]">
              <div className="relative aspect-[16/11] w-full overflow-hidden">
                <img
                  key={currentSlide.image}
                  src={currentSlide.image}
                  alt={currentSlide.title}
                  className="w-full h-full object-cover animate-fade-in"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/88 via-[#111111]/18 to-transparent" />

                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFEFB]/95 text-[#111111] text-[11px] font-bold shadow-sm">
                    <Compass className="w-3.5 h-3.5 text-[#00873A]" />
                    {currentSlide.tag}
                  </span>
                </div>

                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg sm:text-[1.35rem] font-extrabold text-white leading-snug">
                      {currentSlide.title}
                    </h2>
                    <div className="text-xs font-mono-tech text-[#92D500]">
                      {currentSlide.meta}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setSlideIdx((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
                      }
                      aria-label="Previous slide"
                      className="btn-circle !w-10 !h-10 bg-[#FFFEFB] text-[#111111] hover:bg-[#EBB40E]"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length)}
                      aria-label="Next slide"
                      className="btn-circle !w-10 !h-10 bg-[#EBB40E] text-[#111111] hover:bg-[#FFFEFB]"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Minimal Slide Progress Strip */}
              <div className="bg-[#111111] px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {HERO_SLIDES.map((s, idx) => (
                    <button
                      key={s.image}
                      type="button"
                      onClick={() => setSlideIdx(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === slideIdx ? 'w-9 bg-[#EBB40E]' : 'w-2.5 bg-white/30 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-mono-tech text-white/70">
                  0{slideIdx + 1} / 0{HERO_SLIDES.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION — Signature Warm Limestone + Concentric White Orbital Rings */}
      <section id="features" className="py-16 sm:py-22 bg-[#F5F4F0] bg-orbital-rings relative">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#00873A]">
                Platform Capabilities
              </div>
              <h2 className="text-3xl sm:text-[2.5rem] font-extrabold text-[#111111] leading-[1.12]">
                Five tools built around your field.
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsDataSourcesOpen(true)}
              className="btn-outline-ink !min-h-[42px] text-xs sm:text-sm self-start md:self-auto"
            >
              <Satellite className="w-4 h-4 text-[#00873A]" />
              View Live Data Sources
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURE_CARDS.map((card, index) => (
              <div
                key={card.title}
                className={`surface-card p-6 sm:p-7 flex flex-col justify-between gap-6 hover:border-[#00873A] transition group ${
                  index === 0 ? 'lg:col-span-2' : ''
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: card.accent }}
                      >
                        {card.icon}
                      </span>
                      <span className="font-mono-tech text-xs font-bold text-[#979797]">
                        {card.num}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#F5F4F0] text-[#474747] border border-[#E5E3DB]">
                      {card.tag}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold text-[#111111]">{card.title}</h3>
                    <p className="text-sm text-[#474747] leading-relaxed">{card.summary}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('auth', { authTab: 'register' })}
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#00873A] group-hover:text-[#111111] transition cursor-pointer self-start"
                >
                  Open in workspace
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT US SECTION — Signature Forest-Green Editorial Architecture */}
      <section id="about" className="py-16 sm:py-22 bg-[#FFFEFB]">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8">
          <div className="rounded-[28px] bg-[#00873A] text-white overflow-hidden relative grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="absolute inset-0 bg-survey-pattern-light opacity-35 pointer-events-none" />
            <div
              className="hidden lg:block absolute -left-24 -bottom-28 w-[360px] h-[360px] rounded-full border-[22px] border-white/10 pointer-events-none"
              aria-hidden="true"
            />

            {/* Editorial Photo Side */}
            <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-[430px]">
              <img
                src="/images/about-sustainable-farm.jpg"
                alt="Diversified crop rotation fields"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-[#EBB40E] text-[#111111] px-4 py-2 rounded-full text-xs font-extrabold shadow">
                NASA POWER · SMAP L4 · MODIS · SRTM
              </div>
            </div>

            {/* Crisp Editorial Copy Side */}
            <div className="lg:col-span-7 relative z-10 p-8 sm:p-12 flex flex-col justify-center space-y-5">
              <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#92D500]">
                About Tadawol
              </div>
              <h2 className="text-3xl sm:text-[2.35rem] font-extrabold text-white leading-[1.14]">
                Open Earth observation turned into practical seasonal decisions.
              </h2>
              <p className="text-sm sm:text-base text-white/90 leading-relaxed max-w-2xl">
                Tadawol connects directly to NASA POWER daily agroclimatology (1981–present)
                alongside Earth Engine SMAP L4 soil moisture, MODIS NDVI bare-field tracking, and
                SRTM 30 m terrain slope. Each metric is scored transparently against your soil,
                water setup, and recent crops so you can compare multi-year rotations without
                guesswork.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('auth', { authTab: 'register' })}
                  className="btn-harvest text-sm"
                >
                  Start Your Farm Profile
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsDataSourcesOpen(true)}
                  className="btn-pill bg-white/12 hover:bg-white hover:text-[#111111] text-white border border-white/35 text-sm"
                >
                  Inspect Datasets &amp; Limitations
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Editorial Footer */}
      <footer className="bg-[#111111] text-white py-12">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-white/15">
          <div className="md:col-span-5 space-y-3">
            <BrandMark darkText={false} subtitle="Crop Rotation & EO" />
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed max-w-sm">
              Global crop rotation planner powered by NASA POWER daily climate records, Earth
              Engine layers, and a parcel-aware AI advisor.
            </p>
          </div>

          <div className="md:col-span-2 space-y-2.5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#EBB40E]">
              Projects
            </div>
            <ul className="space-y-1.5 text-xs sm:text-sm text-white/80">
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo('features')}
                  className="hover:text-[#92D500] cursor-pointer"
                >
                  Rotation Advisor
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('auth', { authTab: 'register' })}
                  className="hover:text-[#92D500] cursor-pointer"
                >
                  Field Mapping
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('auth', { authTab: 'login' })}
                  className="hover:text-[#92D500] cursor-pointer"
                >
                  5-Year Forecast
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-2.5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#EBB40E]">
              Data Sources
            </div>
            <ul className="space-y-1.5 text-xs sm:text-sm text-white/80">
              <li>
                <button
                  type="button"
                  onClick={() => setIsDataSourcesOpen(true)}
                  className="hover:text-[#92D500] text-left cursor-pointer"
                >
                  NASA POWER API
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsDataSourcesOpen(true)}
                  className="hover:text-[#92D500] text-left cursor-pointer"
                >
                  SMAP · MODIS · SRTM
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsDataSourcesOpen(true)}
                  className="hover:text-[#92D500] text-left font-bold text-[#92D500] cursor-pointer"
                >
                  Full Data Spec →
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-2.5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#EBB40E]">
              Contact Us
            </div>
            <div className="space-y-1.5 text-xs sm:text-sm text-white/80">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#92D500]" />
                <span>contact@tadawol-agro.org</span>
              </div>
              <div className="text-xs text-white/60">
                Open-source AgriTech · contract.json API ready
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/55">
          <span>© 2026 Tadawol</span>
          <button
            type="button"
            onClick={() => setIsDataSourcesOpen(true)}
            className="text-[#92D500] hover:underline cursor-pointer"
          >
            Satellite &amp; Dataset Attribution
          </button>
        </div>
      </footer>

      <DataSourcesModal
        open={isDataSourcesOpen}
        onClose={() => setIsDataSourcesOpen(false)}
        liveNasaStatus="nasa-power-live"
      />
    </div>
  );
};
