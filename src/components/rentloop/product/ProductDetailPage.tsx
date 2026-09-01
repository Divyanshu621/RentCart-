'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  MapPin,
  ShieldCheck,
  Heart,
  MessageCircle,
  Truck,
  CalendarDays,
  Tag,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
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
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, differenceInDays, startOfDay, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import type { Product, Review } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import PaymentCheckoutModal from '@/components/rentloop/payment/PaymentCheckoutModal';

/** Clamp a rating value to valid 0-5 range */
function safeRating(v: unknown): number {
  return Math.max(0, Math.min(5, Number(v) || 0));
}

const categoryIcons: Record<string, LucideIcon> = {
  'cameras': Camera,
  'laptops': Laptop,
  'bicycles': Bike,
  'tools': Drill,
  'furniture': Sofa,
  'camping': Tent,
  'gaming': Gamepad2,
  'musical-instruments': Music,
  'books': BookOpen,
  'fitness': Dumbbell,
  'home-improvement': Wrench,
  'fashion': Shirt,
  'baby-equipment': Baby,
  'kitchen-appliances': Utensils,
};

const gradientMap: Record<string, string> = {
  'cameras': 'from-rose-400 to-orange-300',
  'laptops': 'from-violet-500 to-purple-300',
  'bicycles': 'from-emerald-400 to-teal-300',
  'tools': 'from-slate-500 to-gray-400',
  'furniture': 'from-amber-400 to-yellow-300',
  'camping': 'from-green-500 to-emerald-300',
  'gaming': 'from-indigo-500 to-blue-400',
  'musical-instruments': 'from-pink-500 to-rose-300',
  'books': 'from-yellow-500 to-amber-300',
  'fitness': 'from-lime-500 to-green-300',
  'home-improvement': 'from-zinc-500 to-stone-400',
  'fashion': 'from-fuchsia-500 to-pink-300',
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
  NEW: 'bg-emerald-100 text-emerald-700',
  LIKE_NEW: 'bg-sky-100 text-sky-700',
  GOOD: 'bg-amber-100 text-amber-700',
  FAIR: 'bg-orange-100 text-orange-700',
  DAMAGED: 'bg-red-100 text-red-700',
};

// Module-level ref holder for availability calendar (safe in 'use client')
const _calendarUnavailable = { current: new Set<string>() };

function AvailabilityDayButton({ day, modifiers, ...props }: React.ComponentProps<typeof CalendarDayButton>) {
  const dateStr = format(day.date, 'yyyy-MM-dd');
  const isUnavailable = _calendarUnavailable.current.has(dateStr);
  const isDisabled = modifiers.disabled;

  return (
    <CalendarDayButton
      day={day}
      modifiers={modifiers}
      {...props}
      className={cn(
        isDisabled
          ? 'opacity-40 text-slate-300'
          : isUnavailable
            ? 'bg-red-100 text-red-600 line-through hover:bg-red-100'
            : 'bg-emerald-50 hover:bg-emerald-100',
      )}
    />
  );
}

export default function ProductDetailPage() {
  const goBack = useAppStore((s) => s.goBack);
  const navigate = useAppStore((s) => s.navigate);
  const user = useAppStore((s) => s.user);
  const setAuthModalOpen = useAppStore((s) => s.setAuthModalOpen);
  const viewData = useAppStore((s) => s.viewData);

  const productId = viewData.productId as string;

  // Dates
  const today = startOfDay(new Date());
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [calOpen, setCalOpen] = useState<'start' | 'end' | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingRentalId, setPendingRentalId] = useState('');
  const [selectedImage, setSelectedImage] = useState<{id: string; url: string; altText?: string} | null>(null);

  // Fetch product
  const { data: productData, isLoading, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.getProduct(productId),
    enabled: !!productId,
  });

  const product = productData as unknown as Product | undefined;

  // Fetch reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: () => api.getProductReviews(productId),
    enabled: !!productId,
  });

  const reviews = (reviewsData?.reviews ?? []) as unknown as Review[];
  const reviewsTotal = reviewsData?.total ?? 0;

  // Check availability
  const { data: availabilityData } = useQuery({
    queryKey: ['availability', productId, startDate, endDate],
    queryFn: () =>
      api.checkAvailability(productId!, format(startDate!, 'yyyy-MM-dd'), format(endDate!, 'yyyy-MM-dd')),
    enabled: !!productId && !!startDate && !!endDate && !!(differenceInDays(endDate, startDate) > 0),
  });

  const isAvailable = availabilityData?.available ?? true;
  const unavailableDates = (availabilityData?.unavailableDates ?? []) as string[];

  // Fetch calendar availability (all unavailable dates for next 90 days)
  const { data: calendarAvailData } = useQuery({
    queryKey: ['calendar-availability', productId],
    queryFn: () => api.getCalendarAvailability(productId!),
    enabled: !!productId,
  });
  const calendarUnavailableDates = useMemo(() => {
    const dates = calendarAvailData?.unavailableDates ?? [];
    return new Set(dates as string[]);
  }, [calendarAvailData]);

  // Sync module-level ref for the calendar Day component (via effect to satisfy lint)
  React.useEffect(() => {
    _calendarUnavailable.current = calendarUnavailableDates;
  }, [calendarUnavailableDates]);

  // Create rental mutation
  const queryClient = useQueryClient();
  const createRentalMutation = useMutation({
    mutationFn: (data: { productId: string; startDate: string; endDate: string; couponCode?: string }) =>
      api.createRental(data),
    onSuccess: (res: Record<string, unknown>) => {
      const rental = res.rental as { id: string } | undefined;
      if (rental?.id) {
        setPendingRentalId(rental.id);
        setPaymentModalOpen(true);
      } else {
        toast.success('Rental created! Please proceed to payment.');
        queryClient.invalidateQueries({ queryKey: ['rentals'] });
        queryClient.invalidateQueries({ queryKey: ['my-rentals'] });
        navigate('my-rentals');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create rental. Please try again.');
    },
  });

  // Favorite toggle mutation
  const favMutation = useMutation({
    mutationFn: () => api.toggleFavorite(productId),
    onSuccess: (res) => {
      setIsFavorited(res.isFavorited);
    },
  });

  // Coupon mutation
  const couponMutation = useMutation({
    mutationFn: () => api.validateCoupon(couponCode, rentalCalc.rentalAmount),
    onSuccess: (res: Record<string, unknown>) => {
      const coupon = res as { valid: boolean; discount: number; message: string };
      if (coupon.valid) {
        setCouponApplied(true);
        setCouponDiscount(coupon.discount as number);
      }
    },
  });

  // Favorite state derived from product data or local toggle
  const effectiveFavorited = product?.isFavorited ?? isFavorited;

  // Rental Calculator
  function computeRentalCalc() {
    if (!product || !startDate || !endDate) {
      return {
        days: 0,
        dailyRate: 0,
        rentalAmount: 0,
        platformFee: 0,
        tax: 0,
        deliveryFee: 0,
        securityDeposit: 0,
        total: 0,
      };
    }

    const days = Math.max(differenceInDays(endDate, startDate), 0);
    const dailyRate = product.dailyPrice;
    const rentalAmount = days * dailyRate;
    const platformFee = Math.round(rentalAmount * 0.1);
    const tax = Math.round(rentalAmount * 0.18);
    const deliveryFee = product.deliveryAvailable ? product.deliveryFee : 0;
    const securityDeposit = product.securityDeposit;
    const discount = couponApplied ? couponDiscount : 0;
    const total = Math.max(rentalAmount + platformFee + tax + deliveryFee + securityDeposit - discount, 0);

    return { days, dailyRate, rentalAmount, platformFee, tax, deliveryFee, securityDeposit, total, discount };
  }

  const rentalCalc = computeRentalCalc();

  // State match check
  const isNotApproved = product?.status !== 'APPROVED';
  // State match check (informational only - cross-state rentals allowed)

  const handleRentNow = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (isNotApproved) {
      toast.error('This product is not available for rental');
      return;
    }
    if (!startDate || !endDate || !isDateValid) return;
    createRentalMutation.mutate({
      productId,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      couponCode: couponApplied ? couponCode : undefined,
    });
  };

  const handleMessage = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    // Navigate to conversation with owner
    navigate('conversation', { otherUserId: product?.owner.id, productId });
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    couponMutation.mutate();
  };

  // Validation messages
  const dateValidationError = useMemo(() => {
    if (!startDate || !endDate) return null;
    const days = differenceInDays(endDate, startDate);
    if (days <= 0) return 'End date must be after start date.';
    if (product?.minRentalDays && days < product.minRentalDays)
      return `Minimum rental is ${product.minRentalDays} day${product.minRentalDays > 1 ? 's' : ''}.`;
    if (product?.maxRentalDays && days > product.maxRentalDays)
      return `Maximum rental is ${product.maxRentalDays} days.`;
    return null;
  }, [startDate, endDate, product?.minRentalDays, product?.maxRentalDays]);

  const isDateValid = !dateValidationError;

  // Star breakdown
  const starBreakdown = useMemo(() => {
    const breakdown = [0, 0, 0, 0, 0]; // 1-5
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        breakdown[r.rating - 1]++;
      }
    });
    return breakdown;
  }, [reviews]);

  // --- Loading Skeleton ---
  if (isLoading || !product) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Product not found</h2>
          <Button variant="outline" onClick={goBack} className="mt-4 border-slate-200">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const Icon = categoryIcons[product.category.slug] || Camera;
  const gradient = gradientMap[product.category.slug] || 'from-slate-400 to-gray-300';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 hover:text-slate-900 transition-colors mb-4 sm:mb-6 group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to marketplace
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
          {/* Left: Image Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="space-y-3">
              {/* Main Image */}
              <div className="aspect-square rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm">
                {product.images.length > 0 ? (
                  <img
                    src={selectedImage?.url || product.images[0].url}
                    alt={selectedImage?.altText || product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                    <Icon className="h-32 w-32 text-white/60" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              {/* Thumbnail strip when multiple images */}
              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {product.images.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(img)}
                      className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage?.id === img.id
                          ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.altText || product.title}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Right: Product Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-5"
          >
            {/* Title & Badges */}
            <div>
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-slate-900 leading-tight">{product.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                      {product.category.name}
                    </Badge>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${conditionColors[product.condition] || 'bg-slate-100 text-slate-600'}`}>
                      {conditionLabels[product.condition] || product.condition}
                    </span>
                    {product.brand && (
                      <span className="text-xs text-slate-500">{product.brand}{product.model ? ` · ${product.model}` : ''}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!user) {
                      n('login');
                      setAuthModalOpen(true);
                      return;
                    }
                    favMutation.mutate();
                  }}
                  className="p-2 rounded-full border border-slate-200 hover:bg-red-50 transition-colors"
                  aria-label="Toggle favorite"
                >
                  <Heart className={`h-5 w-5 ${effectiveFavorited ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                </button>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(safeRating(product.avgRating))
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-200 text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {safeRating(product.avgRating) > 0 ? safeRating(product.avgRating).toFixed(1) : 'No ratings yet'}
                </span>
                <span className="text-sm text-slate-400">
                  ({product.totalReviews} review{product.totalReviews !== 1 ? 's' : ''})
                </span>
                <span className="text-sm text-slate-400">·</span>
                <span className="text-sm text-slate-400">{product.totalRentals} rental{product.totalRentals !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <Separator />

            {/* Price Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-emerald-600">₹{product.dailyPrice.toLocaleString('en-IN')}</span>
                <span className="text-sm text-slate-400">/day</span>
              </div>
              {product.weeklyPrice && (
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-lg font-semibold text-slate-700">₹{product.weeklyPrice.toLocaleString('en-IN')}</span>
                  <span className="text-sm text-slate-400">/week</span>
                  <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                    Save {Math.round((1 - product.weeklyPrice / (product.dailyPrice * 7)) * 100)}%
                  </Badge>
                </div>
              )}
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span>Security Deposit: <strong className="text-slate-700">₹{product.securityDeposit.toLocaleString('en-IN')}</strong></span>
                {product.deliveryAvailable && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <Truck className="h-4 w-4" />
                    Delivery ₹{product.deliveryFee.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>

            {/* Owner Info */}
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className="bg-[#0f172a] text-white text-sm font-semibold">
                        {product.owner.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 text-sm">{product.owner.name}</span>
                        {product.owner.isVerified && (
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {safeRating(product.owner?.avgRating) > 0 ? safeRating(product.owner?.avgRating).toFixed(1) : 'New'}
                        </span>
                        <span>·</span>
                        <span>{product.totalRentals} rentals</span>
                        <span>·</span>
                        <span>Trust: {product.owner.trustScore != null ? `${product.owner.trustScore}%` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMessage}
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <div className="flex items-start gap-3 bg-white rounded-xl border border-slate-200 p-4">
              <MapPin className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900">
                  {product.city?.name}{product.state?.name ? `, ${product.state.name}` : ''}
                </div>
                {product.pickupAddress && (
                  <p className="text-xs text-slate-500 mt-0.5">{product.pickupAddress}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.deliveryAvailable && (
                    <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                      <Truck className="h-3 w-3" />
                      Delivery Available
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Tabs: Description, Rules, Cancellation */}
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="bg-slate-100 w-full h-10">
                <TabsTrigger value="description" className="text-xs sm:text-sm flex-1">Description</TabsTrigger>
                <TabsTrigger value="rules" className="text-xs sm:text-sm flex-1">Rental Rules</TabsTrigger>
                <TabsTrigger value="cancellation" className="text-xs sm:text-sm flex-1">Cancellation</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="mt-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {product.description || 'No description provided.'}
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {product.brand && (
                      <div className="text-xs"><span className="text-slate-400">Brand:</span> <span className="font-medium text-slate-700">{product.brand}</span></div>
                    )}
                    {product.model && (
                      <div className="text-xs"><span className="text-slate-400">Model:</span> <span className="font-medium text-slate-700">{product.model}</span></div>
                    )}
                    {product.purchaseYear && (
                      <div className="text-xs"><span className="text-slate-400">Year:</span> <span className="font-medium text-slate-700">{product.purchaseYear}</span></div>
                    )}
                    <div className="text-xs"><span className="text-slate-400">Min Rental:</span> <span className="font-medium text-slate-700">{product.minRentalDays} day{product.minRentalDays > 1 ? 's' : ''}</span></div>
                    <div className="text-xs"><span className="text-slate-400">Max Rental:</span> <span className="font-medium text-slate-700">{product.maxRentalDays} days</span></div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="rules" className="mt-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {product.rentalRules || 'No specific rental rules provided by the owner.'}
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="cancellation" className="mt-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {product.cancellationPolicy || 'Standard cancellation policy applies. Please contact the owner for details.'}
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            {/* Rental Calculator */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-emerald-600" />
                  Rental Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Pickers */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Start Date</Label>
                    <Popover open={calOpen === 'start'} onOpenChange={(o) => setCalOpen(o ? 'start' : null)}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-10 border-slate-200"
                        >
                          {startDate ? format(startDate, 'dd MMM yyyy') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(d) => {
                            setStartDate(d);
                            if (d && endDate && differenceInDays(endDate, d) < 0) {
                              setEndDate(undefined);
                            }
                            setCalOpen(null);
                          }}
                          disabled={{ before: today }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">End Date</Label>
                    <Popover open={calOpen === 'end'} onOpenChange={(o) => setCalOpen(o ? 'end' : null)}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal h-10 border-slate-200 ${!startDate ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={!startDate}
                        >
                          {endDate ? format(endDate, 'dd MMM yyyy') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(d) => {
                            setEndDate(d);
                            setCalOpen(null);
                          }}
                          disabled={{ before: addDays(startDate!, product?.minRentalDays ? product.minRentalDays : 1) }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Date Validation Error */}
                {startDate && endDate && dateValidationError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200"
                  >
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <span className="text-sm text-red-700">{dateValidationError}</span>
                  </motion.div>
                )}

                {/* Calculation Breakdown */}
                {startDate && endDate && rentalCalc.days > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3 bg-slate-50 rounded-lg p-4"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Rental Duration</span>
                      <span className="font-medium text-slate-900">{rentalCalc.days} day{rentalCalc.days > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Daily Rate</span>
                      <span className="font-medium text-slate-900">₹{rentalCalc.dailyRate.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Rental Amount</span>
                      <span className="font-medium text-slate-900">₹{rentalCalc.rentalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Platform Fee (10%)</span>
                      <span className="font-medium text-slate-900">₹{rentalCalc.platformFee.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Tax (18% GST)</span>
                      <span className="font-medium text-slate-900">₹{rentalCalc.tax.toLocaleString('en-IN')}</span>
                    </div>
                    {rentalCalc.deliveryFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Delivery Fee</span>
                        <span className="font-medium text-slate-900">₹{rentalCalc.deliveryFee.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Security Deposit</span>
                      <span className="font-medium text-slate-900">₹{rentalCalc.securityDeposit.toLocaleString('en-IN')}</span>
                    </div>
                    {couponApplied && rentalCalc.discount > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span className="font-medium">Coupon Discount</span>
                        <span className="font-medium">-₹{rentalCalc.discount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-base font-bold">
                      <span className="text-slate-900">Total</span>
                      <span className="text-emerald-600">₹{rentalCalc.total.toLocaleString('en-IN')}</span>
                    </div>
                  </motion.div>
                )}

                {/* Coupon Code */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value); setCouponApplied(false); setCouponDiscount(0); }}
                      className="pl-9 h-10 border-slate-200"
                      disabled={!startDate || !endDate || !isDateValid}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim() || !startDate || !endDate || !isDateValid || couponMutation.isPending}
                    className="h-10 border-slate-200"
                  >
                    {couponMutation.isPending ? 'Applying...' : 'Apply'}
                  </Button>
                </div>
                {couponApplied && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Coupon applied! You save ₹{couponDiscount.toLocaleString('en-IN')}
                  </div>
                )}
                {couponMutation.isError && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600">
                    <XCircle className="h-3.5 w-3.5" />
                    Invalid coupon code
                  </div>
                )}

                {/* Rent Now CTA - hidden on mobile (shown in sticky bar) */}
                <Button
                  size="lg"
                  className={`w-full h-12 text-base font-semibold hidden md:flex ${
                    isNotApproved || !startDate || !endDate || !isDateValid
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                  onClick={handleRentNow}
                  disabled={isNotApproved || !startDate || !endDate || !isDateValid || createRentalMutation.isPending}
                >
                  {createRentalMutation.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating Rental...</>
                    : isNotApproved
                      ? 'Not Available for Rental'
                      : !startDate
                      ? 'Select Start Date'
                      : !endDate
                        ? 'Select End Date'
                          : dateValidationError || 'Rent Now'}
                </Button>

                {!user && startDate && endDate && rentalCalc.days > 0 && (
                  <p className="text-xs text-center text-slate-500">
                    You&apos;ll need to sign in to complete the rental
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Availability Calendar & Reviews - Below */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 mt-10">
          {/* Availability Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-600" />
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <Calendar
                    mode="default"
                    disabled={[{ before: today }]}
                    className="rounded-md border"
                    components={{
                      DayButton: AvailabilityDayButton,
                    }}
                  />
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
                    <span>Unavailable</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Reviews Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                  Reviews ({reviewsTotal})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Star Breakdown */}
                <div className="flex items-start gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-900">
                      {safeRating(product.avgRating) > 0 ? safeRating(product.avgRating).toFixed(1) : '—'}
                    </div>
                    <div className="flex items-center gap-0.5 mt-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < Math.round(safeRating(product.avgRating)) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{reviewsTotal} review{reviewsTotal !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = starBreakdown[star - 1];
                      const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="w-3 text-right text-slate-600">{star}</span>
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-6 text-right text-slate-400">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Review List */}
                <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                  {reviews.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">No reviews yet. Be the first to review this item!</p>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2.5 mb-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-semibold">
                              {review.reviewer.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-900 truncate">{review.reviewer.name}</span>
                              <span className="text-xs text-slate-400">
                                {format(new Date(review.createdAt), 'dd MMM yyyy')}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-slate-600 leading-relaxed ml-10">{review.comment}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        {/* Mobile sticky bottom CTA - only visible on mobile when dates are selected */}
        {startDate && endDate && rentalCalc.days > 0 && (
          <div className="fixed bottom-16 left-0 right-0 z-30 bg-white border-t border-slate-200 px-4 py-3 safe-area-bottom md:hidden">
            <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Total for {rentalCalc.days} days</p>
                <p className="text-lg font-bold text-slate-900">₹{rentalCalc.total.toLocaleString('en-IN')}</p>
              </div>
              <Button
                size="lg"
                className={`h-12 px-6 font-semibold ${!user || isNotApproved ? 'bg-slate-300 text-slate-500' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                onClick={handleRentNow}
                disabled={!user || isNotApproved || createRentalMutation.isPending}
              >
                {createRentalMutation.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing...</>
                  : !user ? 'Sign in to Rent' : 'Rent Now'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <PaymentCheckoutModal
        open={paymentModalOpen}
        onClose={() => { setPaymentModalOpen(false); setPendingRentalId(''); }}
        rentalId={pendingRentalId}
        rentalData={startDate && endDate ? {
          totalAmount: rentalCalc.total,
          rentalAmount: rentalCalc.rentalAmount,
          platformFee: rentalCalc.platformFee,
          tax: rentalCalc.tax,
          deliveryFee: rentalCalc.deliveryFee,
          discount: rentalCalc.discount,
          securityDeposit: rentalCalc.securityDeposit,
          rentalDays: rentalCalc.days,
          dailyRate: rentalCalc.dailyRate,
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          productTitle: (productData as Record<string, unknown>)?.title as string || undefined,
        } : null}
        onSuccess={() => {
          setPaymentModalOpen(false);
          setPendingRentalId('');
          queryClient.invalidateQueries({ queryKey: ['rentals'] });
          queryClient.invalidateQueries({ queryKey: ['my-rentals'] });
          navigate('my-rentals');
        }}
      />
    </div>
  );
}
