'use client';

import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Package,
  CalendarCheck,
  IndianRupee,
  AlertTriangle,
  Gavel,
  ChevronRight,
  Loader2,
  ShieldCheck,
  TrendingUp,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import type { AdminDashboard, Rental } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { format } from 'date-fns';

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
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(eased * target);
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
      {prefix}{decimals > 0 ? count.toFixed(decimals) : Math.round(count).toLocaleString('en-IN')}{suffix}
    </span>
  );
}

// ─── Status colors for rentals ─────────────────────────────
const statusColors: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
  OWNER_PENDING: 'bg-amber-100 text-amber-700',
  OWNER_ACCEPTED: 'bg-sky-100 text-sky-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
  OVERDUE: 'bg-red-100 text-red-700',
  DISPUTED: 'bg-red-100 text-red-700',
  RETURN_PENDING: 'bg-orange-100 text-orange-700',
  RETURNED: 'bg-sky-100 text-sky-700',
};

const CHART_COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4', '#d946ef', '#84cc16'];

export default function AdminDashboardPage() {
  const navigate = useAppStore((s) => s.navigate);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.getAdminDashboard() as Promise<AdminDashboard>,
  });

  const stats = data || {
    totalUsers: 0,
    totalListings: 0,
    activeRentals: 0,
    totalRevenue: 0,
    overdueRentals: 0,
    openDisputes: 0,
    recentRentals: [],
    monthlyRevenue: [],
    rentalsByStatus: [],
    usersByRole: [],
    productsByCategory: [],
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Listings', value: stats.totalListings, icon: Package, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Active Rentals', value: stats.activeRentals, icon: CalendarCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Revenue', value: stats.totalRevenue, icon: IndianRupee, color: 'text-amber-600', bg: 'bg-amber-50', prefix: '₹' },
    { label: 'Overdue', value: stats.overdueRentals, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Disputes', value: stats.openDisputes, icon: Gavel, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const quickLinks = [
    { label: 'Manage Users', icon: Users, view: 'admin-users' as const, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Manage Products', icon: Package, view: 'admin-products' as const, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Manage Rentals', icon: CalendarCheck, view: 'admin-rentals' as const, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'View Disputes', icon: Gavel, view: 'admin-disputes' as const, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Payment Settings', icon: Settings, view: 'admin-settings' as const, color: 'text-slate-600', bg: 'bg-slate-100' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-[#0f172a] flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-sm text-slate-500">Platform analytics and management</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {statCards.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`h-9 w-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    <AnimatedCounter
                      target={stat.value}
                      prefix={(stat as { prefix?: string }).prefix || ''}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Revenue Chart */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-emerald-600" />
                Monthly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ChartContainer config={{ revenue: { label: 'Revenue', color: '#10b981' } }} className="h-[300px] w-full">
                <BarChart data={stats.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Rental Status Distribution */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="h-4.5 w-4.5 text-violet-600" />
                Rental Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ChartContainer config={{}} className="h-[300px] w-full">
                <PieChart>
                  <Pie
                    data={stats.rentalsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="count"
                    nameKey="status"
                    paddingAngle={2}
                    label={({ status, percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {stats.rentalsByStatus.map((_entry, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {quickLinks.map((link) => (
            <motion.div
              key={link.label}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="cursor-pointer border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                onClick={() => navigate(link.view)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${link.bg} flex items-center justify-center shrink-0`}>
                    <link.icon className={`h-5 w-5 ${link.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900">{link.label}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Rentals Table */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Recent Rentals</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentRentals.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No recent rentals</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-3 font-medium text-slate-500">Product</th>
                      <th className="text-left py-3 px-3 font-medium text-slate-500">Customer</th>
                      <th className="text-left py-3 px-3 font-medium text-slate-500">Owner</th>
                      <th className="text-right py-3 px-3 font-medium text-slate-500">Amount</th>
                      <th className="text-center py-3 px-3 font-medium text-slate-500">Status</th>
                      <th className="text-left py-3 px-3 font-medium text-slate-500">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentRentals.slice(0, 10).map((rental) => (
                      <tr
                        key={rental.id}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => navigate('admin-rentals')}
                      >
                        <td className="py-3 px-3 font-medium text-slate-900 truncate max-w-[150px]">
                          {rental.product?.title}
                        </td>
                        <td className="py-3 px-3 text-slate-600">{rental.customer?.name}</td>
                        <td className="py-3 px-3 text-slate-600">{rental.owner?.name}</td>
                        <td className="py-3 px-3 text-right font-medium text-emerald-600">
                          ₹{rental.totalAmount?.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[rental.status] || 'bg-slate-100 text-slate-600'}`}>
                            {rental.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-xs">
                          {format(new Date(rental.createdAt), 'dd MMM yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
