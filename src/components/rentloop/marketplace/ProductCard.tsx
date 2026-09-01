'use client';

import React, { useState } from 'react';
import {
  Star,
  Heart,
  MapPin,
  CheckCircle,
  Clock,
  IndianRupee,
  Camera,
  Laptop,
  Bike,
  Drill,
  Sofa,
  Tent,
  Gamepad2,
  Music,
  BookOpen,
  Dumbbell,
  Wrench,
  Shirt,
  Baby,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import type { Product } from '@/types';

/* ─── Icon & Color Mappings ────────────────────────────────── */

const categoryIcons: Record<string, LucideIcon> = {
  cameras: Camera,
  laptops: Laptop,
  bicycles: Bike,
  tools: Drill,
  furniture: Sofa,
  camping: Tent,
  gaming: Gamepad2,
  'musical-instruments': Music,
  books: BookOpen,
  fitness: Dumbbell,
  'home-improvement': Wrench,
  fashion: Shirt,
  'baby-equipment': Baby,
  'kitchen-appliances': Utensils,
};

const gradientMap: Record<string, string> = {
  cameras: 'from-rose-400 to-orange-300',
  laptops: 'from-violet-500 to-purple-300',
  bicycles: 'from-emerald-400 to-teal-300',
  tools: 'from-slate-500 to-gray-400',
  furniture: 'from-amber-400 to-yellow-300',
  camping: 'from-green-500 to-emerald-300',
  gaming: 'from-indigo-500 to-blue-400',
  'musical-instruments': 'from-pink-500 to-rose-300',
  books: 'from-yellow-500 to-amber-300',
  fitness: 'from-lime-500 to-green-300',
  'home-improvement': 'from-zinc-500 to-stone-400',
  fashion: 'from-fuchsia-500 to-pink-300',
  'baby-equipment': 'from-cyan-400 to-sky-300',
  'kitchen-appliances': 'from-red-400 to-orange-300',
};

const conditionLabels: Record<string, string> = {
  NEW: 'New',
  LIKE_NEW: 'Like New',
  GOOD: 'Good',
  FAIR: 'Fair',
  DAMAGED: 'Damaged',
};

const conditionColors: Record<string, string> = {
  NEW: 'bg-emerald-500 text-white',
  LIKE_NEW: 'bg-blue-500 text-white',
  GOOD: 'bg-amber-500 text-white',
  FAIR: 'bg-orange-500 text-white',
  DAMAGED: 'bg-red-500 text-white',
};

/* ─── Helpers ──────────────────────────────────────────────── */

function formatINR(amount: number): string {
  return amount.toLocaleString('en-IN');
}

/* ─── Star Rating Display ─────────────────────────────────── */

function StarRating({ rating, totalReviews }: { rating: number; totalReviews: number }) {
  if (totalReviews === 0) return null;

  // Clamp rating to valid 0-5 range to handle bad data
  const clampedRating = Math.max(0, Math.min(5, Number(rating) || 0));
  const clampedTotal = Math.max(0, Number(totalReviews) || 0);
  if (clampedTotal === 0) return null;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= Math.round(clampedRating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-200 text-slate-200'
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-slate-600">
        {clampedRating.toFixed(1)}
      </span>
      {clampedTotal > 0 && (
        <span className="text-xs text-slate-400">
          ({clampedTotal})
        </span>
      )}
    </div>
  );
}

/* ─── Props ────────────────────────────────────────────────── */

interface ProductCardProps {
  product: Product;
  onRent?: (product: Product) => void;
  onView?: (product: Product) => void;
  onFavorite?: (productId: string, currentState: boolean) => void;
  isFavorited?: boolean;
}

/* ─── Component ────────────────────────────────────────────── */

export default function ProductCard({
  product,
  onRent,
  onView,
  onFavorite,
  isFavorited: controlledFavorited,
}: ProductCardProps) {
  const navigate = useAppStore((s) => s.navigate);
  const user = useAppStore((s) => s.user);
  const setAuthModalOpen = useAppStore((s) => s.setAuthModalOpen);

  const [internalFavorited, setInternalFavorited] = useState(
    controlledFavorited ?? product.isFavorited ?? false
  );
  const [favLoading, setFavLoading] = useState(false);

  const isFavorited = controlledFavorited !== undefined ? controlledFavorited : internalFavorited;

  const Icon = categoryIcons[product.category?.slug] || Camera;
  const gradient = gradientMap[product.category?.slug] || 'from-slate-400 to-gray-300';

  const ownerInitial = product.owner.name?.charAt(0).toUpperCase() || '?';

  /* ── Handlers ── */

  const handleView = () => {
    if (onView) {
      onView(product);
    } else {
      navigate('product', { productId: product.id });
    }
  };

  const handleRent = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (onRent) {
      onRent(product);
    } else {
      navigate('product', { productId: product.id });
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (onFavorite) {
      onFavorite(product.id, isFavorited);
      return;
    }
    setFavLoading(true);
    try {
      const res = await api.toggleFavorite(product.id);
      setInternalFavorited(res.isFavorited);
    } catch {
      // silently fail
    } finally {
      setFavLoading(false);
    }
  };

  /* ── Render ── */

  return (
    <article
      className="group h-full rounded-lg bg-white shadow-sm border border-[#e2e8f0] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
      onClick={handleView}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleView();
        }
      }}
      aria-label={`Rent ${product.title} for ₹${formatINR(product.dailyPrice)} per day`}
    >
      {/* ─── Image Section ──────────────────────────────── */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* Actual image */}
        {product.images && product.images.length > 0 && product.images[0].url ? (
          <img
            src={product.images[0].url}
            alt={product.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
        {/* Fallback gradient with icon (only shown when NO image) */}
        {!product.images || product.images.length === 0 || !product.images[0].url ? (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center transition-transform duration-500 group-hover:scale-105`}
          >
            <Icon className="h-14 w-14 text-white/70" strokeWidth={1.5} />
          </div>
        ) : null}

        {/* Bottom gradient overlay for readability */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

        {/* Condition badge – top-left */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold shadow-sm ${
              conditionColors[product.condition] || 'bg-slate-500 text-white'
            }`}
          >
            {conditionLabels[product.condition] || product.condition}
          </span>
        </div>

        {/* Favorite heart – top-right */}
        <button
          onClick={handleFavorite}
          disabled={favLoading}
          className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isFavorited ? 'fill-red-500 text-red-500' : 'text-slate-400'
            }`}
          />
        </button>

        {/* Price badge – bottom-left on gradient */}
        <div className="absolute bottom-2.5 left-2.5 z-10">
          <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-md bg-orange-500 text-white text-sm font-bold shadow-sm">
            <IndianRupee className="h-3 w-3" />
            {formatINR(product.dailyPrice)}
            <span className="text-[10px] font-medium opacity-90">/day</span>
          </span>
        </div>

        {/* Rental count badge – bottom-right on gradient */}
        {product.totalRentals > 0 && (
          <div className="absolute bottom-2.5 right-2.5 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-[11px] font-medium text-slate-700 shadow-sm">
              <Clock className="h-3 w-3" />
              {product.totalRentals} rental{product.totalRentals > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* ─── Info Section ────────────────────────────────── */}
      <div className="flex flex-col gap-2.5 p-4 flex-1">
        {/* Category name */}
        <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide">
          {product.category?.name}
        </p>

        {/* Title – 2-line clamp */}
        <h3 className="font-bold text-[#0f172a] text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
          {product.title}
        </h3>

        {/* Rating stars */}
        <StarRating
          rating={product.avgRating}
          totalReviews={product.totalReviews}
        />

        {/* Pricing block */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-[#059669]">
              ₹{formatINR(product.dailyPrice)}
            </span>
            <span className="text-xs text-[#64748b]">/day</span>
          </div>
          {product.weeklyPrice && product.weeklyPrice > 0 && (
            <span className="text-xs text-[#94a3b8]">
              or ₹{formatINR(product.weeklyPrice)}/week
            </span>
          )}
          <span className="text-[11px] text-[#94a3b8]">
            Security deposit: ₹{formatINR(product.securityDeposit)}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-[#64748b] min-w-0">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#94a3b8]" />
          <span className="truncate">
            {product.city?.name}
            {product.state?.name ? `, ${product.state.name}` : ''}
          </span>
        </div>

        {/* Owner section */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-[#059669] text-white text-[11px] font-semibold">
              {ownerInitial}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-[#0f172a] truncate">
            {product.owner.name}
          </span>
          {product.owner.isVerified && (
            <span className="inline-flex items-center gap-0.5 shrink-0">
              <CheckCircle className="h-3.5 w-3.5 text-[#059669]" />
              <span className="text-[10px] font-semibold text-[#059669]">
                Verified
              </span>
            </span>
          )}
        </div>
      </div>

      {/* ─── Action Footer ───────────────────────────────── */}
      <div className="px-4 pb-4 pt-0 flex flex-col gap-2 mt-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleView();
          }}
          className="text-xs font-semibold text-[#059669] hover:text-[#047857] hover:underline transition-colors text-left self-start"
        >
          View Details →
        </button>
        <Button
          size="sm"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm h-9 rounded-md"
          onClick={handleRent}
        >
          Rent Now
        </Button>
      </div>
    </article>
  );
}
