'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  CheckCircle2,
  IndianRupee,
  TrendingUp,
  Search,
  PlusCircle,
  MessageSquare,
  Heart,
  CalendarClock,
  Clock,
  ArrowUpRight,
  Star,
  ChevronRight,
  MapPin,
  AlertTriangle,
  Eye,
  Loader2,
  Shield,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import type { DashboardStats, Rental } from '@/types';

// ─── Animated Counter ──────────────────────────────────────
function AnimatedCounter({ target, prefix = '', suffix = '', decimals = 0 }: {
  target: number; prefix?: string; suffix?: string; decimals?: number;
}) {
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
          const duration = 1200;
          const startTime = performance.now();
          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(eased * target);
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  const formatted = decimals > 0
    ? count.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(count).toLocaleString('en-IN');

  return <span ref={ref}>{prefix}{formatted}{suffix}</span>;
}

// ─── Stat Card ─────────────────────────────────────────────
const statCards = [
  {
    key: 'activeRentals' as const,
    label: 'Active Rentals',
    icon: Package,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/60',
    prefix: '',
    suffix: '',
  },
  {
    key: 'completedRentals' as const,
    label: 'Completed Rentals',
    icon: CheckCircle2,
    color: 'text-sky-600',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-800',
    iconBg: 'bg-sky-100 dark:bg-sky-900/60',
    prefix: '',
    suffix: '',
  },
  {
    key: 'totalSpending' as const,
    label: 'Total Spending',
    icon: IndianRupee,
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    iconBg: 'bg-amber-100 dark:bg-amber-900/60',
    prefix: '\u20B9',
    suffix: '',
  },
  {
    key: 'totalEarnings' as const,
    label: 'Total Earnings',
    icon: TrendingUp,
    color: 'text-violet-600',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    border: 'border-violet-200 dark:border-violet-800',
    iconBg: 'bg-violet-100 dark:bg-violet-900/60',
    prefix: '\u20B9',
    suffix: '',
  },
];

// ─── Quick Actions ─────────────────────────────────────────
const quickActions = [
  { label: 'Browse Rentals', icon: Search, view: 'marketplace' as const, desc: 'Find items to rent' },
  { label: 'List an Item', icon: PlusCircle, view: 'list-item' as const, desc: 'Start earning' },
  { label: 'My Rentals', icon: CalendarClock, view: 'my-rentals' as const, desc: 'Track orders' },
  { label: 'Messages', icon: MessageSquare, view: 'messages' as const, desc: 'Chat with users' },
  { label: 'Favorites', icon: Heart, view: 'favorites' as const, desc: 'Saved items' },
];

// ─── Rental Status Badge ───────────────────────────────────
const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', variant: 'outline', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  PAYMENT_COMPLETED: { label: 'Payment Done', variant: 'default', className: 'bg-blue-100 text-blue-700' },
  OWNER_PENDING: { label: 'Owner Review', variant: 'outline', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  OWNER_ACCEPTED: { label: 'Accepted', variant: 'default', className: 'bg-emerald-100 text-emerald-700' },
  OWNER_REJECTED: { label: 'Rejected', variant: 'destructive', className: '' },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', variant: 'default', className: 'bg-cyan-100 text-cyan-700' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', variant: 'default', className: 'bg-indigo-100 text-indigo-700' },
  ACTIVE: { label: 'Active', variant: 'default', className: 'bg-emerald-100 text-emerald-700' },
  RETURN_PENDING: { label: 'Return Pending', variant: 'outline', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  RETURNED: { label: 'Returned', variant: 'secondary', className: '' },
  INSPECTION: { label: 'Inspection', variant: 'outline', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  COMPLETED: { label: 'Completed', variant: 'default', className: 'bg-sky-100 text-sky-700' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive', className: '' },
  DISPUTED: { label: 'Disputed', variant: 'destructive', className: '' },
  OVERDUE: { label: 'Overdue', variant: 'destructive', className: 'bg-red-100 text-red-700' },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, variant: 'outline' as const, className: '' };
  return (
    <Badge variant={config.variant} className={`text-xs font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
}

// ─── Rental Item Row ───────────────────────────────────────
function RentalItem({ rental, role }: { rental: Rental; role: 'customer' | 'owner' }) {
  const navigate = useAppStore((s) => s.navigate);
  const otherPerson = role === 'customer' ? rental.owner : rental.customer;
  const product = rental.product as unknown as Rental['product'];

  const startDate = new Date(rental.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const endDate = new Date(rental.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
      onClick={() => navigate('my-rentals', { rentalId: rental.id })}
    >
      {/* Product placeholder */}
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center flex-shrink-0">
        <Package className="w-5 h-5 text-slate-400" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {product.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500">{startDate} — {endDate}</span>
          <span className="text-xs text-slate-300">·</span>
          <span className="text-xs text-slate-500">{rental.rentalDays} days</span>
        </div>
      </div>

      {/* Other person & status */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-1.5">
          <Avatar className="w-6 h-6">
            <AvatarImage src={otherPerson.avatarUrl} />
            <AvatarFallback className="text-[10px] bg-slate-200 dark:bg-slate-700">
              {otherPerson.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-slate-500 max-w-[80px] truncate">{otherPerson.name}</span>
        </div>
        <StatusBadge status={rental.status} />
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
      </div>
    </motion.div>
  );
}

// ─── Main Dashboard Page ───────────────────────────────────
export default function DashboardPage() {
  const user = useAppStore((s) => s.user);
  const navigate = useAppStore((s) => s.navigate);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [customerRentals, setCustomerRentals] = useState<Rental[]>([]);
  const [ownerRentals, setOwnerRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, custRes, ownRes] = await Promise.allSettled([
        api.getDashboard(),
        api.getRentals({ role: 'customer' }),
        api.getRentals({ role: 'owner' }),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value as unknown as DashboardStats);
      if (custRes.status === 'fulfilled') setCustomerRentals(Array.isArray((custRes.value as any).rentals) ? (custRes.value as any).rentals as Rental[] : []);
      if (ownRes.status === 'fulfilled') setOwnerRentals(Array.isArray((ownRes.value as any).rentals) ? (ownRes.value as any).rentals as Rental[] : []);

      if (statsRes.status === 'rejected' && custRes.status === 'rejected' && ownRes.status === 'rejected') {
        setError('Failed to load dashboard data');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Derived
  const pendingRequests = ownerRentals.filter(
    (r) => r.status === 'OWNER_PENDING' || r.status === 'RETURN_PENDING'
  );
  const activeCustomerRentals = customerRentals.filter(
    (r) => r.status === 'ACTIVE' || r.status === 'OWNER_ACCEPTED' || r.status === 'READY_FOR_PICKUP' || r.status === 'OUT_FOR_DELIVERY'
  );
  const recentRentals = [...customerRentals, ...ownerRentals]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Unique recent rentals (avoid duplicates when user is both customer and owner)
  const seen = new Set<string>();
  const uniqueRecent = recentRentals.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  const firstName = user?.name?.split(' ')[0] || 'User';
  const isOwner = user?.role === 'OWNER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const kycStatus = user?.kycStatus;

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header skeleton */}
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="w-14 h-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          {/* Stats skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          {/* Actions skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          {/* Rentals skeleton */}
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Failed to load dashboard</h2>
          <p className="text-slate-500 text-sm max-w-sm">{error}</p>
          <Button onClick={fetchDashboard} variant="outline" className="mt-2">
            <Loader2 className="w-4 h-4 mr-2" />Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 sm:pb-0">
      <motion.div
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ─── Welcome Header ──────────────────────────────── */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 ring-2 ring-emerald-500/20 ring-offset-2 ring-offset-background">
              <AvatarImage src={user?.avatarUrl} alt={user?.name} />
              <AvatarFallback className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-lg font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{greeting}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Welcome back, <span className="text-emerald-600 dark:text-emerald-400">{firstName}</span>{'!'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user?.isVerified && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0 gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified
              </Badge>
            )}
            <Badge variant="outline" className="gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              {user?.avgRating?.toFixed(1) || '0.0'}
            </Badge>
          </div>
        </motion.div>

        {/* ─── KYC Status Banner for OWNER ──────────── */}
        {user?.role === 'OWNER' && kycStatus && kycStatus !== 'VERIFIED' && (
          <motion.div variants={itemVariants} className="mb-6">
            <div
              className={`rounded-2xl p-4 sm:p-5 cursor-pointer transition-all hover:shadow-md ${
                kycStatus === 'REJECTED'
                  ? 'bg-red-50 border border-red-200'
                  : kycStatus === 'SUBMITTED'
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-amber-50 border border-amber-200'
              }`}
              onClick={() => navigate('seller-kyc')}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  kycStatus === 'REJECTED' ? 'bg-red-100' : kycStatus === 'SUBMITTED' ? 'bg-blue-100' : 'bg-amber-100'
                }`}>
                  <Shield className={`w-5 h-5 ${
                    kycStatus === 'REJECTED' ? 'text-red-600' : kycStatus === 'SUBMITTED' ? 'text-blue-600' : 'text-amber-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-semibold ${
                    kycStatus === 'REJECTED' ? 'text-red-800' : kycStatus === 'SUBMITTED' ? 'text-blue-800' : 'text-amber-800'
                  }`}>
                    {kycStatus === 'REJECTED' ? 'KYC Verification Rejected' :
                     kycStatus === 'SUBMITTED' ? 'KYC Under Review' :
                     'Complete Seller Verification'}
                  </h3>
                  <p className={`text-xs mt-0.5 ${
                    kycStatus === 'REJECTED' ? 'text-red-600' : kycStatus === 'SUBMITTED' ? 'text-blue-600' : 'text-amber-600'
                  }`}>
                    {kycStatus === 'REJECTED' ? 'Your documents were rejected. Tap to review and resubmit.' :
                     kycStatus === 'SUBMITTED' ? 'Your documents are being reviewed. You\'ll be notified once approved.' :
                     'Upload Aadhaar, PAN & bank details to start listing items.'}
                  </p>
                </div>
                <ChevronRight className={`w-5 h-5 shrink-0 ${
                  kycStatus === 'REJECTED' ? 'text-red-400' : kycStatus === 'SUBMITTED' ? 'text-blue-400' : 'text-amber-400'
                }`} />
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Stats Grid ─────────────────────────────────── */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {statCards.map((stat) => {
            const value = stats?.[stat.key] ?? 0;
            const Icon = stat.icon;
            return (
              <Card
                key={stat.key}
                className={`relative overflow-hidden border ${stat.border} ${stat.bg} hover:shadow-lg transition-shadow duration-300`}
              >
                <CardContent className="p-3 sm:p-5">
                  <div className="flex items-start justify-between">
                    <div className={`p-2 sm:p-2.5 rounded-xl ${stat.iconBg}`}>
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3">
                    <p className={`text-xl sm:text-2xl md:text-3xl font-bold ${stat.color} tracking-tight`}>
                      <AnimatedCounter
                        target={value}
                        prefix={stat.prefix}
                        suffix={stat.suffix}
                      />
                    </p>
                    <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 font-medium">
                      {stat.label}
                    </p>
                  </div>
                  {/* Decorative corner glow */}
                  <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full ${stat.iconBg} opacity-50 blur-2xl pointer-events-none`} />
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* ─── Quick Actions ───────────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.view}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(action.view)}
                  className="flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] sm:text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {action.label}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 hidden sm:block">{action.desc}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ─── Alerts / Pending ────────────────────────────── */}
        {pendingRequests.length > 0 && (
          <motion.div variants={itemVariants} className="mb-8">
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                      Pending Requests
                    </h3>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      You have {pendingRequests.length} pending action{pendingRequests.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900/40"
                    onClick={() => navigate('my-rentals')}
                  >
                    View All
                    <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {pendingRequests.slice(0, 3).map((rental) => (
                    <div key={rental.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/60 dark:bg-slate-900/40">
                      <div className="flex items-center gap-3 min-w-0">
                        <Package className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                          {rental.product.title}
                        </span>
                        <span className="text-xs text-slate-400 flex-shrink-0 hidden sm:inline">
                          by {rental.customer.name}
                        </span>
                      </div>
                      <StatusBadge status={rental.status} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── Active Rentals (Customer) ──────────────────── */}
        {activeCustomerRentals.length > 0 && (
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                  <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Active Rentals
                </h2>
                <Badge variant="secondary" className="ml-1">{activeCustomerRentals.length}</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-emerald-600"
                onClick={() => navigate('my-rentals')}
              >
                View All <ChevronRight className="w-4 h-4 ml-0.5" />
              </Button>
            </div>
            <Card className="overflow-hidden">
              <CardContent className="p-1.5 sm:p-3">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeCustomerRentals.slice(0, 3).map((rental) => (
                    <RentalItem key={rental.id} rental={rental} role="customer" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── Owner: Incoming Rentals ────────────────────── */}
        {isOwner && ownerRentals.length > 0 && (
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/40">
                  <Eye className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  My Listing Rentals
                </h2>
                <Badge variant="secondary" className="ml-1">{ownerRentals.length}</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-emerald-600"
                onClick={() => navigate('my-listings')}
              >
                View All <ChevronRight className="w-4 h-4 ml-0.5" />
              </Button>
            </div>
            <Card className="overflow-hidden">
              <CardContent className="p-1.5 sm:p-3">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ownerRentals.slice(0, 4).map((rental) => (
                    <RentalItem key={rental.id} rental={rental} role="owner" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── Recent Activity ─────────────────────────────── */}
        {uniqueRecent.length > 0 && (
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Recent Activity
                </h2>
              </div>
            </div>
            <Card className="overflow-hidden">
              <CardContent className="p-1.5 sm:p-3">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {uniqueRecent.map((rental) => {
                    const isCustomer = rental.customerId === user?.id;
                    return (
                      <RentalItem
                        key={rental.id}
                        rental={rental}
                        role={isCustomer ? 'customer' : 'owner'}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── Empty State ─────────────────────────────────── */}
        {!loading && !error && uniqueRecent.length === 0 && activeCustomerRentals.length === 0 && ownerRentals.length === 0 && (
          <motion.div variants={itemVariants} className="text-center py-12 sm:py-16 pb-24 sm:pb-16">
            <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Your dashboard is ready
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
              Start exploring rentals or list your first item to see activity here.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={() => navigate('marketplace')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Search className="w-4 h-4 mr-2" />
                Browse Rentals
              </Button>
              <Button variant="outline" onClick={() => navigate('list-item')}>
                <PlusCircle className="w-4 h-4 mr-2" />
                List an Item
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
