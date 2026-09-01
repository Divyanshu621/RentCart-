'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Clock,
  CalendarRange,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CreditCard,
  RotateCcw,
  Timer,
  Eye,
  Phone,
  Loader2,
  PackageOpen,
  ChevronRight,
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
import { Card, CardContent } from '@/components/ui/card';
import PaymentCheckoutModal from '@/components/rentloop/payment/PaymentCheckoutModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import type { Rental, RentalStatus } from '@/types';
import { toast } from 'sonner';
import RentalDetailDialog from './RentalDetailDialog';
import CancelRentalDialog from './CancelRentalDialog';

// ─── Category Icons ────────────────────────────────────────
const categoryIcons: Record<string, LucideIcon> = {
  cameras: Camera, laptops: Laptop, bicycles: Bike, tools: Drill, furniture: Sofa,
  camping: Tent, gaming: Gamepad2, 'musical-instruments': Music, books: BookOpen,
  fitness: Dumbbell, 'home-improvement': Wrench, fashion: Shirt,
  'baby-equipment': Baby, 'kitchen-appliances': Utensils,
};

// ─── Status Color Mapping ──────────────────────────────────
const statusColors: Record<RentalStatus, string> = {
  PENDING_PAYMENT: 'bg-amber-100 text-amber-700 border-amber-200',
  PAYMENT_COMPLETED: 'bg-sky-100 text-sky-700 border-sky-200',
  OWNER_PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  OWNER_ACCEPTED: 'bg-blue-100 text-blue-700 border-blue-200',
  OWNER_REJECTED: 'bg-red-100 text-red-700 border-red-200',
  READY_FOR_PICKUP: 'bg-sky-100 text-sky-700 border-sky-200',
  OUT_FOR_DELIVERY: 'bg-sky-100 text-sky-700 border-sky-200',
  ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  RETURN_PENDING: 'bg-orange-100 text-orange-700 border-orange-200',
  RETURNED: 'bg-blue-100 text-blue-700 border-blue-200',
  INSPECTION: 'bg-sky-100 text-sky-700 border-sky-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
  DISPUTED: 'bg-red-100 text-red-700 border-red-200',
  OVERDUE: 'bg-red-100 text-red-700 border-red-200',
};

const statusLabels: Record<RentalStatus, string> = {
  PENDING_PAYMENT: 'Pending Payment',
  PAYMENT_COMPLETED: 'Payment Done',
  OWNER_PENDING: 'Pending Approval',
  OWNER_ACCEPTED: 'Accepted',
  OWNER_REJECTED: 'Rejected',
  READY_FOR_PICKUP: 'Ready for Pickup',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  ACTIVE: 'Active',
  RETURN_PENDING: 'Return Pending',
  RETURNED: 'Returned',
  INSPECTION: 'Under Inspection',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DISPUTED: 'Disputed',
  OVERDUE: 'Overdue',
};

// ─── Tab Mapping ───────────────────────────────────────────
type TabKey = 'all' | 'upcoming' | 'active' | 'returning' | 'completed' | 'cancelled' | 'overdue';

const statusToTab: Record<RentalStatus, TabKey> = {
  PENDING_PAYMENT: 'upcoming',
  PAYMENT_COMPLETED: 'upcoming',
  OWNER_PENDING: 'upcoming',
  OWNER_ACCEPTED: 'upcoming',
  OWNER_REJECTED: 'cancelled',
  READY_FOR_PICKUP: 'upcoming',
  OUT_FOR_DELIVERY: 'upcoming',
  ACTIVE: 'active',
  RETURN_PENDING: 'returning',
  RETURNED: 'returning',
  INSPECTION: 'returning',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'overdue',
  OVERDUE: 'overdue',
};

// ─── Countdown Timer ───────────────────────────────────────
function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Overdue');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      if (days > 0) setTimeLeft(`${days}d ${hours}h ${mins}m`);
      else if (hours > 0) setTimeLeft(`${hours}h ${mins}m ${secs}s`);
      else setTimeLeft(`${mins}m ${secs}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return (
    <span className={`text-xs font-mono font-medium ${timeLeft === 'Overdue' ? 'text-red-600' : 'text-emerald-600'}`}>
      {timeLeft}
    </span>
  );
}

// ─── Gradient Maps ─────────────────────────────────────────
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

// ─── Rental Card Skeleton ──────────────────────────────────
function RentalCardSkeleton() {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Skeleton className="h-20 w-20 rounded-lg shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Rental Card ───────────────────────────────────────────
function RentalCard({
  rental,
  onSelect,
  onAction,
  isAccepting,
}: {
  rental: Rental;
  onSelect: (r: Rental) => void;
  onAction: (r: Rental, action: string) => void;
  isAccepting?: boolean;
}) {
  const user = useAppStore((s) => s.user);
  const isOwner = user?.id === rental.ownerId;
  const isCustomer = user?.id === rental.customerId;
  const categorySlug = rental.product?.category?.slug || '';
  const Icon = categoryIcons[categorySlug] || Camera;
  const gradient = gradientMap[categorySlug] || 'from-slate-400 to-gray-300';

  const isActive = rental.status === 'ACTIVE';
  const isOverdue = rental.status === 'OVERDUE';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="border-slate-200 bg-white hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onSelect(rental)}
      >
        <CardContent className="p-3 sm:p-4">
          <div className="flex gap-3 sm:gap-4">
            {/* Thumbnail */}
            <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
              <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white/80" strokeWidth={1.5} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 text-xs sm:text-sm truncate">{rental.product.title}</h3>
              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 mt-1">
                <CalendarRange className="h-3 w-3" />
                <span>{format(new Date(rental.startDate), 'dd MMM yyyy')}</span>
                <span>→</span>
                <span>{format(new Date(rental.endDate), 'dd MMM yyyy')}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-400 mt-0.5">
                <Clock className="h-3 w-3" />
                <span>{rental.rentalDays} days</span>
              </div>
              {/* Countdown for active rentals */}
              {(isActive || isOverdue) && (
                <div className="flex items-center gap-1 mt-1">
                  <Timer className="h-3 w-3 text-slate-400" />
                  <CountdownTimer endDate={rental.endDate} />
                </div>
              )}
            </div>

            {/* Right: Status + Amount + Actions */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusColors[rental.status]}`}>
                {statusLabels[rental.status]}
              </span>
              <span className="text-sm font-bold text-slate-900">₹{rental.totalAmount.toLocaleString('en-IN')}</span>
              {/* Action buttons */}
              <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                {rental.status === 'PENDING_PAYMENT' && isCustomer && (
                  <>
                    <Button size="sm" className="h-11 sm:h-7 px-3 sm:px-2.5 text-xs sm:text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onAction(rental, 'pay')}>
                      <CreditCard className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />Pay Now
                    </Button>
                    <Button size="sm" variant="outline" className="h-11 sm:h-7 px-3 sm:px-2.5 text-xs sm:text-[11px] border-red-200 text-red-600 hover:bg-red-50" onClick={() => onAction(rental, 'cancel')}>
                      <XCircle className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />Cancel
                    </Button>
                  </>
                )}
                {rental.status === 'OWNER_PENDING' && (
                  <>
                    {isOwner && (
                      <>
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px] border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => onAction(rental, 'accept')} disabled={isAccepting}>
                          <CheckCircle2 className="h-3 w-3 mr-1" />Accept
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px] border-red-200 text-red-600 hover:bg-red-50" onClick={() => onAction(rental, 'reject')}>
                          <XCircle className="h-3 w-3 mr-1" />Reject
                        </Button>
                      </>
                    )}
                    {isCustomer && (
                      <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px] border-red-200 text-red-600 hover:bg-red-50" onClick={() => onAction(rental, 'cancel')}>
                        <XCircle className="h-3 w-3 mr-1" />Cancel
                      </Button>
                    )}
                  </>
                )}
                {(rental.status === 'OWNER_ACCEPTED' || rental.status === 'PAYMENT_COMPLETED' || rental.status === 'READY_FOR_PICKUP') && isCustomer && (
                  <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px] border-red-200 text-red-600 hover:bg-red-50" onClick={() => onAction(rental, 'cancel')}>
                    <XCircle className="h-3 w-3 mr-1" />Cancel
                  </Button>
                )}
                {rental.status === 'OWNER_ACCEPTED' && isOwner && (
                  <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px]" onClick={() => onSelect(rental)}>
                    <Eye className="h-3 w-3 mr-1" />View
                  </Button>
                )}
                {rental.status === 'ACTIVE' && isCustomer && (
                  <>
                    <Button size="sm" className="h-11 sm:h-7 px-3 sm:px-2.5 text-xs sm:text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onAction(rental, 'return')}>
                      <RotateCcw className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />Start Return
                    </Button>
                    <Button size="sm" variant="outline" className="h-11 sm:h-7 px-3 sm:px-2.5 text-xs sm:text-[11px]" onClick={() => onAction(rental, 'extend')}>
                      <Timer className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />Extend
                    </Button>
                  </>
                )}
                {rental.status === 'RETURN_PENDING' && isOwner && (
                  <Button size="sm" className="h-11 sm:h-7 px-3 sm:px-2.5 text-xs sm:text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onAction(rental, 'confirmReturn')}>
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />Confirm Return
                  </Button>
                )}
                {rental.status === 'OVERDUE' && isCustomer && (
                  <>
                    <Button size="sm" className="h-11 sm:h-7 px-3 sm:px-2.5 text-xs sm:text-[11px] bg-red-600 hover:bg-red-700 text-white" onClick={() => onAction(rental, 'return')}>
                      <RotateCcw className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />Return Now
                    </Button>
                    <Button size="sm" variant="outline" className="h-11 sm:h-7 px-3 sm:px-2.5 text-xs sm:text-[11px]" onClick={() => onAction(rental, 'contact')}>
                      <Phone className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />Contact
                    </Button>
                  </>
                )}
                {rental.status === 'COMPLETED' && isCustomer && (
                  <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px] border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => onAction(rental, 'rentAgain')}>
                    Rent Again
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-slate-400" onClick={() => onSelect(rental)}>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Empty State ───────────────────────────────────────────
function EmptyState({ tab }: { tab: TabKey }) {
  const messages: Record<TabKey, { title: string; desc: string }> = {
    all: { title: 'No rentals yet', desc: 'When you rent or lend items, they will appear here.' },
    upcoming: { title: 'No upcoming rentals', desc: 'Your upcoming rentals will show here.' },
    active: { title: 'No active rentals', desc: 'Currently, you have no active rentals.' },
    returning: { title: 'No returns in progress', desc: 'Return requests will appear here.' },
    completed: { title: 'No completed rentals', desc: 'Completed rentals will show here.' },
    cancelled: { title: 'No cancelled rentals', desc: 'Cancelled rentals will appear here.' },
    overdue: { title: 'No overdue rentals', desc: 'Overdue rentals will show here.' },
  };
  const msg = messages[tab];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <PackageOpen className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{msg.title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">{msg.desc}</p>
      <Button
        className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
        onClick={() => useAppStore.getState().navigate('marketplace')}
      >
        Browse Marketplace
      </Button>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function MyRentalsPage() {
  const navigate = useAppStore((s) => s.navigate);
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentRental, setPaymentRental] = useState<Rental | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelRental, setCancelRental] = useState<Rental | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  // Fetch rentals as customer
  const { data: customerRentals = [], isLoading: loadingCustomer } = useQuery({
    queryKey: ['rentals', 'customer'],
    queryFn: async () => {
      const data = await api.getRentals({ role: 'customer' });
      return Array.isArray((data as any).rentals) ? (data as any).rentals as Rental[] : [];
    },
    enabled: !!user,
  });

  // Fetch rentals as owner
  const { data: ownerRentals = [], isLoading: loadingOwner } = useQuery({
    queryKey: ['rentals', 'owner'],
    queryFn: async () => {
      const data = await api.getRentals({ role: 'owner' });
      return Array.isArray((data as any).rentals) ? (data as any).rentals as Rental[] : [];
    },
    enabled: !!user,
  });

  // Merge and deduplicate
  const allRentals = (() => {
    const map = new Map<string, Rental>();
    for (const r of [...customerRentals, ...ownerRentals]) {
      map.set(r.id, r as Rental);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  })();

  const isLoading = loadingCustomer || loadingOwner;

  // Filter by tab
  const filteredRentals = activeTab === 'all'
    ? allRentals
    : allRentals.filter((r) => statusToTab[r.status] === activeTab);

  // Mutations
  const payMutation = useMutation({
    mutationFn: (id: string) => api.payRental(id),
    onSuccess: () => { toast.success('Payment successful!'); queryClient.invalidateQueries({ queryKey: ['rentals'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => api.cancelRental(id, reason),
    onSuccess: () => {
      setCancelSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => api.acceptRental(id),
    onSuccess: () => { toast.success('Rental accepted'); queryClient.invalidateQueries({ queryKey: ['rentals'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.rejectRental(id),
    onSuccess: () => { toast.success('Rental rejected'); queryClient.invalidateQueries({ queryKey: ['rentals'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const returnMutation = useMutation({
    mutationFn: (id: string) => api.returnRental(id),
    onSuccess: () => { toast.success('Return initiated'); queryClient.invalidateQueries({ queryKey: ['rentals'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleAction = useCallback((rental: Rental, action: string) => {
    switch (action) {
      case 'pay':
        setPaymentRental(rental);
        setPaymentModalOpen(true);
        break;
      case 'cancel':
        setCancelRental(rental);
        setCancelDialogOpen(true);
        break;
      case 'reject':
        rejectMutation.mutate(rental.id);
        break;
      case 'accept':
        acceptMutation.mutate(rental.id);
        break;
      case 'return':
        returnMutation.mutate(rental.id);
        break;
      case 'extend':
        setSelectedRental(rental);
        setDetailOpen(true);
        break;
      case 'confirmReturn':
        returnMutation.mutate(rental.id);
        break;
      case 'contact':
        navigate('messages');
        break;
      case 'rentAgain':
        navigate('product', { productId: rental.productId });
        break;
    }
  }, [payMutation, cancelMutation, acceptMutation, rejectMutation, returnMutation, navigate]);

  const handleSelect = (rental: Rental) => {
    setSelectedRental(rental);
    setDetailOpen(true);
  };

  // Tab counts
  const tabCounts: Record<TabKey, number> = {
    all: allRentals.length,
    upcoming: allRentals.filter((r) => statusToTab[r.status] === 'upcoming').length,
    active: allRentals.filter((r) => statusToTab[r.status] === 'active').length,
    returning: allRentals.filter((r) => statusToTab[r.status] === 'returning').length,
    completed: allRentals.filter((r) => statusToTab[r.status] === 'completed').length,
    cancelled: allRentals.filter((r) => statusToTab[r.status] === 'cancelled').length,
    overdue: allRentals.filter((r) => statusToTab[r.status] === 'overdue').length,
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 sm:pb-0">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 h-16">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900" onClick={() => navigate('dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-1" />Back
            </Button>
            <div className="h-6 w-px bg-slate-200" />
            <h1 className="text-lg font-bold text-slate-900">My Rentals</h1>
            <span className="text-sm text-slate-400 ml-1">({allRentals.length})</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="mb-6">
          <TabsList className="bg-slate-100 p-1 h-auto flex-nowrap gap-1 overflow-x-auto scrollbar-none">
            {(Object.keys(tabCounts) as TabKey[]).map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm capitalize"
              >
                {tab}
                {tabCounts[tab] > 0 && (
                  <span className="ml-1.5 text-[10px] bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5 data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700">
                    {tabCounts[tab]}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <RentalCardSkeleton key={i} />)}
          </div>
        ) : filteredRentals.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 pb-16 sm:pb-0">
            <AnimatePresence mode="popLayout">
              {filteredRentals.map((rental) => (
                <RentalCard
                  key={rental.id}
                  rental={rental as Rental}
                  onSelect={handleSelect}
                  onAction={handleAction}
                  isAccepting={acceptMutation.isPending}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <RentalDetailDialog
        rentalId={selectedRental?.id ?? null}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedRental(null); }}
      />
      {/* Cancel Dialog */}
      <CancelRentalDialog
        open={cancelDialogOpen}
        onClose={() => { setCancelDialogOpen(false); setCancelRental(null); setCancelSuccess(false); }}
        onConfirm={(reason) => cancelMutation.mutate({ id: cancelRental!.id, reason })}
        rentalStatus={cancelRental?.status as RentalStatus}
        productName={cancelRental?.product?.title || ''}
        totalAmount={cancelRental?.totalAmount || 0}
        isPending={cancelMutation.isPending}
        isSuccess={cancelSuccess}
      />
      {/* Payment Modal */}
      <PaymentCheckoutModal
        open={paymentModalOpen}
        onClose={() => { setPaymentModalOpen(false); setPaymentRental(null); }}
        rentalId={paymentRental?.id || ''}
        rentalData={paymentRental ? {
          totalAmount: paymentRental.totalAmount,
          rentalAmount: paymentRental.rentalAmount,
          platformFee: paymentRental.platformFee,
          tax: paymentRental.tax,
          deliveryFee: paymentRental.deliveryFee,
          discount: paymentRental.discount,
          securityDeposit: paymentRental.securityDeposit,
          rentalDays: paymentRental.rentalDays,
          dailyRate: paymentRental.dailyRate,
          startDate: paymentRental.startDate,
          endDate: paymentRental.endDate,
          productTitle: paymentRental.product?.title,
        } : null}
        onSuccess={() => {
          setPaymentModalOpen(false);
          setPaymentRental(null);
          queryClient.invalidateQueries({ queryKey: ['rentals'] });
          toast.success('Payment successful! Rental request sent to owner.');
        }}
      />
    </div>
  );
}
