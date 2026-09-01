'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown, Sparkles } from 'lucide-react';

import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import type { Category } from '@/types';

/* ─── Animated Counter ─────────────────────────────────────── */

function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 2000;
          const startTime = performance.now();
          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString('en-IN')}{suffix}
    </span>
  );
}

/* ─── Stats ─────────────────────────────────────────────────── */

const stats = [
  { label: 'Products', value: 10000, suffix: '+', prefix: '' },
  { label: 'Users', value: 5000, suffix: '+', prefix: '' },
  { label: 'Cities', value: 50, suffix: '+', prefix: '' },
  { label: 'Rating', value: 48, suffix: '/10', prefix: '' },
];

/* ─── Component ─────────────────────────────────────────────── */

export default function HeroSection() {
  const navigate = useAppStore((s) => s.navigate);
  const categories = useAppStore((s) => s.categories);
  const setCategories = useAppStore((s) => s.setCategories);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  // Fetch categories on mount
  useEffect(() => {
    if (categories.length === 0) {
      api.getCategories().then((data) => {
        const c = data as unknown as Category[];
        setCategories(c);
      }).catch(() => {});
    }
  }, [categories.length, setCategories]);

  // Close category dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearchNavigate = useCallback(() => {
    const data: Record<string, unknown> = {};
    if (searchQuery.trim()) data.searchQuery = searchQuery.trim();
    if (selectedCategory) data.categoryId = selectedCategory;
    navigate('marketplace', data);
  }, [searchQuery, selectedCategory, navigate]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearchNavigate();
  }, [handleSearchNavigate]);

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategory) return 'All Categories';
    const cat = categories.find((c) => c.id === selectedCategory);
    return cat?.name || 'All Categories';
  }, [selectedCategory, categories]);

  return (
    <section className="relative min-h-[600px] lg:min-h-[700px] flex flex-col justify-center overflow-hidden">
      {/* Emerald gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#064e3b] via-[#065f46] to-[#0f172a]" />

      {/* Subtle dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Subtle geometric shapes */}
      <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-white/[0.03] blur-2xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-[#10b981]/[0.05] blur-3xl" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-32 sm:pt-36 pb-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-white/20 bg-white/10 text-white/90 text-sm font-medium backdrop-blur-sm">
            <Sparkles size={14} className="text-amber-400" />
            <span>India&apos;s Trusted Rental Marketplace</span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.1] text-white">
            Find &amp; Rent Anything
            <br />
            <span className="text-[#10b981]">Across India</span>
          </h1>

          {/* Subheading */}
          <motion.p
            className="mt-5 text-lg sm:text-xl text-emerald-100/80 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
          >
            From cameras to cars, laptops to furniture — rent what you need,
            when you need it. Save money, reduce waste.
          </motion.p>

          {/* ─── Search Bar ──────────────────────────────── */}
          <motion.div
            className="mt-10 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          >
            <div className="flex items-stretch h-12 sm:h-14 rounded-xl overflow-hidden shadow-2xl shadow-black/20 bg-white">
              {/* Category dropdown */}
              <div ref={categoryRef} className="relative">
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-[130px] sm:w-[160px] h-full flex items-center justify-between gap-1 px-3 sm:px-4 bg-[#f8fafc] border-r border-[#e2e8f0] text-xs sm:text-sm text-[#0f172a] font-medium hover:bg-[#f1f5f9] transition-colors shrink-0"
                >
                  <span className="truncate">{selectedCategoryName}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#64748b] shrink-0 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-[#e2e8f0] py-1 z-50 max-h-72 overflow-y-auto">
                    <button
                      onClick={() => { setSelectedCategory(''); setShowCategoryDropdown(false); }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-[#ecfdf5] hover:text-[#059669] transition-colors ${!selectedCategory ? 'text-[#059669] font-medium' : 'text-[#0f172a]'}`}
                    >
                      All Categories
                    </button>
                    {categories.filter((c) => c.isActive).map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setSelectedCategory(cat.id); setShowCategoryDropdown(false); }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-[#ecfdf5] hover:text-[#059669] transition-colors ${selectedCategory === cat.id ? 'text-[#059669] font-medium' : 'text-[#64748b]'}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search input */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search for cameras, laptops, bikes..."
                className="flex-1 h-full px-3 sm:px-4 text-sm text-[#0f172a] placeholder:text-[#94a3b8] outline-none bg-transparent min-w-0"
              />

              {/* Search button */}
              <button
                onClick={handleSearchNavigate}
                className="w-12 sm:w-14 h-full bg-[#059669] hover:bg-[#047857] text-white flex items-center justify-center transition-colors shrink-0"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Quick links */}
          <motion.div
            className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <span className="text-emerald-200/60">Popular:</span>
            {['Cameras', 'Laptops', 'Bikes', 'Furniture', 'Gaming'].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setSearchQuery(term);
                  navigate('marketplace', { searchQuery: term });
                }}
                className="text-emerald-100/80 hover:text-white transition-colors underline-offset-2 hover:underline"
              >
                {term}
              </button>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Stats bar */}
      <motion.div
        className="relative z-10 mt-auto"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
      >
        <div className="border-t border-white/10 bg-[#064e3b]/60 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white">
                    <AnimatedCounter
                      target={stat.value}
                      suffix={stat.suffix}
                      prefix={stat.prefix}
                    />
                  </div>
                  <div className="text-sm text-emerald-200/60 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
