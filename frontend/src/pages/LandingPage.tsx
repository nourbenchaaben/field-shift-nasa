import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Compass,
  LineChart,
  Map as MapIcon,
  Menu,
  Satellite,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
  Mail,
  MapPin,
  Globe,
} from 'lucide-react';
import { BrandMark } from '../components/BrandMark';
import { useFarm } from '../context/FarmContext';

interface HeroSlide {
  image: string;
  badge: string;
  title: string;
  caption: string;
  telemetry: { label: string; value: string }[];
}

const HERO_SLIDES: HeroSlide[] = [
  {
    image: '/images/hero-crop-rotation.jpg',
    badge: '4-Zone AI Crop Rotation',
    title: 'Precision Multi-Season Rotation Layout',
    caption:
      'Subdivide your land into S1–S4 plots to cycle legumes, cereals, and deep-rooted break crops—restoring natural nitrogen every season.',
    telemetry: [
      { label: 'Nitrogen Fixation', value: '+54 kg/ha' },
      { label: 'Yield Uplift', value: '+18.4%' },
    ],
  },
  {
    image: '/images/hero-smart-farming.jpg',
    badge: 'NASA SMAP + Local Sensors',
    title: 'Real-Time Satellite & Ground Fusion',
    caption:
      'Blend live NASA orbital soil moisture and MODIS thermal passes with on-field weather stations and drip irrigation telemetry.',
    telemetry: [
      { label: 'SMAP Moisture', value: '31.4%' },
      { label: 'Water Saved', value: '-24%' },
    ],
  },
  {
    image: '/images/hero-satellite-mapping.jpg',
    badge: 'Farmer-in-the-Loop AI',
    title: 'Geospatial Field Intelligence in Your Hands',
    caption:
      'Track multi-year field history, test scenarios with Tadawol AI, and approve every strategy change before it hits the soil.',
    telemetry: [
      { label: 'NDVI Health', value: '0.78' },
      { label: '5-Yr Sustainability', value: '91 / 100' },
    ],
  },
];

const FEATURES = [
  {
    num: '01',
    title: 'AI Assistant & Roadmap',
    description:
      'Personalized 4-season crop rotation strategies and interactive agronomy guidance tailored to your soil and climate.',
    icon: Bot,
    accent: '#EBB40E',
    tag: 'Conversational AI',
  },
  {
    num: '02',
    title: 'Interactive Farm Mapping',
    description:
      'Pinpoint geolocation, draw custom parcel boundaries, and manage distinct S1–S4 plots with crisp satellite layers.',
    icon: MapIcon,
    accent: '#00873A',
    tag: 'Plot-Level GIS',
  },
  {
    num: '03',
    title: 'Real-Time Visualization',
    description:
      'Live field analytics fusing NASA SMAP moisture, MODIS heat, and NDVI indices with local ground sensors.',
    icon: LineChart,
    accent: '#44BE7E',
    tag: 'NASA + Local Data',
  },
  {
    num: '04',
    title: 'Smart Decision Support',
    description:
      'Data-backed crop recommendations with explicit farmer-in-the-loop approval before recalculating field plans.',
    icon: ShieldCheck,
    accent: '#92D500',
    tag: 'Human-in-the-Loop',
  },
  {
    num: '05',
    title: 'Future Predictions',
    description:
      'Multi-season and 5-year forecasting of soil fertility, water efficiency, crop yield, and sustainability scores.',
    icon: TrendingUp,
    accent: '#111111',
    tag: '5-Year Forecast',
  },
];

const PILOT_PROJECTS = [
  {
    region: 'Medjerda Valley · Tunisia',
    hectares: '420 ha · 14 Farms',
    focus: 'Durum wheat–chickpea–sorghum drought resilience with NASA SMAP drip triggers',
    result: '-26% irrigation use · +19% grain protein stability',
  },
  {
    region: 'Loire Atlantic Basin · France',
    hectares: '680 ha · 19 Farms',
    focus: 'Multi-species cover crop cycling and biological nitrogen restoration on silt loam',
    result: '-38% synthetic urea · +0.62% topsoil organic matter',
  },
  {
    region: 'Guadalquivir Plains · Spain',
    hectares: '510 ha · 11 Farms',
    focus: 'High-heat MODIS stress mitigation and bio-fumigant canola pest breaks',
    result: '+21% yield resilience during +2.1°C heat anomalies',
  },
];

export const LandingPage: React.FC = () => {
  const { navigate, isAuthenticated, showToast } = useFarm();
  const [slideIdx, setSlideIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'projects' | 'contact' | null>(null);
  const [contactSent, setContactSent] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const currentSlide = HERO_SLIDES[slideIdx];

  const prevSlide = () => setSlideIdx((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const nextSlide = () => setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSent(true);
    showToast('Message sent to the Tadawol agronomy team.');
    setTimeout(() => {
      setContactSent(false);
      setContactForm({ name: '', email: '', message: '' });
      setActiveModal(null);
    }, 1500);
  };

  return (
    <div id="homepage" className="min-h-screen bg-white text-[#111111] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E7E5DF]">
        <div className="max-w-[1300px] mx-auto px-5 sm:px-8 h-[76px] flex items-center justify-between gap-6">
          <button
            type="button"
            onClick={() => scrollToSection('homepage')}
            className="cursor-pointer focus:outline-none"
          >
            <BrandMark size={36} subtitle="Smart AgriTech" />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-[15px] font-medium">
            <button
              type="button"
              onClick={() => scrollToSection('homepage')}
              className="text-[#111111] hover:text-[#00873A] transition cursor-pointer"
            >
              Homepage
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="text-[#474747] hover:text-[#00873A] transition cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="text-[#474747] hover:text-[#00873A] transition cursor-pointer"
            >
              About Us
            </button>
            <div className="h-5 w-px bg-[#D9D9D9]" />
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate('dashboard')}
                className="btn-harvest !min-h-[40px] !px-5 !py-2 text-sm"
              >
                Open Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('auth', { authTab: 'login' })}
                  className="px-4 py-2 rounded-full text-[15px] font-semibold text-[#111111] hover:bg-[#F5F4F0] transition cursor-pointer"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => navigate('auth', { authTab: 'register' })}
                  className="btn-harvest !min-h-[40px] !px-6 !py-2 text-sm"
                >
                  Register
                </button>
              </div>
            )}
          </nav>

          {/* Mobile Drawer Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="md:hidden w-10 h-10 rounded-full bg-[#F5F4F0] border border-[#D9D9D9] flex items-center justify-center cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#FFFEFB] border-b border-[#D9D9D9] px-6 py-5 space-y-3">
            <button
              type="button"
              onClick={() => scrollToSection('homepage')}
              className="block w-full text-left py-2 font-semibold text-[#111111]"
            >
              Homepage
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="block w-full text-left py-2 font-medium text-[#474747]"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="block w-full text-left py-2 font-medium text-[#474747]"
            >
              About Us
            </button>
            <div className="pt-3 border-t border-[#E7E5DF] flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('auth', { authTab: 'login' });
                }}
                className="btn-outline-ink w-full !min-h-[42px]"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('auth', { authTab: 'register' });
                }}
                className="btn-harvest w-full !min-h-[42px]"
              >
                Register
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section — Editorial split inspired by transform-rotations.eu */}
      <section className="relative overflow-hidden bg-[#FFFEFB] pt-10 pb-20 lg:pt-16 lg:pb-24">
        {/* Subtle decorative concentric arc on top-left */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-44 -left-44 w-[520px] h-[520px] rounded-full border-[26px] border-[#F5F4F0]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-52 -right-32 w-[460px] h-[460px] rounded-full border-[22px] border-[#F5F4F0]"
        />

        <div className="relative max-w-[1300px] mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#F5F4F0] border border-[#D9D9D9] px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#111111]">
              <span className="w-2 h-2 rounded-full bg-[#00873A]" />
              <span>NASA Satellite Data · Local Metrics · Agronomy AI</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-[3.2rem] sm:text-[4.1rem] lg:text-[4.5rem] font-extrabold tracking-[-0.035em] leading-[1.03] text-[#111111]">
                Tadawol
                <span className="inline-block w-3.5 h-3.5 bg-[#EBB40E] ml-2 align-baseline" />
              </h1>
              <p className="text-[1.08rem] sm:text-[1.15rem] text-[#474747] leading-[1.65] font-normal max-w-[540px]">
                An AI- and satellite-data-driven smart agriculture platform that combines{' '}
                <strong className="font-semibold text-[#111111]">NASA Earth observation</strong>,{' '}
                <strong className="font-semibold text-[#111111]">local farm metrics</strong>, and{' '}
                <strong className="font-semibold text-[#111111]">agronomy intelligence</strong> to
                plan optimal crop rotations, monitor real-time fields, and track multi-season farm
                history.
              </p>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button
                type="button"
                onClick={() => navigate(isAuthenticated ? 'dashboard' : 'auth', { authTab: 'register' })}
                className="btn-harvest"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="btn-outline-ink"
              >
                Explore Features
              </button>
            </div>

            {/* Crisp Editorial Proof Strip */}
            <div className="pt-6 border-t border-[#E6E4DD] grid grid-cols-3 gap-4 max-w-[480px]">
              <div>
                <div className="font-mono-tech text-xl sm:text-2xl font-bold text-[#00873A]">
                  +22%
                </div>
                <div className="text-xs text-[#6F6F6F] mt-0.5 leading-snug">
                  Multi-year soil fertility recovery
                </div>
              </div>
              <div>
                <div className="font-mono-tech text-xl sm:text-2xl font-bold text-[#111111]">
                  -28%
                </div>
                <div className="text-xs text-[#6F6F6F] mt-0.5 leading-snug">
                  Water saved via SMAP sync
                </div>
              </div>
              <div>
                <div className="font-mono-tech text-xl sm:text-2xl font-bold text-[#111111]">
                  4-Zone
                </div>
                <div className="text-xs text-[#6F6F6F] mt-0.5 leading-snug">
                  S1–S4 farmer-approved plans
                </div>
              </div>
            </div>
          </div>

          {/* Right Column — Interactive Image Slider / Carousel with transform-rotations.eu geometric framing */}
          <div
            className="lg:col-span-7 relative pb-10 pr-4 sm:pr-8 pl-2 sm:pl-6"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Signature offset Forest Green architectural backdrop block */}
            <div
              aria-hidden="true"
              className="absolute bottom-2 left-0 right-10 top-10 bg-[#00873A] rounded-none"
            />
            {/* Signature Prairie Lime top-right square accent */}
            <div
              aria-hidden="true"
              className="absolute -top-3 right-2 sm:right-4 w-16 h-16 sm:w-20 sm:h-20 bg-[#92D500] z-10"
            />
            {/* Signature Golden Yellow bottom-right accent block */}
            <div
              aria-hidden="true"
              className="absolute bottom-0 right-0 sm:right-2 w-24 h-24 sm:w-28 sm:h-28 bg-[#EBB40E] z-0"
            />

            {/* Main Carousel Viewport */}
            <div className="relative z-10 bg-[#111111] overflow-hidden border border-[#111111]/15 shadow-[0_20px_50px_rgba(17,17,17,0.14)]">
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                {HERO_SLIDES.map((slide, idx) => (
                  <img
                    key={slide.image}
                    src={slide.image}
                    alt={slide.title}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
                      idx === slideIdx ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                    }`}
                  />
                ))}

                {/* Subtle editorial gradient only along bottom for crisp legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/85 via-[#111111]/20 to-transparent" />

                {/* Top-left Satellite Slide Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#FFFEFB]/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-[#D9D9D9]">
                  <Satellite className="w-3.5 h-3.5 text-[#00873A]" />
                  <span className="text-xs font-bold text-[#111111] tracking-tight">
                    {currentSlide.badge}
                  </span>
                </div>

                {/* Top-right Live Telemetry Pills */}
                <div className="hidden sm:flex absolute top-4 right-14 gap-2">
                  {currentSlide.telemetry.map((t) => (
                    <div
                      key={t.label}
                      className="bg-[#111111]/85 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg border border-white/15"
                    >
                      <div className="text-[10px] uppercase tracking-wider text-white/70">
                        {t.label}
                      </div>
                      <div className="font-mono-tech text-xs font-bold text-[#92D500]">
                        {t.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Caption Overlay + Prev/Next Controls */}
                <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="max-w-[480px] text-white space-y-1">
                    <div className="font-mono-tech text-[11px] uppercase tracking-widest text-[#EBB40E] font-semibold">
                      0{slideIdx + 1} / 0{HERO_SLIDES.length}
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold leading-snug text-white">
                      {currentSlide.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                      {currentSlide.caption}
                    </p>
                  </div>

                  {/* Signature circular prev/next carousel arrows */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={prevSlide}
                      aria-label="Previous slide"
                      className="w-10 h-10 rounded-full bg-[#F5F4F0] text-[#111111] border border-[#D9D9D9] hover:bg-[#EBB40E] hover:border-[#EBB40E] flex items-center justify-center transition cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextSlide}
                      aria-label="Next slide"
                      className="w-10 h-10 rounded-full bg-[#EBB40E] text-[#111111] border border-[#EBB40E] hover:bg-[#111111] hover:text-white hover:border-[#111111] flex items-center justify-center transition cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Slide Progress Strip */}
              <div className="bg-[#FFFEFB] px-5 py-3 flex items-center justify-between border-t border-[#E5E3DC]">
                <div className="flex items-center gap-2">
                  {HERO_SLIDES.map((s, idx) => (
                    <button
                      key={s.title}
                      type="button"
                      onClick={() => setSlideIdx(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === slideIdx
                          ? 'w-9 bg-[#00873A]'
                          : 'w-2.5 bg-[#D1D1D1] hover:bg-[#979797]'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-[#6F6F6F]">
                  Live NASA SMAP · MODIS · Sentinel-2 Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section — 5-card horizontal feature grid on transform-rotations.eu warm limestone */}
      <section
        id="features"
        className="relative bg-[#F5F4F0] bg-orbital-rings py-20 lg:py-24 border-y border-[#E5E3DC]"
      >
        <div className="max-w-[1300px] mx-auto px-5 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-[660px] space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#00873A]">
                <Compass className="w-4 h-4" />
                Platform Approach
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#111111]">
                Five pillars built for{' '}
                <span className="underline decoration-[#EBB40E] decoration-4 underline-offset-4">
                  climate-resilient
                </span>{' '}
                crop rotations
              </h2>
            </div>
            <p className="text-[15px] text-[#474747] max-w-[400px] leading-relaxed">
              Every insight blends orbital remote sensing with your on-farm reality—keeping farmers
              in full command of each seasonal decision.
            </p>
          </div>

          {/* 5-Card Horizontal Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.num}
                  onClick={() =>
                    navigate(isAuthenticated ? 'dashboard' : 'auth', { authTab: 'register' })
                  }
                  className="group relative bg-white border border-[#DEDCD5] p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-[#111111] hover:shadow-[0_14px_28px_rgba(17,17,17,0.08)] cursor-pointer"
                >
                  {/* Signature color strip */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: feat.accent }}
                  />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between pt-1">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center border border-[#E5E3DC] bg-[#F5F4F0] group-hover:bg-[#EBB40E] transition-colors"
                      >
                        <Icon className="w-5 h-5 text-[#111111]" />
                      </div>
                      <span className="font-mono-tech text-xs font-bold text-[#6F6F6F]">
                        {feat.num}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#00873A]">
                        {feat.tag}
                      </span>
                      <h3 className="text-[17px] font-bold text-[#111111] leading-snug">
                        {feat.title}
                      </h3>
                      <p className="text-[13.5px] text-[#474747] leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#F1F0EE] flex items-center justify-between text-xs font-bold text-[#111111]">
                    <span className="group-hover:text-[#00873A] transition-colors">
                      Explore module
                    </span>
                    <span className="w-7 h-7 rounded-full bg-[#F5F4F0] group-hover:bg-[#111111] group-hover:text-white flex items-center justify-center transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Us Section — Signature transform-rotations.eu asymmetric Forest Green + overlapping image split */}
      <section id="about" className="py-20 lg:py-28 bg-white overflow-hidden">
        <div className="max-w-[1300px] mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch gap-0">
            {/* Forest Green Editorial Mission Column */}
            <div className="lg:col-span-6 bg-[#00873A] text-white p-8 sm:p-12 lg:p-14 relative overflow-hidden flex flex-col justify-between">
              {/* Subtle survey pattern */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-survey-pattern-light opacity-50 pointer-events-none"
              />
              {/* Large white circular ring accent */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-36 -left-36 w-[340px] h-[340px] rounded-full border-[22px] border-white/15"
              />

              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 bg-white/15 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-[#92D500]">
                  <Sparkles className="w-3.5 h-3.5" />
                  About Tadawol
                </div>

                <h2 className="text-3xl sm:text-[2.35rem] font-bold leading-tight text-white">
                  Empowering sustainable, data-driven farming from orbit to root zone.
                </h2>

                <p className="text-[15.5px] text-white/90 leading-relaxed">
                  <strong>Tadawol</strong> (meaning <em>cycles &amp; renewal</em>) was created to
                  support farmers adapting to erratic rainfall, rising soil heat, and declining
                  organic fertility. Rather than replacing agricultural wisdom with black-box
                  automation, Tadawol unites <strong>NASA Earth science</strong>,{' '}
                  <strong>local soil telemetry</strong>, and <strong>explainable AI</strong> so
                  every crop rotation is transparent, verifiable, and farmer-approved.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {[
                    'Co-designed with Mediterranean & European agronomists',
                    'Zero synthetic lock-in — prioritizes biological soil recovery',
                    'Full multi-year farm memory linking weather & crop yields',
                    'Explicit human-in-the-loop sign-off on every AI suggestion',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2.5 text-sm text-white/95">
                      <CheckCircle2 className="w-4 h-4 text-[#92D500] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-10 mt-9 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(isAuthenticated ? 'dashboard' : 'auth', { authTab: 'register' })}
                  className="btn-harvest"
                >
                  Map Your Farm Free
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('projects')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/40 text-sm font-semibold text-white hover:bg-white hover:text-[#111111] transition cursor-pointer"
                >
                  View Pilot Projects
                </button>
              </div>
            </div>

            {/* Right Asymmetric Image Frame with Prairie & Harvest Geometric Blocks */}
            <div className="lg:col-span-6 relative bg-[#F5F4F0] p-6 sm:p-10 lg:p-0 flex items-center">
              <div className="relative w-full h-full min-h-[340px] lg:min-h-[500px]">
                {/* Prairie Lime upper-right square */}
                <div
                  aria-hidden="true"
                  className="hidden sm:block absolute top-0 right-0 w-20 h-20 bg-[#92D500] z-20"
                />
                {/* Golden Harvest lower-right overlapping block */}
                <div
                  aria-hidden="true"
                  className="hidden sm:block absolute -bottom-6 right-0 w-32 h-32 bg-[#EBB40E] z-20"
                />
                {/* Editorial photography */}
                <div className="relative w-full h-full overflow-hidden lg:-mt-8 lg:h-[calc(100%+2rem)]">
                  <img
                    src="/images/about-sustainable-farm.jpg"
                    alt="Farmer examining fertile dark loamy soil with healthy green seedling"
                    className="w-full h-full object-cover"
                  />
                  {/* Floating stat overlay */}
                  <div className="absolute bottom-5 left-5 right-5 sm:right-36 bg-[#FFFEFB]/95 backdrop-blur-sm border border-[#D9D9D9] p-4 shadow-md">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#00873A]">
                          Verified Regenerative Impact
                        </div>
                        <div className="text-sm font-bold text-[#111111] mt-0.5">
                          +0.78% Soil Organic Matter over 4 Rotation Cycles
                        </div>
                      </div>
                      <div className="font-mono-tech text-lg font-extrabold text-[#111111] bg-[#EBB40E] px-3 py-1.5 rounded-lg shrink-0">
                        4-YR
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Footer styled after transform-rotations.eu */}
      <footer className="mt-auto bg-[#F5F4F0] border-t border-[#D9D9D9]">
        {/* Signature grey-sky top footprint strip */}
        <div className="bg-[#E5E3DC] py-4 px-5 text-center text-sm font-medium text-[#111111]">
          <div className="max-w-[1300px] mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <span>Powered by NASA SMAP · MODIS · Sentinel-2 Open Earth Data</span>
            <span className="hidden sm:inline text-[#979797]">•</span>
            <span className="text-[#00873A] font-semibold">
              Built for Resilient, Sustainable Agriculture
            </span>
          </div>
        </div>

        <div className="max-w-[1300px] mx-auto px-5 sm:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-5 space-y-3">
              <BrandMark size={34} subtitle="Smart Crop Rotation" />
              <p className="text-sm text-[#474747] max-w-[380px] leading-relaxed">
                AI- and satellite-driven crop rotation planning, live telemetry, farm history, and
                5-year regenerative forecasting for modern growers.
              </p>
            </div>

            <div className="md:col-span-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#111111]">
                Explore &amp; Connect
              </h4>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal('projects')}
                  className="px-4 py-2 rounded-full bg-white border border-[#D9D9D9] text-sm font-semibold text-[#111111] hover:bg-[#111111] hover:text-white hover:border-[#111111] transition cursor-pointer"
                >
                  Projects
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('contact')}
                  className="px-4 py-2 rounded-full bg-[#EBB40E] border border-[#EBB40E] text-sm font-semibold text-[#111111] hover:bg-[#111111] hover:text-white hover:border-[#111111] transition cursor-pointer"
                >
                  Contact Us
                </button>
              </div>
            </div>

            <div className="md:col-span-3 space-y-2 text-sm text-[#474747]">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#111111]">
                Quick Access
              </h4>
              <div className="flex flex-col items-start gap-1.5">
                <button
                  type="button"
                  onClick={() => navigate('auth', { authTab: 'login' })}
                  className="hover:text-[#00873A] font-medium cursor-pointer"
                >
                  Farmer Login →
                </button>
                <button
                  type="button"
                  onClick={() => navigate('auth', { authTab: 'register' })}
                  className="hover:text-[#00873A] font-medium cursor-pointer"
                >
                  Register New Farm →
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[#D9D9D9] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6F6F6F]">
            <span>&copy; 2026 Tadawol Smart Agriculture Platform. All rights reserved.</span>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => setActiveModal('projects')}
                className="underline hover:text-[#111111] cursor-pointer"
              >
                Projects
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('contact')}
                className="underline hover:text-[#111111] cursor-pointer"
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Projects Modal */}
      {activeModal === 'projects' && (
        <div
          className="fixed inset-0 z-50 bg-[#111111]/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-[#FFFEFB] border border-[#D9D9D9] max-w-2xl w-full p-6 sm:p-8 relative shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#F5F4F0] hover:bg-[#111111] hover:text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#00873A] mb-2">
              <Globe className="w-4 h-4" />
              Field Pilots &amp; Research Projects
            </div>
            <h3 className="text-2xl font-bold text-[#111111] mb-5">
              Tadawol Pilot Regions
            </h3>
            <div className="space-y-3.5">
              {PILOT_PROJECTS.map((p) => (
                <div
                  key={p.region}
                  className="bg-[#F5F4F0] border border-[#DFDDD6] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#00873A]" />
                      <span className="font-bold text-[#111111]">{p.region}</span>
                      <span className="text-xs font-mono-tech bg-white px-2 py-0.5 border border-[#D9D9D9]">
                        {p.hectares}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#474747]">{p.focus}</p>
                    <div className="text-xs font-semibold text-[#00873A]">{p.result}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  navigate('auth', { authTab: 'register' });
                }}
                className="btn-harvest !min-h-[42px]"
              >
                Join as a Pilot Farm
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Us Modal */}
      {activeModal === 'contact' && (
        <div
          className="fixed inset-0 z-50 bg-[#111111]/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-[#FFFEFB] border border-[#D9D9D9] max-w-lg w-full p-6 sm:p-8 relative shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#F5F4F0] hover:bg-[#111111] hover:text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#00873A] mb-2">
              <Mail className="w-4 h-4" />
              Agronomy Support Desk
            </div>
            <h3 className="text-2xl font-bold text-[#111111] mb-2">Contact Us</h3>
            <p className="text-sm text-[#474747] mb-5">
              Questions about satellite calibration, cooperative onboarding, or research partnerships?
            </p>
            {contactSent ? (
              <div className="bg-[#E3F5EB] border border-[#00873A] p-5 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#00873A] mx-auto" />
                <div className="font-bold text-[#111111]">Thank you! Your inquiry was received.</div>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#474747] mb-1.5">
                    Your Name
                  </label>
                  <input
                    required
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Amine Ben Salem"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D1D1D1] text-sm focus:outline-none focus:border-[#00873A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#474747] mb-1.5">
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="farmer@example.com"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D1D1D1] text-sm focus:outline-none focus:border-[#00873A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#474747] mb-1.5">
                    Message
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={contactForm.message}
                    onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Tell us about your farm region, acreage, or goals..."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D1D1D1] text-sm focus:outline-none focus:border-[#00873A]"
                  />
                </div>
                <button type="submit" className="btn-harvest w-full">
                  Send Message
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
