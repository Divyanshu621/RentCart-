'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import AppHeader from '@/components/rentloop/common/AppHeader';
import AppFooter from '@/components/rentloop/common/AppFooter';
import MobileNav from '@/components/rentloop/common/MobileNav';
import ErrorBoundary from '@/components/rentloop/common/ErrorBoundary';
import LandingPage from '@/components/rentloop/landing/LandingPage';
import MarketplacePage from '@/components/rentloop/marketplace/MarketplacePage';
import ProductDetailPage from '@/components/rentloop/product/ProductDetailPage';
import LoginPage from '@/components/rentloop/auth/LoginPage';
import AuthModal from '@/components/rentloop/auth/AuthModal';
import DashboardPage from '@/components/rentloop/dashboard/DashboardPage';
import MyRentalsPage from '@/components/rentloop/rentals/MyRentalsPage';
import MyListingsPage from '@/components/rentloop/dashboard/MyListingsPage';
import ListItemPage from '@/components/rentloop/dashboard/ListItemPage';
import MessagesPage from '@/components/rentloop/messaging/MessagesPage';
import NotificationsPanel from '@/components/rentloop/common/NotificationsPanel';
import FavoritesPage from '@/components/rentloop/dashboard/FavoritesPage';
import AdminDashboardPage from '@/components/rentloop/admin/AdminDashboardPage';
import AdminUsersPage from '@/components/rentloop/admin/AdminUsersPage';
import AdminProductsPage from '@/components/rentloop/admin/AdminProductsPage';
import AdminRentalsPage from '@/components/rentloop/admin/AdminRentalsPage';
import AdminDisputesPage from '@/components/rentloop/admin/AdminDisputesPage';
import AdminSettingsPage from '@/components/rentloop/admin/AdminSettingsPage';
import SellerKycPage from '@/components/rentloop/kyc/SellerKycPage';
import HelpCenterPage from '@/components/rentloop/common/HelpCenterPage';
import ContactPage from '@/components/rentloop/common/ContactPage';
import PrivacyPolicyPage from '@/components/rentloop/common/PrivacyPolicyPage';
import TermsOfServicePage from '@/components/rentloop/common/TermsOfServicePage';
import CookiesPolicyPage from '@/components/rentloop/common/CookiesPolicyPage';
import type { User, State, Category } from '@/types';

export default function Home() {
  const currentView = useAppStore((s) => s.currentView);
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const setIsLoadingAuth = useAppStore((s) => s.setIsLoadingAuth);
  const setStates = useAppStore((s) => s.setStates);
  const setCategories = useAppStore((s) => s.setCategories);
  const navigate = useAppStore((s) => s.navigate);
  const kycRedirectDone = useRef(false);

  // Handle Google OAuth callback errors from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('auth_error');
    if (authError) {
      toast.error(authError);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    const init = async () => {
      try {
        const data = await api.me();
        setUser((data as Record<string, unknown>).user as unknown as User);
      } catch {
        setUser(null);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    init();
  }, [setUser, setIsLoadingAuth]);

  // KYC redirect for OWNER accounts
  useEffect(() => {
    if (!user || kycRedirectDone.current) return;
    if (user.role === 'OWNER' && user.kycStatus !== 'VERIFIED') {
      kycRedirectDone.current = true;
      // If already on KYC page, don't redirect again
      if (currentView !== 'seller-kyc') {
        toast.warning('Please complete seller verification to continue');
        navigate('seller-kyc');
      }
    }
  }, [user, currentView, navigate]);

  // Fetch reference data
  useEffect(() => {
    api.getStates().then((d) => setStates(d as unknown as State[])).catch(() => {});
    api.getCategories().then((d) => setCategories(d as unknown as Category[])).catch(() => {});
  }, [setStates, setCategories]);

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage />;
      case 'marketplace':
        return <MarketplacePage />;
      case 'product':
        return <ProductDetailPage />;
      case 'login':
        return <LoginPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'my-rentals':
        return <MyRentalsPage />;
      case 'my-listings':
        return <MyListingsPage />;
      case 'list-item':
        return <ListItemPage />;
      case 'messages':
      case 'conversation':
        return <MessagesPage />;
      case 'notifications':
        return <NotificationsPanel mode="fullpage" />;
      case 'favorites':
        return <FavoritesPage />;
      case 'admin-dashboard':
        return <AdminDashboardPage />;
      case 'admin-users':
        return <AdminUsersPage />;
      case 'admin-products':
        return <AdminProductsPage />;
      case 'admin-rentals':
        return <AdminRentalsPage />;
      case 'admin-disputes':
        return <AdminDisputesPage />;
      case 'admin-settings':
        return <AdminSettingsPage />;
      case 'seller-kyc':
        return <SellerKycPage />;
      case 'help-center':
        return <HelpCenterPage />;
      case 'contact':
        return <ContactPage />;
      case 'privacy-policy':
        return <PrivacyPolicyPage />;
      case 'terms-of-service':
        return <TermsOfServicePage />;
      case 'cookies-policy':
        return <CookiesPolicyPage />;
      default:
        return <MarketplacePage />;
    }
  };

  const isLanding = currentView === 'landing' || currentView === 'login';

  return (
    <div className={`min-h-screen flex flex-col ${isLanding ? '' : 'bg-gray-50'}`}>
      {!isLanding && (
        <ErrorBoundary>
          <AppHeader />
        </ErrorBoundary>
      )}
      <main className={`flex-1 ${isLanding ? '' : 'pb-20 md:pb-0 bg-[#f8fafc]'}`}>
        <ErrorBoundary>
          {renderView()}
        </ErrorBoundary>
      </main>
      {!isLanding && <AppFooter />}
      <MobileNav />
      <AuthModal />
    </div>
  );
}
