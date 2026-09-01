'use client';

import { motion } from 'framer-motion';
import { Search, CreditCard, Package, RotateCcw } from 'lucide-react';

const steps = [
  {
    step: 1,
    icon: Search,
    title: 'Search & Browse',
    description: 'Explore thousands of items by category, location, or keyword.',
  },
  {
    step: 2,
    icon: CreditCard,
    title: 'Book & Pay',
    description: 'Select dates, pay securely online, and get instant confirmation.',
  },
  {
    step: 3,
    icon: Package,
    title: 'Receive & Enjoy',
    description: 'Pick up your item or get it delivered. Use it for as long as you need.',
  },
  {
    step: 4,
    icon: RotateCcw,
    title: 'Return & Review',
    description: 'Return on time and share your experience with the community.',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 bg-[#f8fafc] relative overflow-hidden">
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #059669 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0f172a]">
            How RentCart Works
          </h2>
          <p className="mt-3 text-[#64748b] text-lg max-w-xl mx-auto">
            Renting is simple, secure, and hassle-free in four easy steps
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Dotted connector line (desktop) */}
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] border-t-2 border-dashed border-[#059669]/20" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((item, index) => (
              <motion.div
                key={item.step}
                className="relative flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                {/* Step number circle */}
                <div className="relative z-10 w-14 h-14 rounded-full bg-[#059669] text-white flex items-center justify-center text-lg font-bold shadow-lg shadow-[#059669]/20">
                  {item.step}
                </div>

                {/* Icon circle */}
                <div className="mt-5 w-16 h-16 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm flex items-center justify-center">
                  <item.icon className="h-7 w-7 text-[#059669]" />
                </div>

                <h3 className="mt-4 text-lg font-semibold text-[#0f172a]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-[#64748b] leading-relaxed max-w-[220px]">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
