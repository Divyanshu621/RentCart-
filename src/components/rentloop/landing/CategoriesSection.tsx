'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  Cpu, Camera, Laptop, Gamepad2, Armchair, Wrench,
  Car, Bike, Trophy, Tent, Music, Refrigerator,
} from 'lucide-react';
import { useAppStore } from '@/store';

const categories = [
  { name: 'Electronics', icon: Cpu, slug: 'electronics', count: 1250, image: '/categories/electronics.png' },
  { name: 'Cameras', icon: Camera, slug: 'cameras', count: 890, image: '/categories/cameras.png' },
  { name: 'Laptops', icon: Laptop, slug: 'laptops', count: 760, image: '/categories/laptops.png' },
  { name: 'Gaming', icon: Gamepad2, slug: 'gaming', count: 540, image: '/categories/gaming.png' },
  { name: 'Furniture', icon: Armchair, slug: 'furniture', count: 920, image: '/categories/furniture.png' },
  { name: 'Tools', icon: Wrench, slug: 'tools', count: 680, image: '/categories/tools.png' },
  { name: 'Vehicles', icon: Car, slug: 'vehicles', count: 430, image: '/categories/vehicles.png' },
  { name: 'Bikes', icon: Bike, slug: 'bikes', count: 310, image: '/categories/bikes.png' },
  { name: 'Sports', icon: Trophy, slug: 'sports', count: 570, image: '/categories/sports.png' },
  { name: 'Camping', icon: Tent, slug: 'camping', count: 280, image: '/categories/camping.png' },
  { name: 'Party Equipment', icon: Music, slug: 'party-equipment', count: 350, image: '/categories/party-equipment.png' },
  { name: 'Home Appliances', icon: Refrigerator, slug: 'home-appliances', count: 490, image: '/categories/home-appliances.png' },
];

const overlayGradients: Record<string, string> = {
  'Electronics': 'from-emerald-900/80 via-emerald-800/60 to-transparent',
  'Cameras': 'from-rose-900/80 via-rose-800/60 to-transparent',
  'Laptops': 'from-violet-900/80 via-violet-800/60 to-transparent',
  'Gaming': 'from-fuchsia-900/80 via-fuchsia-800/60 to-transparent',
  'Furniture': 'from-amber-900/80 via-amber-800/60 to-transparent',
  'Tools': 'from-orange-900/80 via-orange-800/60 to-transparent',
  'Vehicles': 'from-sky-900/80 via-sky-800/60 to-transparent',
  'Bikes': 'from-teal-900/80 via-teal-800/60 to-transparent',
  'Sports': 'from-red-900/80 via-red-800/60 to-transparent',
  'Camping': 'from-green-900/80 via-green-800/60 to-transparent',
  'Party Equipment': 'from-pink-900/80 via-pink-800/60 to-transparent',
  'Home Appliances': 'from-cyan-900/80 via-cyan-800/60 to-transparent',
};

const accentColors: Record<string, string> = {
  'Electronics': 'text-emerald-400',
  'Cameras': 'text-rose-400',
  'Laptops': 'text-violet-400',
  'Gaming': 'text-fuchsia-400',
  'Furniture': 'text-amber-400',
  'Tools': 'text-orange-400',
  'Vehicles': 'text-sky-400',
  'Bikes': 'text-teal-400',
  'Sports': 'text-red-400',
  'Camping': 'text-green-400',
  'Party Equipment': 'text-pink-400',
  'Home Appliances': 'text-cyan-400',
};

const borderHoverColors: Record<string, string> = {
  'Electronics': 'hover:border-emerald-500/50',
  'Cameras': 'hover:border-rose-500/50',
  'Laptops': 'hover:border-violet-500/50',
  'Gaming': 'hover:border-fuchsia-500/50',
  'Furniture': 'hover:border-amber-500/50',
  'Tools': 'hover:border-orange-500/50',
  'Vehicles': 'hover:border-sky-500/50',
  'Bikes': 'hover:border-teal-500/50',
  'Sports': 'hover:border-red-500/50',
  'Camping': 'hover:border-green-500/50',
  'Party Equipment': 'hover:border-pink-500/50',
  'Home Appliances': 'hover:border-cyan-500/50',
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function CategoriesSection() {
  const navigate = useAppStore((s) => s.navigate);

  const handleClick = (slug: string) => {
    navigate('marketplace', { category: slug });
  };

  return (
    <section id="categories" className="py-16 sm:py-20 bg-[#0a0a0a] relative overflow-hidden">
      {/* Animated background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Browse by Category
          </h2>
          <p className="mt-3 text-gray-400 text-lg max-w-xl mx-auto">
            Explore thousands of items across all rental categories
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {categories.map((cat) => (
            <motion.div
              key={cat.slug}
              variants={cardVariants}
              whileHover={{ scale: 1.04, y: -6 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleClick(cat.slug)}
              className={`group cursor-pointer relative rounded-2xl overflow-hidden h-44 sm:h-52 border border-white/10 ${borderHoverColors[cat.name] || 'hover:border-emerald-500/50'} transition-all duration-300 hover:shadow-2xl hover:shadow-black/40`}
            >
              {/* Background Image */}
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />

              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t ${overlayGradients[cat.name] || 'from-emerald-900/80 via-emerald-800/60 to-transparent'}`} />

              {/* Bottom shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:bg-white/25 transition-colors duration-300">
                    <cat.icon className={`h-4 w-4 ${accentColors[cat.name] || 'text-emerald-400'}`} />
                  </div>
                  <span className="text-sm font-bold text-white tracking-wide group-hover:text-white transition-colors">
                    {cat.name}
                  </span>
                </div>
                <p className="text-xs text-gray-300/80 group-hover:text-gray-200 transition-colors">
                  {cat.count.toLocaleString('en-IN')}+ items
                </p>
              </div>

              {/* Top-right arrow indicator */}
              <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/20 group-hover:bg-white/20">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
