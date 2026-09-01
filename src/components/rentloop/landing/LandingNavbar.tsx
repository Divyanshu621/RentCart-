'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Store, Menu, X, ChevronDown, LogIn, UserPlus, Package, Heart } from 'lucide-react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const navLinks = [
  { label: 'Browse Rentals', action: 'navigate', target: 'marketplace' as const },
  { label: 'How It Works', action: 'scroll', target: '#how-it-works' },
  { label: 'Categories', action: 'scroll', target: '#categories' },
  { label: 'Pricing', action: 'navigate', target: 'help-center' as const },
];

const scrollToSection = (selector: string) => {
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

export default function LandingNavbar() {
  const { user, navigate, setAuthModalOpen, setAuthModalView } = useAppStore();
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > 50);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 50);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleNavClick = (link: (typeof navLinks)[number]) => {
    setMobileOpen(false);
    if (link.action === 'navigate') {
      navigate(link.target);
    } else {
      scrollToSection(link.target);
    }
  };

  const openAuth = (view: 'login' | 'register') => {
    setAuthModalView(view);
    setAuthModalOpen(true);
    setMobileOpen(false);
  };

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0a0f1a]/95 backdrop-blur-xl border-b border-white/10'
            : 'bg-transparent'
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          {/* ── Left: Branding ── */}
          <button
            onClick={() => navigate('landing')}
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
            aria-label="RentCart Home"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20 transition-transform duration-200 group-hover:scale-105">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="hidden sm:block text-xl font-bold tracking-tight select-none">
              <span className="text-white">Rent</span>
              <span className="text-[#34d399]">Cart</span>
            </span>
          </button>

          {/* ── Center: Desktop Nav Links ── */}
          <ul className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.label}>
                <button
                  onClick={() => handleNavClick(link)}
                  className="text-sm font-medium text-white/70 px-3 py-2 rounded-lg transition-all duration-200 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>

          {/* ── Right: Auth / User ── */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-emerald-600 text-white text-sm font-semibold">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-white max-w-[120px] truncate">
                      {user.name}
                    </span>
                    <ChevronDown className="h-4 w-4 text-white/60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-[#111827] border-white/10 text-white"
                >
                  <DropdownMenuItem
                    onClick={() => navigate('dashboard')}
                    className="cursor-pointer focus:bg-white/10 focus:text-white"
                  >
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate('my-rentals')}
                    className="cursor-pointer focus:bg-white/10 focus:text-white"
                  >
                    My Rentals
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate('my-listings')}
                    className="cursor-pointer focus:bg-white/10 focus:text-white"
                  >
                    My Listings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate('favorites')}
                    className="cursor-pointer focus:bg-white/10 focus:text-white"
                  >
                    Favorites
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={() => useAppStore.getState().setUser(null)}
                    className="cursor-pointer focus:bg-white/10 focus:text-red-400"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 focus-visible:ring-emerald-500"
                  onClick={() => openAuth('login')}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
                <Button
                  size="sm"
                  className="rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-emerald-700 focus-visible:ring-emerald-500"
                  onClick={() => openAuth('register')}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* ── Mobile: Hamburger ── */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>
      </motion.header>

      {/* ── Mobile Sheet ── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="right"
          className="w-full max-w-xs bg-[#0a0f1a] text-white border-white/10 p-0"
        >
          <SheetHeader className="px-5 pt-6 pb-4">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  navigate('landing');
                  setMobileOpen(false);
                }}
                className="flex items-center gap-2.5 focus:outline-none"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20">
                  <Store className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight">
                  <span className="text-white">Rent</span>
                  <span className="text-[#34d399]">Cart</span>
                </span>
              </button>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </SheetHeader>

          {/* Mobile Nav Links */}
          <div className="flex flex-col gap-1 px-3">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link)}
                className="w-full text-left text-sm font-medium text-white/80 px-4 py-3 rounded-lg transition-colors hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Mobile Auth Buttons */}
          <div className="mt-auto px-5 pb-8 pt-6 border-t border-white/10 flex flex-col gap-3 absolute bottom-0 left-0 right-0">
            {user ? (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-emerald-600 text-white text-sm font-semibold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-white truncate">{user.name}</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    navigate('dashboard');
                    setMobileOpen(false);
                  }}
                >
                  Dashboard
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    navigate('my-rentals');
                    setMobileOpen(false);
                  }}
                >
                  My Rentals
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    navigate('my-listings');
                    setMobileOpen(false);
                  }}
                >
                  <Package className="mr-2 h-4 w-4" />
                  My Listings
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    navigate('favorites');
                    setMobileOpen(false);
                  }}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Favourites
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => {
                    useAppStore.getState().setUser(null);
                    setMobileOpen(false);
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => openAuth('login')}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
                <Button
                  className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-emerald-700"
                  onClick={() => openAuth('register')}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
