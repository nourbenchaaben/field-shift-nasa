import React, { useEffect, useMemo, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { ThemeToggleButton } from '../context/ThemeContext';
import { BrandMark } from '../components/BrandMark';
import { DataSourcesModal } from '../components/DataSourcesModal';
import {
  CoverageRegionKey,
  GlobalCoverageGlobe,
  REGION_GROUPS,
} from '../components/GlobalCoverageGlobe';
import { CountryOption, GLOBAL_COUNTRIES } from '../data/countries';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Compass,
  Globe,
  Mail,
  Map as MapIcon,
  MapPin,
  Satellite,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

const HERO_SLIDES = [
  {
    image: '/images/hero-solution-planning.jpg',
    tag: 'Decision Support',
    title: 'Smart Crop Rotation Planning',
  },
  {
    image: '/images/hero-solution-satellite-fields.jpg',
    tag: 'NASA Earth Data',
    title: 'Satellite Weather & Field Insights',
  },
  {
    image: '/images/hero-solution-soil.jpg',
    tag: 'Soil Health',
    title: 'Protect Soil with Cover & Rotation',
  },
  {
    image: '/images/hero-solution-water.jpg',
    tag: 'Water Conservation',
    title: 'Save Water in Changing Weather',
  },
  {
    image: '/images/hero-solution-pesticide-soil.jpg',
    tag: 'Natural Pest Control',
    title: 'Reduce Pesticide Usage & Improve Soil',
  },
];

const FEATURE_CARDS = [
  {
    num: '01',
    title: 'Smart Rotation Advisor',
    tag: 'AI + NASA',
    accent: '#00873A',
    icon: <Sparkles className="w-5 h-5" />,
    summary:
      'Explores crop rotation strategies matched to your local soil, rainfall, crop needs, and priorities to strengthen soil health and conserve water.',
  },
  {
    num: '02',
    title: 'Interactive Field Map',
    tag: 'Field Mapping',
    accent: '#44BE7E',
    icon: <MapIcon className="w-5 h-5" />,
    summary:
      'Pin your farm anywhere in the world, adjust field boundaries and size, manage multiple farms, and preview how crops shift across seasons.',
  },
  {
    num: '03',
    title: 'NASA Weather & Soil Data',
    tag: 'NASA Earth Data',
    accent: '#EBB40E',
    icon: <Satellite className="w-5 h-5" />,
    summary:
      'Tracks changing rainfall patterns, frost and extreme weather risks, soil moisture, and field cover using live NASA Earth observations.',
  },
  {
    num: '04',
    title: 'Farm Calendar & History',
    tag: 'Seasonal Planning',
    accent: '#92D500',
    icon: <CalendarDays className="w-5 h-5" />,
    summary:
      'Spot risky weather months early, schedule planting and harvest tasks by day, month, or year, and review past crop seasons in one place.',
  },
  {
    num: '05',
    title: '5-Year Farm Outlook',
    tag: 'Long-Term Resilience',
    accent: '#111111',
    icon: <TrendingUp className="w-5 h-5" />,
    summary:
      'Compare how each rotation strategy supports soil health, water savings, lower input costs, and yields across normal, dry, or wet years.',
  },
];

export const LandingPage: React.FC = () => {
  const { navigate, isAuthenticated, isDataSourcesOpen, setIsDataSourcesOpen } = useFarm();
  const [slideIdx, setSlideIdx] = useState(0);
  const [activeRegion, setActiveRegion] = useState<CoverageRegionKey>('all');
  const [focusedCountry, setFocusedCountry] = useState<CountryOption | null>(null);

  const visibleRegionCountries = useMemo(() => {
    const group = REGION_GROUPS.find((r) => r.key === activeRegion) ?? REGION_GROUPS[0];
    const codeSet = new Set(group.codes);
    const list = GLOBAL_COUNTRIES.filter((c) => codeSet.has(c.code));
    return activeRegion === 'all' ? list.slice(0, 16) : list;
  }, [activeRegion]);

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
      {/* Clean Modernist Top Header (transform-rotations.eu architecture) */}
      <header className="sticky top-0 z-40 bg-[#FFFEFB]/95 backdrop-blur-md border-b border-[#E6E4DC]">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 h-[82px] flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => scrollTo('homepage')}
            className="cursor-pointer"
          >
            <BrandMark subtitle="Smart Crop Rotation" />
          </button>

          <nav className="hidden md:flex items-center gap-8 text-[14px] font-semibold text-[#2E2E2E]">
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
              onClick={() => scrollTo('coverage')}
              className="hover:text-[#00873A] transition cursor-pointer"
            >
              Coverage
            </button>
            <button
              type="button"
              onClick={() => scrollTo('about')}
              className="hover:text-[#00873A] transition cursor-pointer"
            >
              About Us
            </button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <ThemeToggleButton />
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate('dashboard')}
                className="btn-harvest text-sm"
              >
                My Dashboard
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

      {/* HERO SECTION: Warm Paper Editorial Split with Signature Green Architectural Frame & Carousel */}
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
              Decision-Making Tool · AI &amp; NASA Data
            </div>

            <h1 className="text-[2.35rem] sm:text-[3.25rem] font-extrabold text-[#111111] leading-[1.09] tracking-[-0.03em]">
              Smarter crop rotations for healthier soil and resilient farms.
            </h1>

            <p className="text-[15px] sm:text-[17px] text-[#2E2E2E] leading-[1.6] max-w-xl">
              A decision-making tool powered by AI and NASA Earth observations, combined with your
              local soil, crop needs, and farm priorities to help you protect fields, conserve
              water, and adapt to changing weather.
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
                Login
              </button>
            </div>

            {/* Crisp Simplified Metrics Strip */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#E5E3DB] max-w-lg">
              <div>
                <div className="text-2xl font-extrabold text-[#00873A] font-mono-tech">5 yr</div>
                <div className="text-xs font-semibold text-[#3A3A3A] mt-0.5">
                  Crop rotation planning
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[#111111] font-mono-tech">AI + NASA</div>
                <div className="text-xs font-semibold text-[#3A3A3A] mt-0.5">
                  Decision-making tool
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[#111111] font-mono-tech">42+</div>
                <div className="text-xs font-semibold text-[#3A3A3A] mt-0.5">
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
                  <h2 className="text-lg sm:text-[1.4rem] font-extrabold text-white leading-snug">
                    {currentSlide.title}
                  </h2>

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

      {/* FEATURES SECTION: Signature Warm Limestone + Concentric White Orbital Rings */}
      <section id="features" className="py-16 sm:py-22 bg-[#F5F4F0] bg-orbital-rings relative">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 space-y-10">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#00873A]">
              Platform Capabilities
            </div>
            <h2 className="text-3xl sm:text-[2.5rem] font-extrabold text-[#111111] leading-[1.12]">
              Five tools built around your field.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURE_CARDS.map((card, index) => (
              <div
                key={card.title}
                className={`surface-card p-6 sm:p-7 flex flex-col justify-between gap-4 hover:border-[#00873A] transition ${
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
                      <span className="font-mono-tech text-xs font-bold text-[#555555]">
                        {card.num}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#F5F4F0] text-[#2E2E2E] border border-[#E5E3DB]">
                      {card.tag}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold text-[#111111]">{card.title}</h3>
                    <p className="text-sm text-[#2E2E2E] leading-relaxed">{card.summary}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GLOBAL COVERAGE SECTION: Continuously Rotating 3D Globe with Covered Farm Regions */}
      <section
        id="coverage"
        className="py-16 sm:py-22 bg-[#FFFEFB] bg-survey-pattern border-b border-[#E6E4DC]"
      >
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Direct Coverage Directory & Region Selector */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#00873A]">
                <Globe className="w-4 h-4" />
                Global Coverage
              </div>
              <h2 className="text-3xl sm:text-[2.45rem] font-extrabold text-[#111111] tracking-[-0.025em] leading-[1.12]">
                Locations we cover
              </h2>
              <p className="text-sm sm:text-base text-[#2E2E2E] leading-relaxed max-w-xl">
                42 preset farming regions across 6 continents, plus custom farm locations anywhere
                NASA Earth observations reach.
              </p>
            </div>

            {/* Region Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {REGION_GROUPS.map((group) => {
                const active = activeRegion === group.key;
                return (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => {
                      setActiveRegion(group.key);
                      setFocusedCountry(null);
                    }}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                      active
                        ? 'bg-[#00873A] text-white shadow-sm'
                        : 'bg-[#F5F4F0] text-[#2E2E2E] border border-[#D8D6CE] hover:border-[#111111] hover:text-[#111111]'
                    }`}
                  >
                    {group.label}
                  </button>
                );
              })}
            </div>

            {/* Interactive Country Chips (click to glide globe to pin) */}
            <div className="surface-card p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#3A3A3A]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#00873A]" />
                  {activeRegion === 'all'
                    ? 'Featured regions (42 total)'
                    : `${REGION_GROUPS.find((r) => r.key === activeRegion)?.label} (${visibleRegionCountries.length})`}
                </span>
                {focusedCountry && (
                  <button
                    type="button"
                    onClick={() => setFocusedCountry(null)}
                    className="text-[#00873A] hover:underline cursor-pointer normal-case font-bold"
                  >
                    Resume rotation
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {visibleRegionCountries.map((c) => {
                  const isFocused = focusedCountry?.code === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() =>
                        setFocusedCountry((prev) => (prev?.code === c.code ? null : c))
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                        isFocused
                          ? 'bg-[#EBB40E] text-[#111111] shadow-sm'
                          : 'bg-[#F5F4F0] text-[#111111] border border-[#E5E3DB] hover:border-[#00873A] hover:bg-[#E3F5EB]'
                      }`}
                    >
                      <span>{c.flag}</span>
                      <span>{c.name}</span>
                    </button>
                  );
                })}
                {activeRegion === 'all' && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-[#111111] text-[#92D500]">
                    +{GLOBAL_COUNTRIES.length - visibleRegionCountries.length} more
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs font-medium text-[#3A3A3A] pt-1">
              Drag the globe to explore or click any yellow pin.
            </p>
          </div>

          {/* Right Column: Continuously Rotating 3D Earth Globe */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-center">
            <div className="relative w-full max-w-[490px] rounded-[28px] bg-[#F5F4F0]/90 border border-[#DFDDD6] p-5 sm:p-7 shadow-[0_18px_42px_rgba(17,17,17,0.08)]">
              {/* Subtle signature corner geometric accent */}
              <div
                className="hidden sm:block absolute -top-3.5 -right-3.5 w-16 h-16 rounded-2xl bg-[#92D500] -z-10"
                aria-hidden="true"
              />
              <div
                className="hidden sm:block absolute -bottom-3.5 -left-3.5 w-20 h-14 rounded-2xl bg-[#EBB40E] -z-10"
                aria-hidden="true"
              />

              <GlobalCoverageGlobe
                activeRegion={activeRegion}
                focusedCountry={focusedCountry}
                onSelectCountry={(country) => setFocusedCountry(country)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT US SECTION: Signature Forest-Green Editorial Architecture */}
      <section id="about" className="py-16 sm:py-22 bg-[#F5F4F0]">
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
                alt="Farmers inspecting soil structure in a crop field"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-[#EBB40E] text-[#111111] px-4 py-2 rounded-full text-xs font-extrabold shadow">
                NASA Earth Data · Local Soil · AI
              </div>
            </div>

            {/* Crisp Editorial Copy Side */}
            <div className="lg:col-span-7 relative z-10 p-8 sm:p-12 flex flex-col justify-center space-y-5">
              <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#92D500]">
                About Tadawol
              </div>
              <h2 className="text-3xl sm:text-[2.35rem] font-extrabold text-white leading-[1.14]">
                Helping farmers protect soil, save water, and adapt to changing weather.
              </h2>
              <p className="text-sm sm:text-base text-white/90 leading-relaxed max-w-2xl">
                Shifting temperatures, changing rainfall patterns, water shortages, extreme weather,
                and declining soil health make choosing the right crop rotation harder than ever.
                Tadawol combines NASA Earth observations with your local soil information, crop
                characteristics, and priorities so you can explore rotation strategies that
                strengthen soil health and build long-term resilience.
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
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Editorial Footer */}
      <footer className="bg-[#111111] text-white py-12">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-white/15">
          <div className="md:col-span-6 space-y-3">
            <button
              type="button"
              onClick={() => scrollTo('homepage')}
              title="Back to Homepage"
              aria-label="Tadawol Back to Homepage"
              className="text-left cursor-pointer hover:opacity-90 transition"
            >
              <BrandMark darkText={false} subtitle="Smart Crop Rotation" />
            </button>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed max-w-sm">
              Decision-making tool for crop rotation powered by AI, NASA Earth observations, and
              local soil information.
            </p>
          </div>

          <div className="md:col-span-3 space-y-2.5">
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
              <div className="text-xs text-white/75">
                Open-source AgriTech
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 pt-6 flex items-center justify-between text-xs text-white/70">
          <span>© 2026 Tadawol</span>
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
