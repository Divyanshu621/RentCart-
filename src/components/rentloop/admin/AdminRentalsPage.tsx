'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  Calendar,
  IndianRupee,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import type { Rental } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
  READY_FOR_PICKUP: 'bg-blue-100 text-blue-700',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-700',
  INSPECTION: 'bg-purple-100 text-purple-700',
  PAYMENT_COMPLETED: 'bg-sky-100 text-sky-700',
  OWNER_REJECTED: 'bg-red-100 text-red-700',
};

export default function AdminRentalsPage() {
  const navigate = useAppStore((s) => s.navigate);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const params: Record<string, string> = { page: String(page) };
  if (search) params.search = search;
  if (statusFilter !== 'all') params.status = statusFilter;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-rentals', page, search, statusFilter],
    queryFn: () => api.getAdminRentals(params),
  });

  const rentals = ((data as { rentals?: Rental[] })?.rentals || []) as Rental[];
  const total = (data as { total?: number })?.total || 0;
  const totalPages = (data as { totalPages?: number })?.totalPages || 1;

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.updateAdminRental(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rentals'] });
      toast.success('Rental updated successfully');
      setSelectedRental(null);
    },
    onError: () => {
      toast.error('Failed to update rental');
    },
  });

  const statusOptions = ['ACTIVE', 'COMPLETED', 'CANCELLED', 'OVERDUE', 'DISPUTED'];

  const renderMobileCard = (r: Rental) => (
    <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm text-slate-900 truncate">{r.product?.title}</h3>
              <p className="text-xs text-slate-500">#{r.id.slice(-6).toUpperCase()}</p>
            </div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${statusColors[r.status] || 'bg-slate-100 text-slate-600'}`}>
              {r.status?.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div>
              <span className="text-slate-400">Customer:</span> {r.customer?.name}
            </div>
            <div>
              <span className="text-slate-400">Owner:</span> {r.owner?.name}
            </div>
            <div>
              <span className="text-slate-400">Amount:</span>{' '}
              <span className="font-semibold text-emerald-600">₹{r.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-400">Period:</span>{' '}
              {format(new Date(r.startDate), 'dd MMM')} – {format(new Date(r.endDate), 'dd MMM')}
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => setSelectedRental(r)}
            >
              <Eye className="h-3 w-3 mr-1" /> Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('admin-dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Rental Management</h1>
            <p className="text-sm text-slate-500">{total} total rentals</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by rental ID, product, customer..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING_PAYMENT">Pending Payment</SelectItem>
              <SelectItem value="OWNER_PENDING">Owner Pending</SelectItem>
              <SelectItem value="OWNER_ACCEPTED">Owner Accepted</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="DISPUTED">Disputed</SelectItem>
              <SelectItem value="RETURN_PENDING">Return Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : rentals.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-lg font-medium">No rentals found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : isMobile ? (
          <div className="space-y-3">{rentals.map(renderMobileCard)}</div>
        ) : (
          <>
            <Card className="border-slate-200 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rental ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {rentals.map((r) => (
                      <motion.tr
                        key={r.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <TableCell className="font-mono text-xs text-slate-500">
                          #{r.id.slice(-6).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <button
                            className="font-medium text-sm text-slate-900 hover:text-emerald-600 transition-colors text-left truncate max-w-[150px] block"
                            onClick={() => navigate('product', { productId: r.productId })}
                          >
                            {r.product?.title}
                          </button>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{r.customer?.name}</TableCell>
                        <TableCell className="text-sm text-slate-600">{r.owner?.name}</TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-emerald-600">₹{r.totalAmount?.toLocaleString('en-IN')}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[r.status] || 'bg-slate-100 text-slate-600'}`}>
                            {r.status?.replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {format(new Date(r.startDate), 'dd MMM')} – {format(new Date(r.endDate), 'dd MMM')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setSelectedRental(r)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> Details
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-slate-500">
                  Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, total)} of {total}
                </p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | string)[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      typeof p === 'string' ? (
                        <span key={`dots-${i}`} className="px-2 text-slate-400">...</span>
                      ) : (
                        <Button
                          key={p}
                          variant={page === p ? 'default' : 'outline'}
                          size="sm"
                          className={page === p ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      )
                    )}
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Rental Detail Dialog */}
      <Dialog open={!!selectedRental} onOpenChange={(open) => !open && setSelectedRental(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rental Details</DialogTitle>
          </DialogHeader>
          {selectedRental && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-slate-500">#{selectedRental.id.slice(-6).toUpperCase()}</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[selectedRental.status] || 'bg-slate-100 text-slate-600'}`}>
                  {selectedRental.status?.replace(/_/g, ' ')}
                </span>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900">Product</h4>
                <p className="text-sm text-slate-700">{selectedRental.product?.title}</p>

                <h4 className="text-sm font-semibold text-slate-900">Customer</h4>
                <p className="text-sm text-slate-700">{selectedRental.customer?.name} ({selectedRental.customer?.email})</p>

                <h4 className="text-sm font-semibold text-slate-900">Owner</h4>
                <p className="text-sm text-slate-700">{selectedRental.owner?.name} ({selectedRental.owner?.email})</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Start Date</span>
                  <p className="font-medium text-slate-900">{format(new Date(selectedRental.startDate), 'dd MMM yyyy')}</p>
                </div>
                <div>
                  <span className="text-slate-500">End Date</span>
                  <p className="font-medium text-slate-900">{format(new Date(selectedRental.endDate), 'dd MMM yyyy')}</p>
                </div>
                <div>
                  <span className="text-slate-500">Rental Days</span>
                  <p className="font-medium text-slate-900">{selectedRental.rentalDays}</p>
                </div>
                <div>
                  <span className="text-slate-500">Created</span>
                  <p className="font-medium text-slate-900">{format(new Date(selectedRental.createdAt), 'dd MMM yyyy')}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-900">Pricing Breakdown</h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Rental Amount</span><span>₹{selectedRental.rentalAmount?.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Platform Fee (10%)</span><span>₹{selectedRental.platformFee?.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">GST (18%)</span><span>₹{selectedRental.tax?.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Delivery Fee</span><span>₹{selectedRental.deliveryFee?.toLocaleString('en-IN')}</span></div>
                  {selectedRental.discount > 0 && (
                    <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-₹{selectedRental.discount?.toLocaleString('en-IN')}</span></div>
                  )}
                  {selectedRental.totalLateFee > 0 && (
                    <div className="flex justify-between text-red-600"><span>Late Fee</span><span>₹{selectedRental.totalLateFee?.toLocaleString('en-IN')}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-slate-500">Security Deposit</span><span>₹{selectedRental.securityDeposit?.toLocaleString('en-IN')}</span></div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base"><span className="text-slate-900">Total</span><span className="text-emerald-600">₹{selectedRental.totalAmount?.toLocaleString('en-IN')}</span></div>
                </div>
              </div>

              {/* Update Status */}
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900">Update Status</h4>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((st) => (
                    <Button
                      key={st}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      disabled={selectedRental.status === st || updateMutation.isPending}
                      onClick={() => {
                        const newStatus = st;
                        if (!window.confirm(`Change rental status to ${newStatus}? This action cannot be undone.`)) return;
                        updateMutation.mutate({
                          id: selectedRental.id,
                          data: { action: 'updateStatus', status: newStatus },
                        });
                      }}
                    >
                      {st.replace(/_/g, ' ')}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
