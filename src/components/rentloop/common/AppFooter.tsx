'use client';

import { useAppStore } from '@/store';
import type { AppView } from '@/types';
import {
  Store, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AppFooter() {
  const navigate = useAppStore((s) => s.navigate);
  const currentView = useAppStore((s) => s.currentView);
  const user = useAppStore((s) => s.user);
  const setAuthModalOpen = useAppStore((s) => s.setAuthModalOpen);
  const setAuthModalView = useAppStore((s) => s.setAuthModalView);

  if (currentView === 'landing') return null;

  const requireAuth = (view: AppView) => {
    if (!user) {
      setAuthModalView('login');
      setAuthModalOpen(true);
      return;
    }
    navigate(view);
  };

  const handleSocialClick = (platform: string) => {
    toast.info(`${platform} page coming soon!`);
  };

  return (
    <footer className="bg-[#0f172a] text-gray-300 mt-auto pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-[#059669] rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Rent<span className="text-emerald-400">Cart</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Rent it. Use it. Return it. The smarter way to access the things you need across India.
            </p>
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>Bengaluru, Karnataka, India</span>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={() => handleSocialClick('Facebook')}
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#059669] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleSocialClick('Twitter')}
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#059669] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleSocialClick('Instagram')}
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#059669] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleSocialClick('LinkedIn')}
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#059669] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleSocialClick('YouTube')}
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#059669] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* For Renters */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">For Renters</h3>
            <ul className="space-y-2.5">
              <li>
                <button onClick={() => navigate('marketplace')} className="text-sm text-gray-400 hover:text-[#10b981] transition-colors">
                  Browse Rentals
                </button>
              </li>
              <li>
                <button onClick={() => navigate('landing')} className="text-sm text-gray-400 hover:text-[#10b981] transition-colors">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => navigate('help-center')} className="text-sm text-gray-400 hover:text-[#10b981] transition-colors">
                  Safety Guide
                </button>
              </li>
              <li>
                <button onClick={() => navigate('help-center')} className="text-sm text-gray-400 hover:text-[#10b981] transition-colors">
                  Pricing & Fees
                </button>
              </li>
              <li>
                <button onClick={() => requireAuth('favorites')} className="text-sm text-gray-400 hover:text-[#10b981] transition-colors">
                  My Favourites
                </button>
              </li>
            </ul>
          </div>

          {/* For Owners */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">For Owners</h3>
            <ul className="space-y-2.5">
              <li>
                <button onClick={() => requireAuth('list-item')} className="text-sm text-gray-400 hover:text-[#10b981] transition-colors">
                  List Your Item
                </button>
              </li>
              <li>
                <button onClick={() => requireAuth('dashboard')} className="text-sm text-gray-400 hover:text-[#10b981] transition-colors">
                  Owner Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => requireAuth('my-listings')} className="text-sm text-gray-400 hover:text-[#10b981] transition-colors">
                  My Listings
                </button>
              </li>
              <li>
                <button onClick={() => requireAuth('dashboard')} className="text-sm text-gray-400 hover:text-[#10b981] transition-colors">
                  Earnings
                </button>
              </li>
              <li>
                <button onClick={() => navigate('help-center')} className="text-sm text-gray-400 hover:text-[#10b981] transition-colors">
                  Trust & Verification
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => navigate('contact')}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#10b981] transition-colors"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>support@rentcart.in</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('contact')}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#10b981] transition-colors"
                >
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>+91 1800-736-8227</span>
                </button>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Bengaluru, India</span>
              </li>
            </ul>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => navigate('help-center')}
                className="block text-sm text-gray-400 hover:text-[#10b981] transition-colors"
              >
                Help Center
              </button>
              <button
                onClick={() => navigate('privacy-policy')}
                className="block text-sm text-gray-400 hover:text-[#10b981] transition-colors"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => navigate('terms-of-service')}
                className="block text-sm text-gray-400 hover:text-[#10b981] transition-colors"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} RentCart. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <button
              onClick={() => navigate('privacy-policy')}
              className="hover:text-gray-300 transition-colors"
            >
              Privacy
            </button>
            <span className="text-gray-700">|</span>
            <button
              onClick={() => navigate('terms-of-service')}
              className="hover:text-gray-300 transition-colors"
            >
              Terms
            </button>
            <span className="text-gray-700">|</span>
            <button
              onClick={() => navigate('cookies-policy')}
              className="hover:text-gray-300 transition-colors"
            >
              Cookies
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
