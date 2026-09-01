'use client';

import { useAppStore } from '@/store';
import type { AppView } from '@/types';
import { Home, Search, PlusCircle, Package, UserCircle } from 'lucide-react';

export default function MobileNav() {
  const { currentView, navigate, user, setAuthModalOpen, setAuthModalView } = useAppStore();

  // Don't show on landing page
  if (currentView === 'landing') return null;

  const requireAuth = (view: AppView) => {
    if (!user) {
      setAuthModalView('login');
      setAuthModalOpen(true);
      return;
    }
    navigate(view);
  };

  const items = [
    { icon: Home, label: 'Home', view: 'landing' as AppView, action: () => navigate('landing') },
    { icon: Search, label: 'Explore', view: 'marketplace' as AppView, action: () => navigate('marketplace') },
    { icon: PlusCircle, label: 'List', view: 'list-item' as AppView, action: () => requireAuth('list-item') },
    { icon: Package, label: 'Rentals', view: 'my-rentals' as AppView, action: () => requireAuth('my-rentals') },
    { icon: UserCircle, label: 'Profile', view: 'dashboard' as AppView, action: () => requireAuth('dashboard') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-gray-200/60 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(item => {
          const isActive = currentView === item.view;
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              onClick={item.action}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all min-w-[56px] ${
                isActive
                  ? 'text-emerald-600'
                  : 'text-gray-400 active:text-gray-600'
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${
                isActive ? 'bg-emerald-100' : ''
              }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : ''}`} />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
