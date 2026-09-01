'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store';

export default function CTASection() {
  const navigate = useAppStore((s) => s.navigate);
  const user = useAppStore((s) => s.user);

  const handleListClick = () => {
    if (user) {
      navigate('list-item');
    } else {
      const store = useAppStore.getState();
      store.setReturnUrl('list-item');
      store.setAuthModalView('login');
      store.setAuthModalOpen(true);
    }
  };

  return (
    <section className="relative py-20 sm:py-24 overflow-hidden">
      {/* Emerald-to-teal gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#059669] via-[#047857] to-[#0f766e]" />

      {/* Subtle dot overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-white/30 bg-white/15 text-white text-sm font-medium backdrop-blur-sm">
            <Zap size={14} className="text-amber-200" />
            <span>Join 25,000+ happy renters today</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
            Start Renting Today
          </h2>

          <p className="mt-4 text-white/80 text-lg max-w-xl mx-auto leading-relaxed">
            Join thousands of users who are saving money and reducing waste. It only takes a minute to get started.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-white hover:bg-gray-100 text-[#059669] px-8 py-6 text-base font-semibold rounded-xl shadow-lg shadow-black/20 transition-all hover:shadow-xl"
              onClick={() => navigate('marketplace')}
            >
              Browse Rentals
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-8 py-6 text-base font-semibold rounded-xl shadow-lg shadow-black/10 transition-all hover:shadow-xl"
              onClick={handleListClick}
            >
              List Your Item
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
