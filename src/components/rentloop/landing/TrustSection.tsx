'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Headphones, Undo2 } from 'lucide-react';

const trustItems = [
  {
    icon: ShieldCheck,
    title: 'Verified Owners',
    description: 'All owners are ID-verified and background checked for your safety and peace of mind.',
    color: 'bg-[#059669]/10 text-[#059669]',
  },
  {
    icon: Lock,
    title: 'Secure Payments',
    description: 'Bank-grade encryption with escrow protection. Your money is safe until you receive the item.',
    color: 'bg-[#059669]/10 text-[#059669]',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Round-the-clock customer support via chat, email, and phone. We are always here to help.',
    color: 'bg-[#059669]/10 text-[#059669]',
  },
  {
    icon: Undo2,
    title: 'Easy Returns',
    description: 'Hassle-free returns with doorstep pickup. Security deposit refunded within 48 hours.',
    color: 'bg-[#047857]/10 text-[#047857]',
  },
];

export default function TrustSection() {
  return (
    <section className="py-16 sm:py-20 bg-[#f8fafc] relative">
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
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0f172a]">
            Built on Trust &amp; Security
          </h2>
          <p className="mt-3 text-[#64748b] text-lg max-w-xl mx-auto">
            Every transaction on RentCart is protected and verified
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {trustItems.map((item, index) => (
            <motion.div
              key={item.title}
              className="bg-white rounded-xl border border-[#e2e8f0] p-6 text-center hover:shadow-md hover:border-[#10b981]/20 transition-all"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-4`}>
                <item.icon className="h-7 w-7" />
              </div>
              <h3 className="text-base font-semibold text-[#0f172a] mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-[#64748b] leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
