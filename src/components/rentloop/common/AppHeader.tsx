'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Bell,
  Menu,
  User,
  LogOut,
  LayoutDashboard,
  Package,
  Heart,
  MessageCircle,
  Shield,
  Plus,
  MapPin,
  Store,
  ChevronDown,
} from 'lucide-react';
import type { State, City, Area, Notification, Category } from '@/types';
import { toast } from 'sonner';

export default function AppHeader() {
  const {
    user, setUser, currentView, navigate, setAuthModalOpen, setAuthModalView,
    selectedState, setSelectedState,
    selectedCity, setSelectedCity,
    selectedArea, setSelectedArea,
    states, setStates,
    categories, setCategories,
    notifications, setNotifications, unreadCount, setUnreadCount,
  } = useAppStore();

  const [showNotif, setShowNotif] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const [showLocationMobile, setShowLocationMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLocationPopover, setShowLocationPopover] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const locationPopoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const isLanding = currentView === 'landing';
  const isMarketplace = currentView === 'marketplace';



  // Fetch states on mount
  useEffect(() => {
    api.getStates().then((data) => {
      const s = data as unknown as State[];
      setStates(s);
    }).catch(() => {});
  }, [setStates]);

  // Fetch categories on mount
  useEffect(() => {
    if (categories.length === 0) {
      api.getCategories().then((data) => {
        const c = data as unknown as Category[];
        setCategories(c);
      }).catch(() => {});
    }
  }, [categories.length, setCategories]);

  // Fetch notifications for logged-in users
  useEffect(() => {
    if (!user) return;
    api.getNotifications().then((data) => {
      const notifs = Array.isArray((data as any).notifications) ? (data as any).notifications as Notification[] : [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    }).catch(() => {});
  }, [user, setNotifications, setUnreadCount]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
      if (locationPopoverRef.current && !locationPopoverRef.current.contains(e.target as Node)) {
        setShowLocationPopover(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
      setUser(null);
      navigate('landing');
      toast.success('Logged out successfully');
    } catch {
      toast.error('Failed to logout');
    }
  };

  const requireAuth = (action: () => void) => {
    if (!user) {
      setAuthModalView('login');
      setAuthModalOpen(true);
      return;
    }
    action();
  };

  // Derived lists
  const cities = useMemo(() => {
    if (!selectedState) return [];
    return selectedState.cities?.filter((c: City) => c.isActive) ?? [];
  }, [selectedState]);

  const areas = useMemo(() => {
    if (!selectedCity) return [];
    return selectedCity.areas?.filter((a: Area) => a.isActive) ?? [];
  }, [selectedCity]);

  // Location label (most specific)
  const locationLabel = useMemo(() => {
    if (selectedArea) return selectedArea.name;
    if (selectedCity) return selectedCity.name;
    if (selectedState) return selectedState.name;
    return 'Location';
  }, [selectedState, selectedCity, selectedArea]);

  const hasLocationSelection = !!(selectedState || selectedCity || selectedArea);

  // First 8 active categories for the pills bar
  const displayCategories = useMemo(() => {
    return categories.filter((c) => c.isActive).slice(0, 8);
  }, [categories]);

  const handleStateChange = (stateId: string) => {
    if (!stateId) {
      setSelectedState(null);
      setSelectedCity(null);
      setSelectedArea(null);
    } else {
      const st = states.find((s) => s.id === stateId);
      if (st) setSelectedState(st);
      setSelectedCity(null);
      setSelectedArea(null);
    }
    navigate('marketplace');
  };

  const handleCityChange = (cityId: string) => {
    if (!cityId) {
      setSelectedCity(null);
      setSelectedArea(null);
    } else {
      const c = cities.find((c) => c.id === cityId);
      if (c) setSelectedCity(c);
      setSelectedArea(null);
    }
    navigate('marketplace');
  };

  const handleAreaChange = (areaId: string) => {
    if (!areaId) {
      setSelectedArea(null);
    } else {
      const a = areas.find((a) => a.id === areaId);
      if (a) setSelectedArea(a);
    }
    navigate('marketplace');
  };

  const handleSearchNavigate = useCallback(() => {
    if (searchQuery.trim()) {
      navigate('marketplace', { searchQuery: searchQuery.trim() });
    } else {
      navigate('marketplace');
    }
  }, [searchQuery, navigate]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchNavigate();
    }
  }, [handleSearchNavigate]);

  const handleCategoryPillClick = useCallback((catId: string) => {
    navigate('marketplace', { categoryId: catId });
  }, [navigate]);

  // ─── LANDING PAGE HEADER ───────────────────────────────────
  if (isLanding) {
    return (
      <>
        <header className="sticky top-0 z-50 w-full bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <button
                onClick={() => navigate('landing')}
                className="flex items-center gap-2 group"
              >
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                  Rent<span className="text-emerald-300">Cart</span>
                </span>
              </button>

              {/* Right section */}
              <div className="flex items-center gap-3">
                {user ? (
                  <>
                    {/* Notifications */}
                    <div ref={notifRef} className="relative">
                      <button
                        onClick={() => setShowNotif(!showNotif)}
                        className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors relative"
                      >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </button>
                      <NotificationPanel
                        show={showNotif}
                        onClose={() => setShowNotif(false)}
                        notifications={notifications}
                        unreadCount={unreadCount}
                        onMarkAllRead={async () => {
                          try {
                            await api.markNotificationsRead(undefined, true);
                            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
                            setUnreadCount(0);
                          } catch {}
                        }}
                        onViewAll={() => { setShowNotif(false); navigate('notifications'); }}
                        onNotifClick={() => setShowNotif(false)}
                      />
                    </div>

                    {/* User Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/10 transition-colors">
                          <Avatar className="h-8 w-8 border-2 border-white/40">
                            <AvatarFallback className="bg-[#059669] text-white text-sm font-semibold">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="hidden sm:block text-sm font-medium text-white max-w-[100px] truncate">
                            {user.name?.split(' ')[0]}
                          </span>
                        </button>
                      </DropdownMenuTrigger>
                      <UserMenuContent
                        user={user}
                        isAdmin={isAdmin}
                        onNavigate={(view) => navigate(view)}
                        onLogout={handleLogout}
                      />
                    </DropdownMenu>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setAuthModalView('login'); setAuthModalOpen(true); }}
                      className="text-white hover:text-white hover:bg-white/10"
                    >
                      Login
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => { setAuthModalView('register'); setAuthModalOpen(true); }}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Sign Up
                    </Button>
                  </div>
                )}

                {/* Mobile menu */}
                <button
                  onClick={() => setShowMobile(true)}
                  className="p-2 rounded-lg text-white hover:bg-white/10 md:hidden"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Side Sheet */}
        <MobileSideSheet
          open={showMobile}
          onOpenChange={setShowMobile}
          user={user}
          isAdmin={isAdmin}
          onNavigate={(view) => { navigate(view); setShowMobile(false); }}
                  onAuth={(view) => { setAuthModalView(view); setAuthModalOpen(true); setShowMobile(false); }}
          onLogout={() => { handleLogout(); setShowMobile(false); }}
        />
      </>
    );
  }

  // ─── NON-LANDING (MARKETPLACE / ALL OTHER VIEWS) HEADER ───
  return (
    <>
      {/* Top utility bar */}
      <div className="hidden md:block h-8 bg-[#1e3a5f] text-white/80 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <span>India&apos;s #1 Rental Marketplace</span>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('help-center')} className="hover:text-white transition-colors">Help Center</button>
            <button onClick={() => navigate('contact')} className="hover:text-white transition-colors">Contact</button>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-50 w-full bg-white shadow-sm overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-3 h-14 min-w-0">
            {/* Logo */}
            <button
              onClick={() => navigate('landing')}
              className="flex items-center gap-1.5 sm:gap-2 group shrink-0"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#059669] rounded-lg flex items-center justify-center">
                <Store className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="hidden sm:inline text-lg sm:text-xl font-bold tracking-tight text-[#0f172a]">
                Rent<span className="text-emerald-600">Cart</span>
              </span>
            </button>

            {/* Desktop: Unified search bar */}
            <div className="hidden md:flex flex-1 max-w-xs lg:max-w-xl xl:max-w-2xl mx-2 lg:mx-6 min-w-0">
              <div className="flex items-center w-full border-2 border-emerald-500 rounded-lg h-10 overflow-hidden bg-white">
                {/* Category dropdown */}
                <div ref={categoryDropdownRef} className="relative">
                  <button
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="w-[100px] lg:w-[140px] h-full flex items-center justify-between gap-1 px-2.5 lg:px-3 bg-gray-50 border-r border-gray-200 text-xs text-[#0f172a] font-medium hover:bg-gray-100 transition-colors shrink-0"
                  >
                    <span className="truncate">All Categories</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[#64748b] shrink-0 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showCategoryDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 max-h-72 overflow-y-auto">
                      <button
                        onClick={() => { navigate('marketplace'); setShowCategoryDropdown(false); }}
                        className="w-full px-3 py-2 text-left text-sm text-[#0f172a] hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      >
                        All Categories
                      </button>
                      {categories.filter((c) => c.isActive).map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => { navigate('marketplace', { categoryId: cat.id }); setShowCategoryDropdown(false); }}
                          className="w-full px-3 py-2 text-left text-sm text-[#64748b] hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Location display button (desktop popover) */}
                <div ref={locationPopoverRef} className="relative">
                  <button
                    onClick={() => setShowLocationPopover(!showLocationPopover)}
                    className={`w-[90px] lg:w-[130px] h-full flex items-center gap-1 px-2 lg:px-3 border-r border-gray-200 text-xs shrink-0 transition-colors ${
                      hasLocationSelection
                        ? 'text-[#0f172a] font-medium'
                        : 'text-[#94a3b8]'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 shrink-0 ${hasLocationSelection ? 'text-[#059669]' : 'text-[#94a3b8]'}`} />
                    <span className="truncate">{locationLabel}</span>
                    <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${showLocationPopover ? 'rotate-180' : ''} hidden lg:block`} />
                  </button>
                  {showLocationPopover && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-100 p-4 z-50">
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1 block">State</label>
                          <Select value={selectedState?.id ?? ''} onValueChange={handleStateChange}>
                            <SelectTrigger className="h-9 w-full text-xs border-gray-200">
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              {states.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedState && cities.length > 0 && (
                          <div>
                            <label className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1 block">City</label>
                            <Select value={selectedCity?.id ?? ''} onValueChange={handleCityChange}>
                              <SelectTrigger className="h-9 w-full text-xs border-gray-200">
                                <SelectValue placeholder="Select city" />
                              </SelectTrigger>
                              <SelectContent>
                                {cities.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {selectedCity && areas.length > 0 && (
                          <div>
                            <label className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1 block">Area</label>
                            <Select value={selectedArea?.id ?? ''} onValueChange={(val) => { handleAreaChange(val); setShowLocationPopover(false); }}>
                              <SelectTrigger className="h-9 w-full text-xs border-gray-200">
                                <SelectValue placeholder="Select area" />
                              </SelectTrigger>
                              <SelectContent>
                                {areas.map((a) => (
                                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {hasLocationSelection && (
                          <button
                            onClick={() => {
                              setSelectedState(null);
                              setSelectedCity(null);
                              setSelectedArea(null);
                              setShowLocationPopover(false);
                              navigate('marketplace');
                            }}
                            className="text-xs text-[#059669] hover:text-emerald-700 font-medium"
                          >
                            Clear location
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Search input */}
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search for cameras, laptops, bikes..."
                  className="flex-1 h-full px-3 text-sm text-[#0f172a] placeholder:text-[#94a3b8] outline-none bg-transparent min-w-0"
                />

                {/* Search button */}
                <button
                  onClick={handleSearchNavigate}
                  className="w-12 h-full bg-[#059669] hover:bg-[#10b981] text-white flex items-center justify-center transition-colors shrink-0"
                  aria-label="Search"
                >
                  <Search className="w-[18px] h-[18px]" />
                </button>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Mobile: Search icon */}
              <button
                onClick={() => navigate('marketplace')}
                className="p-2 rounded-lg text-[#64748b] hover:text-[#0f172a] hover:bg-gray-100 transition-colors md:hidden"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Mobile: Location button */}
              <button
                onClick={() => setShowLocationMobile(true)}
                className={`md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
                  hasLocationSelection
                    ? 'border-emerald-200 bg-emerald-50 text-[#059669]'
                    : 'border-gray-200 text-[#64748b] hover:border-gray-300'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span className="max-w-[60px] truncate">{locationLabel}</span>
              </button>

              {user ? (
                <>
                  {/* List Item Free - orange CTA */}
                  <Button
                    size="sm"
                    onClick={() => requireAuth(() => navigate('list-item'))}
                    className="hidden lg:flex bg-orange-500 hover:bg-orange-600 text-white rounded-full text-xs font-semibold px-3 lg:px-4 h-8 gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">List Item Free</span>
                    <span className="xl:hidden">List</span>
                  </Button>

                  {/* Notifications */}
                  <div ref={notifRef} className="relative">
                    <button
                      onClick={() => setShowNotif(!showNotif)}
                      className="p-2 rounded-lg text-[#64748b] hover:text-[#0f172a] hover:bg-gray-100 transition-colors relative"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                    <NotificationPanel
                      show={showNotif}
                      onClose={() => setShowNotif(false)}
                      notifications={notifications}
                      unreadCount={unreadCount}
                      onMarkAllRead={async () => {
                        try {
                          await api.markNotificationsRead(undefined, true);
                          setNotifications(notifications.map(n => ({ ...n, isRead: true })));
                          setUnreadCount(0);
                        } catch {}
                      }}
                      onViewAll={() => { setShowNotif(false); navigate('notifications'); }}
                      onNotifClick={() => setShowNotif(false)}
                    />
                  </div>

                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                        <Avatar className="h-8 w-8 border-2 border-emerald-100">
                          <AvatarFallback className="bg-emerald-100 text-[#059669] text-sm font-semibold">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden lg:block text-sm font-medium text-[#0f172a] max-w-[80px] lg:max-w-[100px] truncate">
                          {user.name?.split(' ')[0]}
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <UserMenuContent
                      user={user}
                      isAdmin={isAdmin}
                      onNavigate={(view) => navigate(view)}
                      onLogout={handleLogout}
                    />
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setAuthModalView('login'); setAuthModalOpen(true); }}
                    className="text-[#64748b] hover:text-[#0f172a] hover:bg-gray-100 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => { setAuthModalView('register'); setAuthModalOpen(true); }}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm px-3 sm:px-4"
                  >
                    Sign Up
                  </Button>
                </div>
              )}

              {/* Mobile menu hamburger */}
              <button
                onClick={() => setShowMobile(true)}
                className="p-2 rounded-lg text-[#64748b] hover:text-[#0f172a] hover:bg-gray-100 md:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Category pills bar - only on marketplace */}
      {isMarketplace && displayCategories.length > 0 && (
        <div className="bg-gray-50 border-b border-[#e2e8f0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="flex gap-2 overflow-x-auto py-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <button
                onClick={() => navigate('marketplace')}
                className="shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors bg-white text-[#64748b] border border-[#e2e8f0] hover:border-emerald-300 hover:text-emerald-600"
              >
                All
              </button>
              {displayCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryPillClick(cat.id)}
                  className="shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors text-[#64748b] hover:bg-emerald-50 hover:text-emerald-600 border border-transparent"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Location Picker Sheet */}
      <Sheet open={showLocationMobile} onOpenChange={setShowLocationMobile}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="p-4 pb-2">
            <SheetTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-4 h-4 text-[#059669]" />
              Select Location
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#64748b]">State</label>
              <Select value={selectedState?.id ?? ''} onValueChange={(val) => { handleStateChange(val); }}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedState && cities.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#64748b]">City</label>
                <Select value={selectedCity?.id ?? ''} onValueChange={(val) => { handleCityChange(val); }}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedCity && areas.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#64748b]">Area</label>
                <Select value={selectedArea?.id ?? ''} onValueChange={(val) => { handleAreaChange(val); setShowLocationMobile(false); }}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Select an area" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(selectedState || selectedCity || selectedArea) && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-sm text-[#64748b]"
                onClick={() => {
                  setSelectedState(null);
                  setSelectedCity(null);
                  setSelectedArea(null);
                  navigate('marketplace');
                  setShowLocationMobile(false);
                }}
              >
                Clear location selection
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Side Sheet */}
      <MobileSideSheet
        open={showMobile}
        onOpenChange={setShowMobile}
        user={user}
        isAdmin={isAdmin}
        onNavigate={(view) => {
          if (view === 'list-item') {
            requireAuth(() => { navigate(view); setShowMobile(false); });
          } else {
            navigate(view);
            setShowMobile(false);
          }
        }}
        onAuth={(view) => { setAuthModalView(view); setAuthModalOpen(true); setShowMobile(false); }}
        onLogout={() => { handleLogout(); setShowMobile(false); }}
      />
    </>
  );
}

// ─── Notification Panel ────────────────────────────────────────
function NotificationPanel({
  show,
  onClose,
  notifications,
  unreadCount,
  onMarkAllRead,
  onViewAll,
  onNotifClick,
}: {
  show: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onViewAll: () => void;
  onNotifClick: () => void;
}) {
  if (!show) return null;
  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-[#0f172a]">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-[#059669] hover:text-emerald-700"
          >
            Mark all read
          </button>
        )}
      </div>
      <ScrollArea className="max-h-80">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-[#94a3b8]">No notifications</div>
        ) : (
          notifications.slice(0, 10).map(n => (
            <button
              key={n.id}
              onClick={onNotifClick}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors ${!n.isRead ? 'bg-emerald-50/50' : ''}`}
            >
              <p className="text-sm font-medium text-[#0f172a]">{n.title}</p>
              <p className="text-xs text-[#64748b] mt-0.5 line-clamp-1">{n.message}</p>
            </button>
          ))
        )}
      </ScrollArea>
      <button
        onClick={onViewAll}
        className="w-full p-2.5 text-center text-xs font-medium text-[#059669] hover:bg-emerald-50 border-t border-gray-100 transition-colors"
      >
        View all notifications
      </button>
    </div>
  );
}

// ─── User Menu Content ─────────────────────────────────────────
function UserMenuContent({
  user,
  isAdmin,
  onNavigate,
  onLogout,
}: {
  user: { name: string; email: string; state?: { name: string } | null };
  isAdmin: boolean;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}) {
  const nav = onNavigate as (view: string) => void;
  return (
    <DropdownMenuContent align="end" className="w-56">
      <div className="px-3 py-2 border-b border-gray-100">
        <p className="text-sm font-semibold text-[#0f172a]">{user.name}</p>
        <p className="text-xs text-[#64748b]">{user.email}</p>
        {user.state && (
          <p className="text-xs text-[#94a3b8] mt-0.5">• {user.state.name}</p>
        )}
      </div>
      <DropdownMenuItem onClick={() => nav('dashboard')}>
        <LayoutDashboard className="w-4 h-4 mr-2" />
        Dashboard
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => nav('my-rentals')}>
        <Package className="w-4 h-4 mr-2" />
        My Rentals
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => nav('my-listings')}>
        <Store className="w-4 h-4 mr-2" />
        My Listings
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => nav('favorites')}>
        <Heart className="w-4 h-4 mr-2" />
        Favorites
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => nav('messages')}>
        <MessageCircle className="w-4 h-4 mr-2" />
        Messages
      </DropdownMenuItem>
      {isAdmin && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => nav('admin-dashboard')}>
            <Shield className="w-4 h-4 mr-2" />
            Admin Panel
          </DropdownMenuItem>
        </>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onLogout} className="text-red-600">
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

// ─── Mobile Side Sheet ─────────────────────────────────────────
function MobileSideSheet({
  open,
  onOpenChange,
  user,
  isAdmin,
  onNavigate,
  onAuth,
  onLogout,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: { name?: string } | null;
  isAdmin: boolean;
  onNavigate: (view: string) => void;
  onAuth: (view: 'login' | 'register') => void;
  onLogout: () => void;
}) {
  const nav = onNavigate as (view: string) => void;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-72 p-0">
        <SheetHeader className="p-4 border-b border-[#e2e8f0]">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#059669] rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="text-[#0f172a]">
              Rent<span className="text-emerald-600">Cart</span>
            </span>
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            <MobileNavItem icon={<Search className="w-4 h-4" />} label="Explore" onClick={() => nav('marketplace')} />
            {user ? (
              <>
                <MobileNavItem icon={<Plus className="w-4 h-4" />} label="List Item Free" onClick={() => nav('list-item')} />
                <MobileNavItem icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" onClick={() => nav('dashboard')} />
                <MobileNavItem icon={<Package className="w-4 h-4" />} label="My Rentals" onClick={() => nav('my-rentals')} />
                <MobileNavItem icon={<Store className="w-4 h-4" />} label="My Listings" onClick={() => nav('my-listings')} />
                <MobileNavItem icon={<Heart className="w-4 h-4" />} label="Favorites" onClick={() => nav('favorites')} />
                <MobileNavItem icon={<MessageCircle className="w-4 h-4" />} label="Messages" onClick={() => nav('messages')} />
                {isAdmin && (
                  <MobileNavItem icon={<Shield className="w-4 h-4" />} label="Admin Panel" onClick={() => nav('admin-dashboard')} />
                )}
              </>
            ) : (
              <>
                <MobileNavItem icon={<User className="w-4 h-4" />} label="Login" onClick={() => onAuth('login')} />
                <MobileNavItem icon={<User className="w-4 h-4" />} label="Sign Up" onClick={() => onAuth('register')} />
              </>
            )}
          </div>
        </ScrollArea>
        {user && (
          <div className="p-3 border-t border-[#e2e8f0]">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Mobile Nav Item ───────────────────────────────────────────
function MobileNavItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#0f172a] hover:bg-gray-100 transition-colors"
    >
      {icon}
      {label}
    </button>
  );
}
