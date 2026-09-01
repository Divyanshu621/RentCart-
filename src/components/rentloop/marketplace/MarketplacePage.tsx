'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  PackageOpen,
  AlertCircle,
  MapPin,
  IndianRupee,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import type { Product, State, City, Area, Category } from '@/types';
import ProductCard from './ProductCard';

type SortOption = 'recommended' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'most_rented';
type ConditionFilter = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | '';

const sortLabels: Record<SortOption, string> = {
  recommended: 'Recommended',
  price_asc: 'Price Low \u2192 High',
  price_desc: 'Price High \u2192 Low',
  rating: 'Highest Rated',
  newest: 'Newest First',
  most_rented: 'Most Rented',
};

const conditionOptions: { value: ConditionFilter; label: string; color: string }[] = [
  { value: '', label: 'All', color: '' },
  { value: 'NEW', label: 'New', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { value: 'LIKE_NEW', label: 'Like New', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'GOOD', label: 'Good', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'FAIR', label: 'Fair', color: 'bg-orange-100 text-orange-700 border-orange-300' },
];

export default function MarketplacePage() {
  const states = useAppStore((s) => s.states);
  const categories = useAppStore((s) => s.categories);
  const selectedState = useAppStore((s) => s.selectedState);
  const setSelectedState = useAppStore((s) => s.setSelectedState);
  const selectedCity = useAppStore((s) => s.selectedCity);
  const setSelectedCity = useAppStore((s) => s.setSelectedCity);
  const selectedArea = useAppStore((s) => s.selectedArea);
  const setSelectedArea = useAppStore((s) => s.setSelectedArea);
  const viewData = useAppStore((s) => s.viewData);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('recommended');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [condition, setCondition] = useState<ConditionFilter>('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [deliveryOnly, setDeliveryOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [initialSearchDone, setInitialSearchDone] = useState(false);
  const [initialCategoryDone, setInitialCategoryDone] = useState(false);

  const ITEMS_PER_PAGE = 12;

  const cities = useMemo(() => {
    if (!selectedState) return [];
    return selectedState.cities?.filter((c: City) => c.isActive) ?? [];
  }, [selectedState]);

  const areas = useMemo(() => {
    if (!selectedCity) return [];
    return selectedCity.areas?.filter((a: Area) => a.isActive) ?? [];
  }, [selectedCity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: statesData } = useQuery({
    queryKey: ['states'],
    queryFn: async () => api.getStates() as unknown as Promise<State[]>,
    staleTime: 1000 * 60 * 10,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => api.getCategories() as unknown as Promise<Category[]>,
    staleTime: 1000 * 60 * 10,
  });

  // Sync search query from navigation (e.g. hero search)
  useEffect(() => {
    if (!initialSearchDone && viewData?.searchQuery && typeof viewData.searchQuery === 'string') {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync viewData to local state on first load
      setSearch(viewData.searchQuery);
      setDebouncedSearch(viewData.searchQuery);
      setInitialSearchDone(true);
    }
  }, [viewData?.searchQuery, initialSearchDone]);

  // Sync category from navigation (e.g. landing page category click)
  useEffect(() => {
    if (!initialCategoryDone) {
      const catId = viewData?.categoryId as string | undefined;
      if (catId) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sync viewData to local state on first load
        setSelectedCategory(catId);
        setInitialCategoryDone(true);
      } else if (viewData?.category && typeof viewData.category === 'string') {
        // Map slug to category ID
        const allCats = (categoriesData ?? categories) as Category[];
        const match = allCats.find((c) => (c as unknown as { slug?: string }).slug === viewData.category);
        if (match) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- sync viewData to local state on first load
          setSelectedCategory(match.id);
        }
        setInitialCategoryDone(true);
      }
    }
  }, [viewData?.categoryId, viewData?.category, initialCategoryDone, categoriesData, categories]);

  const { data: productsResponse, isLoading, isError, error } = useQuery({
    queryKey: ['products', debouncedSearch, selectedCategory, condition, minPrice, maxPrice, deliveryOnly, selectedState?.id, selectedCity?.id, selectedArea?.id, sort, page],
    queryFn: async () => {
      const params: Record<string, string | number | undefined> = { page, limit: ITEMS_PER_PAGE, sort };
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (condition) params.condition = condition;
      if (minPrice) params.minPrice = Number(minPrice);
      if (maxPrice) params.maxPrice = Number(maxPrice);
      if (deliveryOnly) params.deliveryAvailable = 'true';
      if (selectedState) params.stateId = selectedState.id;
      if (selectedCity) params.cityId = selectedCity.id;
      return api.getProducts(params);
    },
  });

  const allProducts = (productsResponse?.products ?? []) as unknown as Product[];
  const products = useMemo(() => allProducts, [allProducts]);
  const totalPages = productsResponse?.totalPages ?? 1;
  const total = productsResponse?.total ?? 0;

  const locationLabel = useMemo(() => {
    if (selectedArea) return selectedArea.name;
    if (selectedCity) return selectedCity.name;
    if (selectedState) return selectedState.name;
    return null;
  }, [selectedState, selectedCity, selectedArea]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedCategory('');
    setCondition('');
    setMinPrice('');
    setMaxPrice('');
    setDeliveryOnly(false);
    setSort('recommended');
    setPage(1);
    setSelectedState(null);
    setSelectedCity(null);
    setSelectedArea(null);
  }, [setSelectedState, setSelectedCity, setSelectedArea]);

  const hasActiveFilters = !!(selectedCategory || condition || minPrice || maxPrice || deliveryOnly || selectedState || selectedCity || selectedArea);

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory((prev) => (prev === catId ? '' : catId));
    setPage(1);
  };

  const handleStateChange = (stateId: string) => {
    if (!stateId) { setSelectedState(null); } else {
      const st = (statesData ?? states).find((s) => s.id === stateId);
      if (st) setSelectedState(st);
    }
    setSelectedCity(null);
    setSelectedArea(null);
    setPage(1);
  };

  const handleCityChange = (cityId: string) => {
    if (!cityId) { setSelectedCity(null); } else {
      const c = cities.find((c) => c.id === cityId);
      if (c) setSelectedCity(c);
    }
    setSelectedArea(null);
    setPage(1);
  };

  const handleAreaChange = (areaId: string) => {
    if (!areaId) { setSelectedArea(null); } else {
      const a = areas.find((a) => a.id === areaId);
      if (a) setSelectedArea(a);
    }
    setPage(1);
  };

  const activeFilterCount = [selectedCategory, condition, minPrice, maxPrice, deliveryOnly, selectedState].filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-36" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-4 space-y-2.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-5 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[60vh] bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-[#0f172a] mb-2">Something went wrong</h2>
          <p className="text-[#64748b] mb-6">{(error as Error)?.message || 'Failed to load products'}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const catPillClass = (active: boolean) =>
    active
      ? 'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all bg-[#059669] text-white shadow-sm'
      : 'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all bg-white text-[#64748b] border border-[#e2e8f0] hover:border-[#059669] hover:text-[#059669]';

  const condPillClass = (active: boolean, color: string) =>
    active
      ? color || 'bg-[#059669] text-white border-[#059669]'
      : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#94a3b8] px-3 py-1.5 rounded-full text-xs font-medium border transition-all';

  return (
    <div className="min-h-[60vh] bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {locationLabel && (
          <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-sm text-emerald-800">
            <MapPin className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>Showing rentals in <strong>{locationLabel}</strong></span>
            <button onClick={() => { setSelectedState(null); setSelectedCity(null); setSelectedArea(null); setPage(1); }} className="ml-auto text-xs text-emerald-600 hover:text-emerald-800 font-medium underline">Change</button>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={sort} onValueChange={(v) => { setSort(v as SortOption); setPage(1); }}>
              <SelectTrigger className="h-9 w-44 bg-white border-[#e2e8f0] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(sortLabels) as [SortOption, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="hidden md:flex items-center gap-1.5">
              <Select value={selectedState?.id ?? ''} onValueChange={handleStateChange}>
                <SelectTrigger className="h-9 w-36 bg-white border-[#e2e8f0] text-sm">
                  <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#94a3b8]" /><SelectValue placeholder="All States" /></div>
                </SelectTrigger>
                <SelectContent>{((statesData ?? states) as State[]).map((st) => <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>)}</SelectContent>
              </Select>
              {selectedState && cities.length > 0 && (
                <Select value={selectedCity?.id ?? ''} onValueChange={handleCityChange}>
                  <SelectTrigger className="h-9 w-36 bg-white border-[#e2e8f0] text-sm"><SelectValue placeholder="All Cities" /></SelectTrigger>
                  <SelectContent>{cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              )}
              {selectedCity && areas.length > 0 && (
                <Select value={selectedArea?.id ?? ''} onValueChange={handleAreaChange}>
                  <SelectTrigger className="h-9 w-36 bg-white border-[#e2e8f0] text-sm"><SelectValue placeholder="All Areas" /></SelectTrigger>
                  <SelectContent>{areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={hasActiveFilters ? 'h-9 gap-2 text-sm bg-emerald-50 border-emerald-300 text-emerald-700' : 'h-9 gap-2 text-sm border-[#e2e8f0] text-[#64748b]'}>
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Filters</span>
                  {hasActiveFilters && <span className="h-5 w-5 rounded-full bg-[#059669] text-white text-[10px] flex items-center justify-center">{activeFilterCount}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-5" align="end">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-[#0f172a]">Filters</h3>
                    {hasActiveFilters && <button onClick={clearFilters} className="text-xs text-[#059669] hover:text-emerald-800 font-medium">Clear all</button>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#0f172a]">Condition</Label>
                    <div className="flex flex-wrap gap-2">
                      {conditionOptions.map((opt) => (
                        <button key={opt.value} onClick={() => { setCondition(opt.value); setPage(1); }} className={condPillClass(condition === opt.value, opt.color)}>{opt.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#0f172a] flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" /> Price Range / day</Label>
                    <div className="flex items-center gap-2">
                      <Input placeholder="Min" type="text" inputMode="numeric" pattern="[0-9]*" value={minPrice} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setMinPrice(v); setPage(1); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setFiltersOpen(false); } }} className="h-9 text-sm" />
                      <span className="text-[#94a3b8] text-sm">to</span>
                      <Input placeholder="Max" type="text" inputMode="numeric" pattern="[0-9]*" value={maxPrice} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setMaxPrice(v); setPage(1); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setFiltersOpen(false); } }} className="h-9 text-sm" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-[#0f172a]">Delivery Available</Label>
                      <p className="text-xs text-[#94a3b8]">Only items with home delivery</p>
                    </div>
                    <Switch checked={deliveryOnly} onCheckedChange={(v) => { setDeliveryOnly(v); setPage(1); }} />
                  </div>
                  <Button className="w-full bg-[#059669] hover:bg-[#047857] text-white" onClick={() => setFiltersOpen(false)}>Apply Filters</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="mb-5 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 overflow-x-auto pb-1 pr-4 sm:pr-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button onClick={() => { setSelectedCategory(''); setPage(1); }} className={catPillClass(!selectedCategory)}>All Items</button>
            {((categoriesData ?? categories) as Category[]).filter((c) => c.isActive).map((cat) => (
              <button key={cat.id} onClick={() => handleCategoryClick(cat.id)} className={catPillClass(selectedCategory === cat.id)}>{cat.name}</button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[#64748b]">
            Showing <span className="font-semibold text-[#0f172a]">{total}</span> {total === 1 ? 'result' : 'results'}
            {search && <> for &ldquo;<span className="font-medium text-[#0f172a]">{search}</span>&rdquo;</>}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-[#059669] hover:text-emerald-800 font-medium flex items-center gap-1">
              <X className="h-3 w-3" /> Clear all
            </button>
          )}
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-[#e2e8f0] flex items-center justify-center mb-4">
              <PackageOpen className="h-10 w-10 text-[#94a3b8]" />
            </div>
            <h3 className="text-lg font-semibold text-[#0f172a] mb-1">No items found</h3>
            <p className="text-[#64748b] text-sm max-w-sm mb-6">Try adjusting your filters or search.</p>
            <Button variant="outline" onClick={clearFilters}>Clear All Filters</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft className="h-4 w-4" /></Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, idx) => {
                    let pageNum: number;
                    if (totalPages <= 7) pageNum = idx + 1;
                    else if (page <= 4) pageNum = idx + 1;
                    else if (page >= totalPages - 3) pageNum = totalPages - 6 + idx;
                    else pageNum = page - 3 + idx;
                    return (
                      <Button key={pageNum} variant={page === pageNum ? 'default' : 'outline'} size="sm" onClick={() => setPage(pageNum)} className={page === pageNum ? 'bg-[#059669] hover:bg-[#047857] text-white' : 'border-[#e2e8f0] text-[#64748b]'}>{pageNum}</Button>
                    );
                  })}
                </div>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
