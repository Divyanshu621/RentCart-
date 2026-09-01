'use client';

import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'How does renting work on RentCart?',
    answer: 'Simply browse items, select your rental dates, pay securely online, and either pick up the item or get it delivered. Once your rental period ends, return the item in the same condition. It\'s that simple!',
  },
  {
    question: 'Is my payment secure?',
    answer: 'Absolutely! All payments are processed through our secure payment gateway with bank-grade encryption. We never store your card details. Your money is held in escrow until you confirm the item is received in good condition.',
  },
  {
    question: 'What is the security deposit and when is it refunded?',
    answer: 'A security deposit is collected along with the rental fee to cover any potential damage. It is fully refunded within 24-48 hours after you return the item in its original condition, as confirmed by the owner.',
  },
  {
    question: 'What happens if the item is damaged during rental?',
    answer: 'Minor wear and tear is expected. For significant damage, the owner can file a dispute and our support team will mediate fairly. The security deposit may be partially or fully used to cover repair costs based on the assessment.',
  },
  {
    question: 'Can I extend my rental period?',
    answer: "Yes! You can request an extension through the app before your current rental ends. The owner will review and approve or reject the request. If approved, you'll only pay the additional rental amount for the extended days.",
  },
  {
    question: 'What if the owner cancels my booking?',
    answer: 'If an owner cancels a confirmed booking, you\'ll receive a full refund including any delivery charges. We also offer alternative listings and a small credit as compensation for the inconvenience.',
  },
  {
    question: 'How do I become an owner and list items?',
    answer: 'Sign up for a free account, complete your profile verification, and click "List Your Item". Add photos, set your pricing, and your listing will be live after a quick review by our team. It takes less than 5 minutes!',
  },
  {
    question: 'Is there a cancellation policy?',
    answer: 'Yes. Cancellations made 24+ hours before the rental start time receive a full refund. Cancellations within 24 hours may incur a small fee. Owners also follow a similar cancellation policy to ensure reliability for renters.',
  },
];

export default function FAQSection() {
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0f172a]">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-[#64748b] text-lg max-w-xl mx-auto">
            Everything you need to know about renting on RentCart
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white rounded-xl border border-[#e2e8f0] px-6 mb-3 data-[state=open]:shadow-sm data-[state=open]:border-[#10b981]/40 transition-all"
              >
                <AccordionTrigger className="text-left text-[#0f172a] font-medium hover:no-underline py-4 text-sm sm:text-base data-[state=open]:text-[#059669] transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-[#64748b] text-sm leading-relaxed pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
