'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Star,
  PackageOpen,
  Loader2,
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
  IndianRupee,
  Users,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import type { Product } from '@/types';
import { toast } from 'sonner';

// ─── Category Icons & Gradients ────────────────────────────
const categoryIcons: Record<string, LucideIcon> = {
  cameras: Camera, laptops: Laptop, bicycles: Bike, tools: Drill, furniture: Sofa,
  camping: Tent, gaming: Gamepad2, 'musical-instruments': Music, books: BookOpen,
  fitness: Dumbbell, 'home-improvement': Wrench, fashion: Shirt,
  'baby-equipment': Baby, 'kitchen-appliances': Utensils,
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

// ─── Status Colors ─────────────────────────────────────────
type ListingTab = 'all' | 'approved' | 'pending' | 'rejected' | 'draft';

const productStatusColors: Record<string, string> = {
  APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  PENDING_REVIEW: 'bg-amber-100 text-amber-700 border-amber-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  DRAFT: 'bg-slate-100 text-slate-500 border-slate-200',
  SUSPENDED: 'bg-red-100 text-red-700 border-red-200',
};

const productStatusLabels: Record<string, string> = {
  APPROVED: 'Approved',
  PENDING_REVIEW: 'Pending Review',
  REJECTED: 'Rejected',
  DRAFT: 'Draft',
  SUSPENDED: 'Suspended',
};

const statusToTab: Record<string, ListingTab> = {
  APPROVED: 'approved',
  PENDING_REVIEW: 'pending',
  REJECTED: 'rejected',
  DRAFT: 'draft',
  SUSPENDED: 'rejected',
};

// ─── Skeleton Card ─────────────────────────────────────────
function ListingCardSkeleton() {
  return (
    <Card className="border-slate-200">
      <div className="aspect-[4/3] rounded-t-lg">
        <Skeleton className="h-full w-full rounded-t-lg" />
      </div>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Listing Card ──────────────────────────────────────────
function ListingCard({
  product,
  onView,
  onEdit,
  onDelete,
}: {
  product: Product;
  onView: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  const Icon = categoryIcons[product.category?.slug] || Camera;
  const gradient = gradientMap[product.category?.slug] || 'from-slate-400 to-gray-300';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden border-slate-200 bg-white hover:shadow-lg transition-shadow group">
        {/* Image */}
        <div
          className={`relative aspect-[4/3] bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}
          onClick={() => onView(product)}
        >
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0].url}
              alt={product.images[0].altText || product.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <Icon className="h-14 w-14 text-white/80 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
          )}
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${productStatusColors[product.status]}`}>
              {productStatusLabels[product.status]}
            </span>
          </div>
          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] border-0">
              {product.category?.name || 'Uncategorized'}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 min-h-[2.5rem]">{product.title}</h3>

          {/* Price & Rating */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-lg font-bold text-emerald-600">{product.dailyPrice.toLocaleString('en-IN')}</span>
              <span className="text-xs text-slate-400">/day</span>
            </div>
            {product.avgRating > 0 ? (
              <div className="flex items-center gap-0.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium text-slate-700">{product.avgRating.toFixed(1)}</span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">No reviews</span>
            )}
          </div>

          {/* Rental count & Location */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{product.totalRentals} rental{product.totalRentals !== 1 ? 's' : ''}</span>
            </div>
            {product.city && (
              <div className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[100px]">{product.city.name}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
              onClick={() => onView(product)}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
              onClick={() => onEdit(product)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => onDelete(product)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Empty State ───────────────────────────────────────────
function EmptyState({ isFilter }: { isFilter: boolean }) {
  const navigate = useAppStore((s) => s.navigate);
  if (isFilter) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <PackageOpen className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">No listings in this category</h3>
        <p className="text-sm text-slate-500 mt-1">Try a different filter or list a new item.</p>
      </motion.div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
        <PackageOpen className="h-10 w-10 text-emerald-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-900">You haven't listed any items yet</h3>
      <p className="text-sm text-slate-500 mt-2 max-w-sm">Start earning by listing your items for rent. It only takes a few minutes!</p>
      <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate('list-item')}>
        <Plus className="h-4 w-4 mr-2" />List Your First Item
      </Button>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function MyListingsPage() {
  const navigate = useAppStore((s) => s.navigate);
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ListingTab>('all');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['my-products'],
    queryFn: async () => {
      const data = await api.getProducts({ ownerId: user?.id, page: 1, limit: 100 });
      return data as unknown as { products: Product[]; total: number };
    },
    enabled: !!user,
  });

  const products = productsData?.products ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteProduct(id),
    onSuccess: () => {
      toast.success('Listing deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filteredProducts = activeTab === 'all'
    ? products
    : products.filter((p) => statusToTab[p.status] === activeTab);

  const tabCounts: Record<ListingTab, number> = {
    all: products.length,
    approved: products.filter((p) => p.status === 'APPROVED').length,
    pending: products.filter((p) => p.status === 'PENDING_REVIEW').length,
    rejected: products.filter((p) => p.status === 'REJECTED' || p.status === 'SUSPENDED').length,
    draft: products.filter((p) => p.status === 'DRAFT').length,
  };

  const handleView = (product: Product) => {
    navigate('product', { productId: product.id });
  };

  const handleEdit = (product: Product) => {
    navigate('list-item', { product });
  };

  const handleDelete = (product: Product) => {
    setDeleteTarget(product);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900" onClick={() => navigate('dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-1" />Back
              </Button>
              <div className="h-6 w-px bg-slate-200" />
              <h1 className="text-lg font-bold text-slate-900">My Listings</h1>
              <span className="text-sm text-slate-400">({products.length})</span>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate('list-item')}>
              <Plus className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Add New Item</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ListingTab)} className="mb-6">
          <TabsList className="bg-slate-100 p-1 h-auto flex-wrap gap-1">
            {(Object.keys(tabCounts) as ListingTab[]).map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="text-xs sm:text-sm px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm capitalize"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <EmptyState isFilter={false} />
        ) : filteredProducts.length === 0 ? (
          <EmptyState isFilter={true} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <ListingCard
                  key={product.id}
                  product={product as Product}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
