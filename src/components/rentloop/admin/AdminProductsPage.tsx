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
  Check,
  X,
  Ban,
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import type { Product } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

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

const statusColors: Record<string, string> = {
  APPROVED: 'bg-emerald-100 text-emerald-700',
  PENDING_REVIEW: 'bg-amber-100 text-amber-700',
  REJECTED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-slate-100 text-slate-600',
  DRAFT: 'bg-slate-100 text-slate-500',
};

const statusLabels: Record<string, string> = {
  APPROVED: 'Approved',
  PENDING_REVIEW: 'Pending',
  REJECTED: 'Rejected',
  SUSPENDED: 'Suspended',
  DRAFT: 'Draft',
};

const conditionLabels: Record<string, string> = {
  NEW: 'New',
  LIKE_NEW: 'Like New',
  GOOD: 'Good',
  FAIR: 'Fair',
  DAMAGED: 'Damaged',
};

export default function AdminProductsPage() {
  const navigate = useAppStore((s) => s.navigate);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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
    queryKey: ['admin-products', page, search, statusFilter],
    queryFn: () => api.getAdminProducts(params),
  });

  const products = ((data as { products?: Product[] })?.products || []) as Product[];
  const total = (data as { total?: number })?.total || 0;
  const totalPages = (data as { totalPages?: number })?.totalPages || 1;

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateAdminProduct(id, { status }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(`Product ${vars.status.toLowerCase()} successfully`);
    },
    onError: () => {
      toast.error('Failed to update product');
    },
  });

  const handleAction = (productId: string, status: string) => {
    if (status === 'REJECTED' && !window.confirm('Are you sure you want to reject this product?')) return;
    if (status === 'SUSPENDED' && !window.confirm('Are you sure you want to suspend this product?')) return;
    updateMutation.mutate({ id: productId, status });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('admin-dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Product Management</h1>
            <p className="text-sm text-slate-500">{total} total products</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by product title or owner..."
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
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="PENDING_REVIEW">Pending</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : isMobile ? (
          /* Mobile: Card Layout */
          <div className="space-y-3">
            <AnimatePresence>
              {products.map((p) => {
                const Icon = categoryIcons[p.category?.slug] || Camera;
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-slate-200 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0">
                            <Icon className="h-7 w-7 text-slate-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-sm text-slate-900 truncate">{p.title}</h3>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[p.status] || 'bg-slate-100 text-slate-600'}`}>
                                {statusLabels[p.status] || p.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              by {p.owner?.name} · {p.category?.name}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm font-bold text-emerald-600">₹{p.dailyPrice.toLocaleString('en-IN')}/day</span>
                              <span className="text-xs text-slate-400">{conditionLabels[p.condition] || p.condition}</span>
                            </div>
                            <div className="flex gap-2 mt-2">
                              {p.status === 'PENDING_REVIEW' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => handleAction(p.id, 'APPROVED')}
                                    disabled={updateMutation.isPending}
                                  >
                                    <Check className="h-3 w-3 mr-1" /> Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => handleAction(p.id, 'REJECTED')}
                                    disabled={updateMutation.isPending}
                                  >
                                    <X className="h-3 w-3 mr-1" /> Reject
                                  </Button>
                                </>
                              )}
                              {(p.status === 'APPROVED' || p.status === 'REJECTED') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs text-slate-600"
                                  onClick={() => handleAction(p.id, 'SUSPENDED')}
                                  disabled={updateMutation.isPending}
                                >
                                  <Ban className="h-3 w-3 mr-1" /> Suspend
                                </Button>
                              )}
                              {p.status === 'SUSPENDED' && (
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => handleAction(p.id, 'APPROVED')}
                                  disabled={updateMutation.isPending}
                                >
                                  <Check className="h-3 w-3 mr-1" /> Reinstate
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => navigate('product', { productId: p.id })}
                              >
                                <Eye className="h-3 w-3 mr-1" /> View
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          /* Desktop: Table Layout */
          <>
            <Card className="border-slate-200 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {products.map((p) => {
                      const Icon = categoryIcons[p.category?.slug] || Camera;
                      return (
                        <motion.tr
                          key={p.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-9 w-9 rounded-md bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0">
                                <Icon className="h-4.5 w-4.5 text-slate-500" />
                              </div>
                              <button
                                className="font-medium text-sm text-slate-900 hover:text-emerald-600 transition-colors text-left truncate max-w-[200px]"
                                onClick={() => navigate('product', { productId: p.id })}
                              >
                                {p.title}
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">{p.owner?.name}</TableCell>
                          <TableCell className="text-sm text-slate-600">{p.category?.name}</TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold text-emerald-600">₹{p.dailyPrice.toLocaleString('en-IN')}</span>
                            <span className="text-xs text-slate-400">/day</span>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">{conditionLabels[p.condition] || p.condition}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[p.status] || 'bg-slate-100 text-slate-600'}`}>
                              {statusLabels[p.status] || p.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {p.status === 'PENDING_REVIEW' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => handleAction(p.id, 'APPROVED')}
                                    disabled={updateMutation.isPending}
                                  >
                                    <Check className="h-3 w-3 mr-1" /> Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => handleAction(p.id, 'REJECTED')}
                                    disabled={updateMutation.isPending}
                                  >
                                    <X className="h-3 w-3 mr-1" /> Reject
                                  </Button>
                                </>
                              )}
                              {(p.status === 'APPROVED' || p.status === 'REJECTED') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleAction(p.id, 'SUSPENDED')}
                                  disabled={updateMutation.isPending}
                                >
                                  <Ban className="h-3 w-3 mr-1" /> Suspend
                                </Button>
                              )}
                              {p.status === 'SUSPENDED' && (
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => handleAction(p.id, 'APPROVED')}
                                  disabled={updateMutation.isPending}
                                >
                                  <Check className="h-3 w-3 mr-1" /> Reinstate
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => navigate('product', { productId: p.id })}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
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
    </div>
  );
}
