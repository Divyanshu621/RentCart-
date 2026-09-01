'use client';

import { motion } from 'framer-motion';
import { Star, Quote, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const reviews = [
  {
    id: '1',
    name: 'Priya Sharma',
    initials: 'PS',
    rating: 5,
    location: 'Mumbai, Maharashtra',
    text: "I rented a Canon camera for my sister's wedding and the experience was amazing! The camera was in excellent condition and the owner was very helpful with setup tips. Will definitely rent again.",
  },
  {
    id: '2',
    name: 'Rahul Mehta',
    initials: 'RM',
    rating: 5,
    location: 'Bangalore, Karnataka',
    text: 'Needed a laptop for a 3-day hackathon. Got a MacBook Pro delivered to my doorstep. Way cheaper than buying one. The whole process was smooth from booking to return.',
  },
  {
    id: '3',
    name: 'Ananya Iyer',
    initials: 'AI',
    rating: 4,
    location: 'Coorg, Karnataka',
    text: 'Rented camping gear for a weekend trip. The tent and sleeping bags were clean and well-maintained. Only minor issue was the pickup location was a bit far. Otherwise great service!',
  },
  {
    id: '4',
    name: 'Vikram Singh',
    initials: 'VS',
    rating: 5,
    location: 'Delhi, NCR',
    text: "I'm a freelancer who occasionally needs power tools. Renting through RentCart saves me so much money and storage space. The security deposit refund was processed within 24 hours.",
  },
  {
    id: '5',
    name: 'Deepa Nair',
    initials: 'DN',
    rating: 5,
    location: 'Kochi, Kerala',
    text: 'Rented furniture for a housewarming party. Everything arrived on time and was in perfect condition. The owner even helped with setup. Highly recommended!',
  },
  {
    id: '6',
    name: 'Amit Patel',
    initials: 'AP',
    rating: 4,
    location: 'Ahmedabad, Gujarat',
    text: 'Renting a PS5 for a weekend was a great decision. My kids loved it and I saved a lot compared to buying. The return process was super easy.',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200'}
        />
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0f172a]">
            What Our Users Say
          </h2>
          <p className="mt-3 text-[#64748b] text-lg max-w-xl mx-auto">
            Real experiences from real people across India
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              className="relative bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-6 hover:shadow-md hover:border-[#10b981]/20 transition-all"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <Quote className="absolute top-5 right-5 h-8 w-8 text-[#059669]/10" />

              <StarRating rating={review.rating} />

              <p className="mt-4 text-sm text-[#64748b] leading-relaxed">
                &ldquo;{review.text}&rdquo;
              </p>

              <div className="mt-5 flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-[#059669] text-white text-sm font-semibold">
                    {review.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-semibold text-[#0f172a]">{review.name}</div>
                  <div className="flex items-center gap-1 text-xs text-[#94a3b8]">
                    <MapPin className="h-3 w-3" />
                    {review.location}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
