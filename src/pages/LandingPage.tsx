import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Bike, 
  MapPin, 
  Clock, 
  Star, 
  CheckCircle, 
  Play, 
  ArrowRight, 
  Users,  
  Shield, 
  Smartphone,
  Lock,
  UserPlus,
  TrendingUp,
  Battery,
  Sparkles,
  Globe,
  Award,
  Target,
  Heart,
  Sun,
  Moon
} from 'lucide-react';
import { AIChat } from '../components/AIChat';
import { useTheme } from '../contexts/ThemeContext';
import { VideoModal } from '../components/VideoModal';

export const LandingPage: React.FC = () => {
  const [isVideoOpen, setIsVideoOpen] = React.useState(false);
  const { theme, toggleTheme } = useTheme();
  const heroRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    let raf = 0;
    const handle = (e: MouseEvent) => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width - 0.5;
        const my = (e.clientY - rect.top) / rect.height - 0.5;
        const nodes = el.querySelectorAll<HTMLElement>('.parallax-el');
        nodes.forEach((node) => {
          const speed = parseFloat(node.dataset.speed || '8');
          node.style.transform = `translate3d(${mx * speed}px, ${my * speed}px, 0)`;
        });
      });
    };
    el.addEventListener('mousemove', handle);
    return () => {
      el.removeEventListener('mousemove', handle);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  // Carousel state and handlers
  const slides = React.useMemo(() => (
    [
      {
        src: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&h=600&fit=crop&crop=center",
        alt: "Smart E-Bike",
        caption: "Smart E-Bikes — Available Now",
      },
      {
        src: "https://images.unsplash.com/photo-1630302215730-fa73a8158731?w=800&h=600&auto=format&fit=crop&q=60&fit=crop&crop=center",
        alt: "City Cruiser",
        caption: "City Cruisers — Comfortable Daily Commute",
      },
      {
        src: "https://images.unsplash.com/photo-1737530340337-7bd43684b5bc?w=800&auto=format&fit=crop&q=60&fit=crop&crop=center",
        alt: "Mountain E-Bike",
        caption: "Mountain E-Bikes — Conquer Campus Terrain",
      },
    ]
  ), []);
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartX = React.useRef<number | null>(null);
  const dragDeltaX = React.useRef(0);
  React.useEffect(() => {
    const id = setInterval(() => setCurrentSlide((s) => (s + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length]);
  const goTo = (idx: number) => setCurrentSlide((idx + slides.length) % slides.length);
  const next = () => goTo(currentSlide + 1);
  const prev = () => goTo(currentSlide - 1);
  const onTouchStart = (x: number) => { setIsDragging(true); dragStartX.current = x; dragDeltaX.current = 0; };
  const onTouchMove = (x: number) => { if (dragStartX.current !== null) { dragDeltaX.current = x - dragStartX.current; } };
  const onTouchEnd = () => { setIsDragging(false); if (Math.abs(dragDeltaX.current) > 50) { dragDeltaX.current < 0 ? next() : prev(); } dragStartX.current = null; dragDeltaX.current = 0; };
  React.useEffect(() => {
    const elements = document.querySelectorAll('.fade-in-up');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      elements.forEach((el) => (el as HTMLElement).classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return (
    <div className="min-h-screen theme-transition bg-gradient-to-br from-[#f9f9ff] to-[#f1f3f6] dark:from-[#1e1e2f] dark:to-[#2a2a3d] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-primary-500/30 to-secondary-500/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-secondary-500/30 to-info-500/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-primary-500/30 to-secondary-500/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Navigation */}
    <style>{`
        .btn-theme {
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          transform: perspective(1px) translateZ(0);
        }
        .btn-theme:hover {
          transform: scale(1.05);
          box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);
        }
        .feature-card {
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .feature-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
        }
        .nav-link {
          position: relative;
          transition: color 0.3s;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          background-color: #8b5cf6;
          transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .nav-link:hover::after {
          width: 100%;
        }
      `}</style>
      <style>{`
        .tooltip[data-tooltip] { position: relative; }
        .tooltip[data-tooltip]::after {
          content: attr(data-tooltip);
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(8px);
          background: #111827;
          color: #fff;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s, transform 0.2s;
          white-space: nowrap;
          z-index: 50;
        }
        .dark .tooltip[data-tooltip]::after { background: #374151; }
        .tooltip:hover::after { opacity: 1; transform: translateX(-50%) translateY(4px); }
      `}</style>
      <style>{`
        .carousel-track { will-change: transform; transition: transform 600ms cubic-bezier(0.22, 0.61, 0.36, 1); }
        .carousel-dot { width: 10px; height: 10px; border-radius: 9999px; background: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.9); }
        .carousel-dot.active { background: #fff; }
        .carousel-button { backdrop-filter: blur(6px); }
        @media (prefers-reduced-motion: reduce) {
          .btn-theme, .feature-card, .nav-link::after, .carousel-track { transition: none !important; }
          .animate-float, .animate-bounce { animation: none !important; }
        }
      `}</style>
      
  <nav className="relative z-10 bg-white text-[#1f2937] dark:text-white dark:navbar-dark-gradient backdrop-blur-xl border-b border-purple-500/10 dark:border-white/10 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 p-3 rounded-2xl shadow-lg glow-effect">
                <Bike className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-400 dark:via-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
                EcoRide+
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" aria-label="Features" data-tooltip="View features" className="nav-link tooltip hover:text-purple-600 dark:hover:text-cyan-200 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#1e1e2f]">Features</a>
              <a href="#how-it-works" aria-label="How it works" data-tooltip="See how it works" className="nav-link tooltip hover:text-purple-600 dark:hover:text-cyan-200 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#1e1e2f]">How it Works</a>
              <a href="#pricing" aria-label="Pricing" data-tooltip="View pricing" className="nav-link tooltip hover:text-purple-600 dark:hover:text-cyan-200 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#1e1e2f]">Pricing</a>
              <a href="#contact" aria-label="Contact" data-tooltip="Contact us" className="nav-link tooltip hover:text-purple-600 dark:hover:text-cyan-200 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#1e1e2f]">Contact</a>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-[var(--color-text-secondary-light)] hover:text-purple-600 hover:bg-purple-100 dark:text-[var(--color-text-secondary-dark)] dark:hover:text-white dark:hover:bg-purple-500/20 transition-colors"
                aria-label="Toggle theme"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <Link
                to="/auth/login"
                aria-label="Sign in"
                data-tooltip="Sign in"
                className="font-medium hover:opacity-90 tooltip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#1e1e2f]"
              >
                Sign In
              </Link>
              <Link
                to="/auth/register"
                aria-label="Get started"
                data-tooltip="Create account"
                className="btn-theme tooltip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#1e1e2f]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-left relative z-10">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 px-4 py-2 rounded-full mb-6 border border-cyan-400/30">
                <Sparkles className="h-4 w-4 text-purple-300" />
                <span className="text-sm font-medium text-purple-200">🚀 #1 Campus Transport Solution</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold text-[var(--color-text-primary-light)] dark:text-[var(--color-text-primary-dark)] mb-6 leading-tight">
                Smart Campus
                <span className="block bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                  Cycling
                </span>
                <span className="block text-3xl md:text-4xl text-slate-600 dark:text-indigo-300 mt-2">
                  Revolution
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl">
                Experience the future of sustainable transportation with our smart bike-sharing system. 
                Easy booking, real-time tracking, and eco-friendly mobility across campus.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <Link
                  to="/auth/register"
                  aria-label="Start riding today"
                  data-tooltip="Join and book instantly"
                  className="btn-theme tooltip px-8 py-4 rounded-xl font-semibold text-lg flex items-center space-x-2 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#1e1e2f]"
                >
                  <span>Start Riding Today</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <button onClick={() => setIsVideoOpen(true)} aria-label="Watch demo" data-tooltip="Watch product demo" className="btn-theme tooltip border-0 px-8 py-4 flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#1e1e2f]">
                  <Play className="h-5 w-5 text-purple-600" />
                  <span>Watch Demo</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-6 mt-8">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-300">500+ Active Users</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-300">25+ Stations</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative z-10">
                <div
                  className="w-full h-96 bg-gradient-to-br from-secondary-500/20 via-primary-500/20 to-info-500/20 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm border border-cyan-400/30"
                  onMouseDown={(e) => onTouchStart(e.clientX)}
                  onMouseMove={(e) => isDragging && onTouchMove(e.clientX)}
                  onMouseUp={onTouchEnd}
                  onMouseLeave={() => isDragging && onTouchEnd()}
                  onTouchStart={(e) => onTouchStart(e.touches[0].clientX)}
                  onTouchMove={(e) => onTouchMove(e.touches[0].clientX)}
                  onTouchEnd={onTouchEnd}
                  aria-roledescription="carousel"
                >
                  <div className="absolute inset-0">
                    <div
                      className="carousel-track flex h-full"
                      style={{ transform: `translate3d(-${currentSlide * 100}%, 0, 0)` }}
                    >
                      {slides.map((s, idx) => (
                        <div key={idx} className="min-w-full h-full relative">
                          <img
                            src={s.src}
                            alt={s.alt}
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220]/50 to-transparent"></div>
                          <div className="absolute bottom-4 left-4 right-4 text-white">
                            <div className="text-lg font-semibold drop-shadow">{s.caption}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center space-x-2">
                      {slides.map((_, i) => (
                        <button
                          key={i}
                          aria-label={`Go to slide ${i + 1}`}
                          className={`carousel-dot ${i === currentSlide ? 'active' : ''}`}
                          onClick={() => goTo(i)}
                        />
                      ))}
                    </div>
                    <div className="absolute inset-y-0 left-0 flex items-center">
                      <button aria-label="Previous slide" className="carousel-button m-3 p-2 rounded-full bg-white/30 hover:bg-white/50" onClick={prev}>
                        <ArrowRight className="h-5 w-5 rotate-180 text-white" />
                      </button>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <button aria-label="Next slide" className="carousel-button m-3 p-2 rounded-full bg-white/30 hover:bg-white/50" onClick={next}>
                        <ArrowRight className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full opacity-80 animate-bounce shadow-lg"></div>
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full opacity-80 animate-bounce shadow-lg" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 -left-8 w-16 h-16 bg-gradient-to-r from-lavender-400 to-purple-500 rounded-full opacity-80 animate-bounce shadow-lg" style={{ animationDelay: '2s' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cycles Section */}
  <section className="py-20 bg-gradient-to-b from-[#f7f5ff] via-[#eef9ff] to-[#f1fff6] dark:from-[#1E0C36] dark:via-[#371B58] dark:to-[#4C1D95] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Featured Cycles</h2>
            <p className="text-xl text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] max-w-2xl mx-auto">Choose from our premium collection of smart cycles</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Cycle 1 */}
            <div className="feature-card bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-[var(--color-border-default-light)] dark:border-[var(--color-border-default-dark)]">
              <div className="relative mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1737530340337-7bd43684b5bc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fG1vdW50YWluJTIwZSUyMGJpa2V8ZW58MHx8MHx8fDA%3D&fit=crop&crop=center" 
                  alt="Mountain E-Bike"
                  loading="lazy"
                  className="w-full h-48 object-cover rounded-2xl"
                />
                <div className="absolute top-4 right-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Available
                </div>
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary-light)] dark:text-[var(--color-text-primary-dark)] mb-2">Mountain E-Bike</h3>
              <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mb-4">Perfect for campus terrain with advanced suspension</p>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Battery className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">85% Battery</span>
                </div>
                <div className="text-lg font-bold text-purple-600">₹50/hr</div>
              </div>
              <Link
                to="/auth/login"
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-xl font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Lock className="h-4 w-4" />
                <span>Book This Cycle</span>
              </Link>
            </div>

            {/* Cycle 2 */}
              <div className="feature-card bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-[var(--color-border-default-light)] dark:border-[var(--color-border-default-dark)]">
              <div className="relative mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1630302215730-fa73a8158731?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGNpdHklMjBjcnVzaWVyJTIwY3ljbGV8ZW58MHx8MHx8fDA%3D&fit=crop&crop=center" 
                  alt="City Cruiser"
                  loading="lazy"
                  className="w-full h-48 object-cover rounded-2xl"
                />
                <div className="absolute top-4 right-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Available
                </div>
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary-light)] dark:text-[var(--color-text-primary-dark)] mb-2">City Cruiser</h3>
              <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mb-4">Comfortable ride for daily campus commuting</p>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Battery className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">92% Battery</span>
                </div>
                <div className="text-lg font-bold text-purple-600">₹40/hr</div>
              </div>
              <Link
                to="/auth/login"
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-xl font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Lock className="h-4 w-4" />
                <span>Book This Cycle</span>
              </Link>
            </div>

            {/* Cycle 3 */}
            <div className="feature-card bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-[var(--color-border-default-light)] dark:border-[var(--color-border-default-dark)]">
              <div className="relative mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1585160442128-b2fa152f1dd1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGVsZWN0cmljJTIwYmlrZXxlbnwwfHwwfHx8MA%3D%3D&fit=crop&crop=center" 
                  alt="Smart E-Bike"
                  loading="lazy"
                  className="w-full h-48 object-cover rounded-2xl"
                />
                <div className="absolute top-4 right-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Available
                </div>
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary-light)] dark:text-[var(--color-text-primary-dark)] mb-2">Smart E-Bike</h3>
              <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mb-4">High-tech bike with GPS and smart features and battery backup</p>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Battery className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">78% Battery</span>
                </div>
                <div className="text-lg font-bold text-purple-600">₹60/hr</div>
              </div>
              <Link
                to="/auth/login"
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-xl font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Lock className="h-4 w-4" />
                <span>Book This Cycle</span>
              </Link>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/auth/register"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              <UserPlus className="h-5 w-5" />
              <span>Join Now to Book Cycles</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">Impressive Numbers</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">Join thousands of students and staff who trust EcoRide+</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 glow-effect">
                <Bike className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-4xl font-bold text-purple-600 mb-2">500+</h3>
              <p className="text-slate-700 font-medium">Smart Cycles</p>
              <p className="text-sm text-slate-500">Available 24/7</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 glow-effect">
                <MapPin className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-4xl font-bold text-indigo-600 mb-2">25</h3>
              <p className="text-slate-700 font-medium">Stations</p>
              <p className="text-sm text-slate-500">Across campus</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 glow-effect">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-4xl font-bold text-blue-600 mb-2">10K+</h3>
              <p className="text-slate-700 font-medium">Happy Users</p>
              <p className="text-sm text-slate-500">Growing daily</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-lavender-400 to-lavender-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 glow-effect">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-4xl font-bold text-lavender-600 mb-2">50K+</h3>
              <p className="text-slate-700 font-medium">Rides Completed</p>
              <p className="text-sm text-slate-500">This month</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-purple-5 via-indigo-5 to-blue-5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-indigo-100 px-6 py-3 rounded-full mb-6 border border-purple-200">
              <Star className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Why Choose EcoRide+?</span>
            </div>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Experience the Perfect Blend</h2>
            <p className="text-xl text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] max-w-2xl mx-auto">
              Technology and sustainability with our innovative features
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="feature-card card-light card-dark-gradient dark:gradient-border rounded-3xl p-8 transition-all group fade-in-up shadow-sm hover:shadow-lg border border-gray-100 dark:border-transparent">
              <div className="w-16 h-16 icon-neon-purple rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-all duration-300">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary-light)] dark:text-[var(--color-text-primary-dark)] mb-4">Smart Booking</h3>
              <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">Book your ride in seconds with our intuitive mobile app. Real-time availability and instant confirmations.</p>
            </div>
            
            <div className="feature-card card-light card-dark-gradient dark:gradient-border rounded-3xl p-8 transition-all group fade-in-up shadow-sm hover:shadow-lg border border-gray-100 dark:border-transparent">
              <div className="w-16 h-16 icon-neon-blue rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-all duration-300">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary-light)] dark:text-[var(--color-text-primary-dark)] mb-4">GPS Tracking</h3>
              <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">Never lose your way with precise GPS navigation. Find the nearest station and track your route in real-time.</p>
            </div>
            
            <div className="feature-card card-light card-dark-gradient dark:gradient-border rounded-3xl p-8 transition-all group fade-in-up shadow-sm hover:shadow-lg border border-gray-100 dark:border-transparent">
              <div className="w-16 h-16 icon-neon-blue rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-all duration-300">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary-light)] dark:text-[var(--color-text-primary-dark)] mb-4">Safe & Secure</h3>
              <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">Your safety is our priority. All cycles are regularly maintained and equipped with safety features.</p>
            </div>
            
            <div className="feature-card card-light card-dark-gradient dark:gradient-border rounded-3xl p-8 transition-all group fade-in-up shadow-sm hover:shadow-lg border border-gray-100 dark:border-transparent">
              <div className="w-16 h-16 icon-neon-purple rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-all duration-300">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary-light)] dark:text-[var(--color-text-primary-dark)] mb-4">24/7 Availability</h3>
              <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">Access cycles anytime, day or night. Our automated system ensures round-the-clock service.</p>
            </div>
            
            <div className="feature-card card-light card-dark-gradient dark:gradient-border rounded-3xl p-8 transition-all group fade-in-up shadow-sm hover:shadow-lg border border-gray-100 dark:border-transparent">
              <div className="w-16 h-16 icon-neon-purple rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-all duration-300">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary-light)] dark:text-[var(--color-text-primary-dark)] mb-4">Eco-Friendly</h3>
              <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">Reduce your carbon footprint. Every ride contributes to a greener, more sustainable campus.</p>
            </div>
            
            <div className="card-light card-dark-gradient dark:gradient-border rounded-3xl p-8 transition-all group fade-in-up shadow-sm hover:shadow-lg border border-gray-100 dark:border-transparent">
              <div className="w-16 h-16 icon-neon-blue rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-all duration-300">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary-light)] dark:text-[var(--color-text-primary-dark)] mb-4">Premium Experience</h3>
              <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">Enjoy a premium cycling experience with well-maintained bikes and excellent customer support.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-100 to-blue-100 px-6 py-3 rounded-full mb-6 border border-indigo-200">
              <Target className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-700">Simple 3-Step Process</span>
            </div>
            <h2 className="text-4xl font-bold text-slate-800 mb-4">How It Works</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Get started with EcoRide+ in just three simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 glow-effect">
                  1
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full flex items-center justify-center">
                  <Heart className="h-4 w-4 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Download & Register</h3>
              <p className="text-slate-600">Get the EcoRide+ app, create your account, and add payment method in minutes.</p>
            </div>
            
            <div className="text-center group">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 glow-effect">
                  2
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Find & Book</h3>
              <p className="text-slate-600">Locate nearby cycles on the map, check availability, and book your preferred ride.</p>
            </div>
            
            <div className="text-center group">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 glow-effect">
                  3
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-400 to-lavender-500 rounded-full flex items-center justify-center">
                  <Bike className="h-4 w-4 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Ride & Return</h3>
              <p className="text-slate-600">Unlock your cycle, enjoy your ride, and return it to any station when done.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-b from-[#f7f5ff] via-[#eef9ff] to-[#f1fff6] dark:from-[#0f1126] dark:via-[#171738] dark:to-[#1f2147] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 fade-in-up">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Flexible Pricing</h2>
            <p className="text-xl text-slate-600 dark:text-[#EAE6F7]/80 max-w-2xl mx-auto">Pick a plan that fits your riding style</p>
          </div>
          {/* Pricing tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Student Plan */}
            <div className="pricing-card feature-card bg-white dark:bg-[#2B2B3C] rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-white/5 fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold text-slate-800 dark:text-white">Student</h3>
                <span className="pricing-badge text-sm px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200">Best Value</span>
              </div>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-bold text-purple-600">₹29</span>
                <span className="text-slate-500 dark:text-[#b0b0c3]">/hr</span>
              </div>
              <ul className="space-y-3 text-slate-600 dark:text-[#b0b0c3] mb-6">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Unlimited station swaps</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> GPS tracking</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Basic support</li>
              </ul>
              <Link to="/auth/register" aria-label="Choose Student plan" data-tooltip="Start with Student" className="btn-theme tooltip inline-flex items-center justify-center w-full px-6 py-3 rounded-xl font-semibold bg-purple-600 text-white hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2">Choose Plan</Link>
            </div>
            {/* Standard Plan */}
            <div className="pricing-card feature-card bg-white dark:bg-[#2B2B3C] rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-white/5 fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold text-slate-800 dark:text-white">Standard</h3>
                <span className="pricing-badge text-sm px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">Popular</span>
              </div>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-bold text-indigo-600">₹49</span>
                <span className="text-slate-500 dark:text-[#b0b0c3]">/hr</span>
              </div>
              <ul className="space-y-3 text-slate-600 dark:text-[#b0b0c3] mb-6">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Priority support</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Smart locks</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Battery health insights</li>
              </ul>
              <Link to="/auth/register" aria-label="Choose Standard plan" data-tooltip="Go Standard" className="btn-theme tooltip inline-flex items-center justify-center w-full px-6 py-3 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">Choose Plan</Link>
            </div>
            {/* Pro Plan */}
            <div className="pricing-card feature-card bg-white dark:bg-[#2B2B3C] rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-white/5 fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold text-slate-800 dark:text-white">Pro</h3>
                <span className="pricing-badge text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">For Power Users</span>
              </div>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-bold text-blue-600">₹69</span>
                <span className="text-slate-500 dark:text-[#b0b0c3]">/hr</span>
              </div>
              <ul className="space-y-3 text-slate-600 dark:text-[#b0b0c3] mb-6">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Concierge assistance</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Advanced analytics</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Theft protection</li>
              </ul>
              <Link to="/auth/register" aria-label="Choose Pro plan" data-tooltip="Go Pro" className="btn-theme tooltip inline-flex items-center justify-center w-full px-6 py-3 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">Choose Plan</Link>
            </div>
          </div>
        </div>
            
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl text-purple-100 mb-8">
            Join thousands of students and staff who are already enjoying smart, sustainable transportation
          </p>
          <Link
            to="/auth/register"
            aria-label="Get started now"
            data-tooltip="Create account"
            className="bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 inline-flex items-center space-x-2 shadow-lg tooltip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <span>Get Started Now</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-800 via-purple-900 to-indigo-900 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Bike className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold">EcoRide+</span>
              </div>
              <p className="text-purple-200 mb-4">
                Revolutionizing campus transportation with smart, sustainable cycling solutions.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">F</span>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">T</span>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-lavender-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">I</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4 text-purple-200">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-purple-300 hover:text-indigo-300 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-purple-300 hover:text-indigo-300 transition-colors">How it Works</a></li>
                <li><a href="#pricing" className="text-purple-300 hover:text-indigo-300 transition-colors">Pricing</a></li>
                <li><a href="#contact" className="text-purple-300 hover:text-indigo-300 transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4 text-purple-200">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-purple-300 hover:text-indigo-300 transition-colors">Help Center</a></li>
                <li><a href="#" className="text-purple-300 hover:text-indigo-300 transition-colors">Safety Guidelines</a></li>
                <li><a href="#" className="text-purple-300 hover:text-indigo-300 transition-colors">Report Issues</a></li>
                <li><a href="#" className="text-purple-300 hover:text-indigo-300 transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4 text-purple-200">Contact</h3>
              <ul className="space-y-2">
                <li className="text-purple-300">📧 support@ecycle.com</li>
                <li className="text-purple-300">📱 +91 9876543210</li>
                <li className="text-purple-300">🏫 Centurion University, Andhra Pradesh</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-purple-700 mt-12 pt-8 text-center">
            <p className="text-purple-300">
              © 2024 EcoRide+. All rights reserved. Making campus transportation smarter and greener. 🌱
            </p>
          </div>
        </div>
      </footer>

      {/* AI Chat Component */}
      <AIChat />

      {/* Video Modal */}
      <VideoModal isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} videoSrc="/watch-demo.mp4" />
    </div>
  );
};
