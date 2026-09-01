'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft,
  HelpCircle, 
  Shield, 
  CreditCard, 
  Package, 
  Truck, 
  AlertTriangle, 
  UserCheck, 
  FileText, 
  MessageCircle,
  Phone
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: React.ElementType;
  color: string;
  faqs: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    title: 'Getting Started',
    icon: HelpCircle,
    color: 'text-emerald-600 bg-emerald-50',
    faqs: [
      {
        question: 'How does RentCart work?',
        answer: 'RentCart is a peer-to-peer rental marketplace. Browse items, book them for the duration you need, pay securely, and return them when done. Owners list their items and earn money by renting them out.',
      },
      {
        question: 'How do I create an account?',
        answer: 'Click the "Sign Up" button and register with your email and phone number. You\'ll receive an OTP to verify your account. You can also sign up quickly using Google.',
      },
      {
        question: 'What do I need to rent items?',
        answer: 'You need a verified account with a valid phone number. Some high-value items may require additional identity verification. You\'ll also need a valid payment method for the rental amount and security deposit.',
      },
      {
        question: 'Is there a membership fee?',
        answer: 'No! RentCart is completely free to use for renters. You only pay for the items you rent. Owners pay a small platform fee on each completed rental.',
      },
    ],
  },
  {
    title: 'Renting Items',
    icon: Package,
    color: 'text-blue-600 bg-blue-50',
    faqs: [
      {
        question: 'How do I book a rental?',
        answer: 'Find an item you like, select your rental dates, review the pricing breakdown, and click "Rent Now". Complete the payment and the owner will confirm your booking. You can pick up the item or have it delivered.',
      },
      {
        question: 'What is a security deposit?',
        answer: 'A security deposit is a refundable amount held during your rental period. It protects the owner against damage or loss. The deposit is fully refunded within 3-5 business days after the item is returned in good condition.',
      },
      {
        question: 'Can I extend my rental period?',
        answer: 'Yes! You can request an extension through the "My Rentals" section. The owner will review and approve or reject the request. Additional charges will apply for the extended period.',
      },
      {
        question: 'What happens if I return the item late?',
        answer: 'Late returns incur a daily late fee as specified in the rental listing. If significantly overdue, the rental may be marked as disputed. Please communicate with the owner if you anticipate a delay.',
      },
      {
        question: 'Can I cancel a rental?',
        answer: 'Yes, you can cancel before the rental starts. Cancellation policies vary by listing — check the specific item\'s cancellation policy. Cancellations after the rental period starts may not be eligible for a full refund.',
      },
    ],
  },
  {
    title: 'Payments & Pricing',
    icon: CreditCard,
    color: 'text-purple-600 bg-purple-50',
    faqs: [
      {
        question: 'What payment methods are accepted?',
        answer: 'We accept UPI, debit cards, credit cards, and net banking. All payments are processed securely through our payment partner.',
      },
      {
        question: 'When is the security deposit refunded?',
        answer: 'After the item is returned and inspected by the owner, the security deposit is refunded within 3-5 business days to your original payment method.',
      },
      {
        question: 'Are there any hidden charges?',
        answer: 'No. The pricing breakdown shown before you confirm a rental includes the rental amount, platform fee, delivery fee (if applicable), and GST. What you see is what you pay.',
      },
      {
        question: 'How do coupon codes work?',
        answer: 'Enter a valid coupon code during checkout to get a discount. Coupons may have minimum order values and usage limits. Only one coupon can be applied per rental.',
      },
    ],
  },
  {
    title: 'Delivery & Pickup',
    icon: Truck,
    color: 'text-orange-600 bg-orange-50',
    faqs: [
      {
        question: 'Does RentCart deliver items?',
        answer: 'Delivery depends on the owner\'s preference. Many owners offer delivery within a certain radius for a fee. You can also arrange self-pickup from the owner\'s location.',
      },
      {
        question: 'How do I return an item?',
        answer: 'Navigate to "My Rentals", find the active rental, and click "Return Item". The owner will be notified. You can either drop off the item or schedule a pickup.',
      },
      {
        question: 'What if the item is damaged during delivery?',
        answer: 'If you notice damage upon receiving the item, report it immediately with photos through the dispute system. Our support team will investigate and resolve the issue fairly.',
      },
    ],
  },
  {
    title: 'Safety & Trust',
    icon: Shield,
    color: 'text-rose-600 bg-rose-50',
    faqs: [
      {
        question: 'How does RentCart ensure safety?',
        answer: 'All owners undergo KYC verification. We have a rating and review system, secure payment handling, dispute resolution, and a trust score for every user. High-value items may require additional verification.',
      },
      {
        question: 'What is the trust score?',
        answer: 'The trust score is a measure of a user\'s reliability based on completed rentals, reviews, response rate, and account verification. A higher trust score builds confidence with other users.',
      },
      {
        question: 'What if the item I received is different from the listing?',
        answer: 'Report the discrepancy immediately through the dispute system with photos. We\'ll investigate and ensure a fair resolution, which may include a full refund.',
      },
      {
        question: 'How do I report a user or listing?',
        answer: 'You can report a user or listing through their profile or the listing page. Our moderation team reviews all reports and takes appropriate action.',
      },
    ],
  },
  {
    title: 'Listing Items (Owners)',
    icon: UserCheck,
    color: 'text-teal-600 bg-teal-50',
    faqs: [
      {
        question: 'How do I list an item for rent?',
        answer: 'Go to your Dashboard, click "List an Item", fill in the details (title, description, photos, pricing, location), and submit. Your listing will be reviewed and approved by our team.',
      },
      {
        question: 'What is KYC verification?',
        answer: 'KYC (Know Your Customer) verification requires you to submit your Aadhaar, PAN, and bank details. This builds trust with renters and is mandatory for all owners before listing items.',
      },
      {
        question: 'How and when do I get paid?',
        answer: 'Earnings are transferred to your verified bank account after the rental is completed and the item is returned. Transfers typically take 3-5 business days.',
      },
      {
        question: 'Can I set my own rental prices?',
        answer: 'Yes! You set the daily rental price, weekly price (optional), and security deposit. You can also choose to offer delivery and set the delivery fee and radius.',
      },
    ],
  },
  {
    title: 'Disputes & Issues',
    icon: AlertTriangle,
    color: 'text-amber-600 bg-amber-50',
    faqs: [
      {
        question: 'How do I raise a dispute?',
        answer: 'Go to "My Rentals", find the relevant rental, and click "Report Issue". Provide a detailed description and photos if applicable. Our team will review and mediate.',
      },
      {
        question: 'How long does dispute resolution take?',
        answer: 'Most disputes are resolved within 3-5 business days. Complex cases may take up to 10 business days. You\'ll be notified of updates via email and in-app notifications.',
      },
      {
        question: 'What if the owner refuses to return my security deposit?',
        answer: 'If the owner unjustifiably withholds your deposit, raise a dispute. Our team will review the evidence (photos, condition report) and ensure a fair outcome.',
      },
    ],
  },
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left border border-gray-200 rounded-xl p-4 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-gray-800 text-sm">{item.question}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </div>
      {open && (
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">{item.answer}</p>
      )}
    </button>
  );
}

export default function HelpCenterPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const filteredCategories = faqCategories.map((cat) => ({
    ...cat,
    faqs: cat.faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(search.toLowerCase()) ||
        faq.answer.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.faqs.length > 0);

  const totalFAQs = filteredCategories.reduce((acc, cat) => acc + cat.faqs.length, 0);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <button
            onClick={() => navigate('marketplace')}
            className="flex items-center gap-1.5 text-emerald-100 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Help Center</h1>
          </div>
          <p className="text-emerald-100 text-sm md:text-base max-w-lg">
            Find answers to common questions about renting, listing, payments, and more.
          </p>

          {/* Search */}
          <div className="mt-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search for help..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 rounded-xl bg-white text-gray-800 border-0 shadow-lg text-base placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search results summary */}
        {search && (
          <p className="text-sm text-gray-500 mb-6">
            Found {totalFAQs} result{totalFAQs !== 1 ? 's' : ''} for &quot;{search}&quot;
          </p>
        )}

        {/* Quick links */}
        {!search && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <button
              onClick={() => setActiveCategory(activeCategory === 0 ? null : 0)}
              className={`p-4 rounded-xl border text-center transition-all ${
                activeCategory === 0
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 text-gray-700'
              }`}
            >
              <HelpCircle className="w-6 h-6 mx-auto mb-2" />
              <span className="text-xs font-medium">Getting Started</span>
            </button>
            <button
              onClick={() => setActiveCategory(activeCategory === 1 ? null : 1)}
              className={`p-4 rounded-xl border text-center transition-all ${
                activeCategory === 1
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 text-gray-700'
              }`}
            >
              <Package className="w-6 h-6 mx-auto mb-2" />
              <span className="text-xs font-medium">Renting Items</span>
            </button>
            <button
              onClick={() => setActiveCategory(activeCategory === 2 ? null : 2)}
              className={`p-4 rounded-xl border text-center transition-all ${
                activeCategory === 2
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 text-gray-700'
              }`}
            >
              <CreditCard className="w-6 h-6 mx-auto mb-2" />
              <span className="text-xs font-medium">Payments</span>
            </button>
            <button
              onClick={() => navigate('contact')}
              className="p-4 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 text-gray-700 text-center transition-all"
            >
              <Phone className="w-6 h-6 mx-auto mb-2" />
              <span className="text-xs font-medium">Contact Us</span>
            </button>
          </div>
        )}

        {/* FAQ Categories */}
        <div className="space-y-8">
          {(activeCategory !== null ? [filteredCategories[activeCategory]] : filteredCategories).map(
            (category, idx) =>
              category ? (
                <div key={idx}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${category.color}`}>
                      <category.icon className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">{category.title}</h2>
                  </div>
                  <div className="space-y-3">
                    {category.faqs.map((faq, faqIdx) => (
                      <FAQAccordion key={faqIdx} item={faq} />
                    ))}
                  </div>
                </div>
              ) : null
          )}
        </div>

        {/* No results */}
        {search && totalFAQs === 0 && (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No results found</h3>
            <p className="text-sm text-gray-500 mb-6">Try searching with different keywords.</p>
            <Button
              variant="outline"
              onClick={() => navigate('contact')}
              className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </div>
        )}

        {/* Still need help CTA */}
        {!search && (
          <div className="mt-10 bg-white rounded-2xl border border-gray-200 p-6 md:p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Still need help?</h3>
            <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto">
              Our support team is available to help you with any questions or issues.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => navigate('contact')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => navigate('marketplace')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Marketplace
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
