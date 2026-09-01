'use client';

import { motion } from 'framer-motion';
import { PiggyBank, Sparkles, TestTube2, Crown, Leaf, Repeat, TrendingUp, Users, IndianRupee } from 'lucide-react';

const benefits = [
  {
    icon: PiggyBank,
    title: 'Save Money',
    description: 'Why buy when you can rent? Save up to 80% compared to purchasing.',
  },
  {
    icon: Sparkles,
    title: 'Declutter Your Life',
    description: "Don't store items you rarely use. Rent them only when needed.",
  },
  {
    icon: TestTube2,
    title: 'Try Before You Buy',
    description: 'Test products before making a purchase decision.',
  },
  {
    icon: Crown,
    title: 'Access Premium',
    description: 'Access premium and expensive items at a fraction of the cost.',
  },
  {
    icon: Leaf,
    title: 'Eco Friendly',
    description: 'Reduce waste by sharing resources. Better for the planet.',
  },
  {
    icon: Repeat,
    title: 'Total Flexibility',
    description: 'Rent for as long or as short as you need. No commitments.',
  },
];

const stats = [
  { icon: IndianRupee, value: '₹2.5Cr+', label: 'Saved by Users' },
  { icon: Users, value: '5,000+', label: 'Happy Renters' },
  { icon: TrendingUp, value: '25,000+', label: 'Rentals Completed' },
];

export default function WhyRentSection() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left — Stats */}
          <motion.div
            className="lg:col-span-4"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0f172a] leading-tight">
              Why Rent
              <br />
              <span className="text-[#059669]">Instead of Buy?</span>
            </h2>
            <p className="mt-4 text-[#64748b] leading-relaxed">
              Smart people choose renting for a more flexible and sustainable lifestyle. Join thousands who have already made the switch.
            </p>

            <div className="mt-8 space-y-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-[#ecfdf5] flex items-center justify-center shrink-0">
                    <stat.icon className="h-6 w-6 text-[#059669]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#0f172a]">{stat.value}</div>
                    <div className="text-sm text-[#64748b]">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right — Benefits grid */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  className="bg-[#f8fafc] rounded-xl p-5 border border-[#e2e8f0] hover:border-[#10b981]/30 hover:shadow-md transition-all"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                >
                  <div className="w-11 h-11 rounded-lg bg-[#ecfdf5] flex items-center justify-center mb-3">
                    <benefit.icon className="h-5 w-5 text-[#059669]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#0f172a] mb-1.5">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-[#64748b] leading-relaxed">
                    {benefit.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
