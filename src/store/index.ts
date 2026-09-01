import { create } from 'zustand';
import type { AppView, User, Product, Rental, State, City, Area, Category, Conversation, ChatMessage, Notification, DashboardStats, AdminDashboard } from '@/types';

interface AppState {
  // Navigation
  currentView: AppView;
  previousView: AppView | null;
  navigate: (view: AppView, data?: Record<string, unknown>) => void;
  goBack: () => void;
  viewData: Record<string, unknown>;

  // Auth
  user: User | null;
  setUser: (user: User | null) => void;
  isLoadingAuth: boolean;
  setIsLoadingAuth: (v: boolean) => void;

  // Location
  selectedState: State | null;
  setSelectedState: (state: State | null) => void;
  selectedCity: City | null;
  setSelectedCity: (city: City | null) => void;
  selectedArea: Area | null;
  setSelectedArea: (area: Area | null) => void;
  states: State[];
  setStates: (states: State[]) => void;

  // Categories
  categories: Category[];
  setCategories: (cats: Category[]) => void;

  // Marketplace
  products: Product[];
  setProducts: (products: Product[]) => void;
  totalProducts: number;
  setTotalProducts: (n: number) => void;

  // Product detail
  currentProduct: Product | null;
  setCurrentProduct: (p: Product | null) => void;

  // Rentals
  rentals: Rental[];
  setRentals: (r: Rental[]) => void;
  currentRental: Rental | null;
  setCurrentRental: (r: Rental | null) => void;

  // Dashboard
  dashboardStats: DashboardStats | null;
  setDashboardStats: (s: DashboardStats | null) => void;

  // Admin
  adminDashboard: AdminDashboard | null;
  setAdminDashboard: (d: AdminDashboard | null) => void;

  // Messages
  conversations: Conversation[];
  setConversations: (c: Conversation[]) => void;
  currentConversation: Conversation | null;
  setCurrentConversation: (c: Conversation | null) => void;
  messages: ChatMessage[];
  setMessages: (m: ChatMessage[]) => void;

  // Notifications
  notifications: Notification[];
  setNotifications: (n: Notification[]) => void;
  unreadCount: number;
  setUnreadCount: (n: number) => void;

  // Auth modal
  authModalOpen: boolean;
  setAuthModalOpen: (v: boolean) => void;
  authModalView: 'login' | 'register';
  setAuthModalView: (v: 'login' | 'register') => void;
  returnUrl: string | null;
  setReturnUrl: (v: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: 'landing',
  previousView: null,
  viewData: {},
  navigate: (view, data = {}) => set((state) => ({
    previousView: state.currentView,
    currentView: view,
    viewData: data,
  })),
  goBack: () => set((state) => ({
    currentView: state.previousView || 'landing',
    previousView: null,
  })),

  // Auth
  user: null,
  setUser: (user) => set({ user }),
  isLoadingAuth: true,
  setIsLoadingAuth: (v) => set({ isLoadingAuth: v }),

  // Location
  selectedState: null,
  setSelectedState: (state) => set({ selectedState: state }),
  selectedCity: null,
  setSelectedCity: (city) => set({ selectedCity: city }),
  selectedArea: null,
  setSelectedArea: (area) => set({ selectedArea: area }),
  states: [],
  setStates: (states) => set({ states }),

  // Categories
  categories: [],
  setCategories: (cats) => set({ categories: cats }),

  // Marketplace
  products: [],
  setProducts: (products) => set({ products }),
  totalProducts: 0,
  setTotalProducts: (n) => set({ totalProducts: n }),

  // Product detail
  currentProduct: null,
  setCurrentProduct: (p) => set({ currentProduct: p }),

  // Rentals
  rentals: [],
  setRentals: (r) => set({ rentals: r }),
  currentRental: null,
  setCurrentRental: (r) => set({ currentRental: r }),

  // Dashboard
  dashboardStats: null,
  setDashboardStats: (s) => set({ dashboardStats: s }),

  // Admin
  adminDashboard: null,
  setAdminDashboard: (d) => set({ adminDashboard: d }),

  // Messages
  conversations: [],
  setConversations: (c) => set({ conversations: c }),
  currentConversation: null,
  setCurrentConversation: (c) => set({ currentConversation: c }),
  messages: [],
  setMessages: (m) => set({ messages: m }),

  // Notifications
  notifications: [],
  setNotifications: (n) => set({ notifications: n }),
  unreadCount: 0,
  setUnreadCount: (n) => set({ unreadCount: n }),

  // Auth modal
  authModalOpen: false,
  setAuthModalOpen: (v) => set({ authModalOpen: v }),
  authModalView: 'login',
  setAuthModalView: (v) => set({ authModalView: v }),
  returnUrl: null,
  setReturnUrl: (v) => set({ returnUrl: v }),
}));
