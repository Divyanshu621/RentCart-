'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import ProductCard from '@/components/rentloop/marketplace/ProductCard';
import type { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function TrendingSection() {
  const navigate = useAppStore((s) => s.navigate);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProducts({ page: 1, limit: 6, sort: 'trending' })
      .then((res) => {
        const data = res as unknown as { products: Product[] };
        setProducts(data.products || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header with View All link */}
        <motion.div
          className="flex items-end justify-between mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0f172a]">
              Trending Rentals
            </h2>
            <p className="mt-2 text-[#64748b] text-base">
              Most popular items being rented right now
            </p>
          </div>
          <button
            onClick={() => navigate('marketplace')}
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-[#059669] hover:text-[#047857] transition-colors shrink-0"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Mobile View All link */}
        <div className="sm:hidden mb-6">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-[#e2e8f0] text-[#059669] hover:bg-[#ecfdf5]"
            onClick={() => navigate('marketplace')}
          >
            View All Rentals <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-[#e2e8f0] overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
