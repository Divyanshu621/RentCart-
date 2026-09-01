'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  Loader2,
  ArrowRight,
  Star,
  MapPin,
  ShieldCheck,
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import type { Product } from '@/types';
import { toast } from 'sonner';

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
  NEW: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  LIKE_NEW: 'bg-sky-100 text-sky-700 border-sky-200',
  GOOD: 'bg-amber-100 text-amber-700 border-amber-200',
  FAIR: 'bg-orange-100 text-orange-700 border-orange-200',
  DAMAGED: 'bg-red-100 text-red-700 border-red-200',
};

function FavoriteCard({ product, onRemove }: { product: Product; onRemove: (id: string) => void }) {
  const navigate = useAppStore((s) => s.navigate);
  const Icon = categoryIcons[product.category?.slug] || Camera;
  const gradient = gradientMap[product.category?.slug] || 'from-slate-400 to-gray-300';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="h-full"
    >
      <Card className="h-full overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer group">
        <div
          className="relative aspect-[4/3] overflow-hidden"
          onClick={() => navigate('product', { productId: product.id })}
        >
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0].url}
              alt={product.images[0].altText || product.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div
              className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center transition-transform duration-500 group-hover:scale-110`}
            >
              <Icon className="h-16 w-16 text-white/80" strokeWidth={1.5} />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-medium border-0">
              {product.category?.name}
            </Badge>
          </div>
          <div className="absolute bottom-3 left-3">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                conditionColors[product.condition] || 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {conditionLabels[product.condition] || product.condition}
            </span>
          </div>
          {/* Remove button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(product.id);
            }}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-red-50 transition-colors"
            aria-label="Remove from favorites"
          >
            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
          </button>
        </div>

        <CardContent
          className="p-4 flex flex-col gap-3"
          onClick={() => navigate('product', { productId: product.id })}
        >
          <h3 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
            {product.title}
          </h3>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium text-slate-700">
                {product.avgRating > 0 ? product.avgRating.toFixed(1) : 'New'}
              </span>
            </div>
            {product.totalReviews > 0 && (
              <span className="text-xs text-slate-400">
                ({product.totalReviews} review{product.totalReviews > 1 ? 's' : ''})
              </span>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-600">
                ₹{product.dailyPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-400">/day</span>
            </div>
            <span className="text-xs text-slate-400">
              Deposit: ₹{product.securityDeposit.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-slate-500 min-w-0">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">
                {product.city?.name}
                {product.state?.name ? `, ${product.state.name}` : ''}
              </span>
            </div>
            {product.owner?.isVerified && (
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            )}
          </div>
          <Button
            size="sm"
            className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={(e) => {
              e.stopPropagation();
              navigate('product', { productId: product.id });
            }}
          >
            Rent Now
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function FavoritesPage() {
  const navigate = useAppStore((s) => s.navigate);
  const queryClient = useQueryClient();

  const { data: rawProducts, isLoading } = useQuery({
    queryKey: ['products', { favorited: true }],
    queryFn: () => api.getProducts({ favorited: 'true' }),
  });

  const products = ((rawProducts as { products?: Product[] })?.products || []) as Product[];

  const removeMutation = useMutation({
    mutationFn: (productId: string) => api.toggleFavorite(productId),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['products', { favorited: true }] });
      const prev = queryClient.getQueryData(['products', { favorited: true }]);
      const current = (prev as { products?: Product[] })?.products || [];
      queryClient.setQueryData(['products', { favorited: true }], {
        ...prev,
        products: current.filter((p: Product) => p.id !== productId),
      });
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['products', { favorited: true }], context.prev);
      }
      toast.error('Failed to remove from favorites');
    },
    onSuccess: () => {
      toast.success('Removed from favorites');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products', { favorited: true }] });
    },
  });

  const handleRemove = (productId: string) => {
    removeMutation.mutate(productId);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">My Favorites</h1>
            <p className="text-sm text-slate-500">
              {products.length > 0
                ? `${products.length} saved item${products.length > 1 ? 's' : ''}`
                : 'Items you love'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 px-4 text-center"
          >
            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Heart className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No favorites yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6">
              Browse the marketplace and save items you like.
            </p>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => navigate('marketplace')}
            >
              Browse Marketplace
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <FavoriteCard key={product.id} product={product} onRemove={handleRemove} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
