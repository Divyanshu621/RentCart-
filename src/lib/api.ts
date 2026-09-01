const API_BASE = '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const headers: HeadersInit = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options?.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    credentials: 'include',
    ...options,
    headers, // ensure our headers take precedence
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const json = await res.json();
  // Strip the { success: true, ...data } wrapper that all API routes use
  if (json && typeof json === 'object' && json.success === true) {
    const { success: _, ...data } = json;
    return data as T;
  }
  return json as T;
}

export const api = {
  // Auth
  register: (data: { name: string; email: string; phone?: string; password: string; stateId: string; cityId: string; pinCode?: string; address?: string }) =>
    request<{ user: Record<string, unknown>; token: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<{ user: Record<string, unknown>; token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () =>
    request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  googleAuth: (data: { credential?: string; email?: string; name?: string; avatarUrl?: string }) =>
    request<{ user: Record<string, unknown>; message: string }>('/api/auth/google', { method: 'POST', body: JSON.stringify(data) }),

  getGoogleConfig: () =>
    request<{ configured: boolean; clientId: string | null }>('/api/auth/google/config'),

  me: () =>
    request<Record<string, unknown>>('/api/auth/me'),

  // States & Categories
  getStates: () =>
    request<Record<string, unknown>[]>('/api/states'),

  getCategories: () =>
    request<Record<string, unknown>[]>('/api/categories'),

  // Products
  getProducts: (params?: Record<string, string | number | undefined>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') searchParams.set(k, String(v)); });
    }
    const qs = searchParams.toString();
    return request<{ products: Record<string, unknown>[]; total: number; page: number; totalPages: number }>(`/api/products${qs ? `?${qs}` : ''}`);
  },

  getProduct: (id: string) =>
    request<Record<string, unknown>>(`/api/products/${id}`),

  createProduct: (data: Record<string, unknown>) =>
    request<{ product: Record<string, unknown> }>('/api/products', { method: 'POST', body: JSON.stringify(data) }),

  uploadImages: (files: File[]) => {
    const formData = new FormData();
    files.forEach(f => formData.append('file', f));
    formData.append('category', 'product');
    return request<{ url: string; originalName: string; size: number; type: string }>('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  updateProduct: (id: string, data: Record<string, unknown>) =>
    request<{ product: Record<string, unknown> }>(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteProduct: (id: string) =>
    request<{ message: string }>(`/api/products/${id}`, { method: 'DELETE' }),

  toggleFavorite: (productId: string) =>
    request<{ isFavorited: boolean }>(`/api/products/${productId}/favorite`, { method: 'POST' }),

  checkAvailability: (productId: string, startDate: string, endDate: string) =>
    request<{ available: boolean; unavailableDates: string[] }>(`/api/products/${productId}/availability?startDate=${startDate}&endDate=${endDate}`),

  getCalendarAvailability: (productId: string) =>
    request<{ unavailableDates: string[] }>(`/api/products/${productId}/calendar-availability`),

  getProductReviews: (productId: string, page = 1) =>
    request<{ reviews: Record<string, unknown>[]; total: number; totalPages: number }>(`/api/products/${productId}/reviews?page=${page}`),

  // Rentals
  createRental: (data: { productId: string; startDate: string; endDate: string; couponCode?: string }) =>
    request<{ rental: Record<string, unknown> }>('/api/rentals', { method: 'POST', body: JSON.stringify(data) }),

  getRentals: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<{ rentals: Record<string, unknown>[] }>(`/api/rentals${qs ? `?${qs}` : ''}`);
  },

  getRental: (id: string) =>
    request<{ rental: Record<string, unknown> }>(`/api/rentals/${id}`),

  updateRental: (id: string, data: Record<string, unknown>) =>
    request<{ rental: Record<string, unknown> }>(`/api/rentals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  payRental: (id: string) =>
    request<Record<string, unknown>>(`/api/rentals/${id}/pay`, { method: 'POST' }),

  // Payments
  createPaymentOrder: (rentalId: string, paymentMethod?: string) =>
    request<Record<string, unknown>>('/api/payments/create-order', { method: 'POST', body: JSON.stringify({ rentalId, paymentMethod }) }),

  verifyPayment: (data: { rentalId: string; razorpayOrderId?: string; razorpayPaymentId?: string; razorpaySignature?: string; paymentMethod?: string }) =>
    request<Record<string, unknown>>('/api/payments/verify', { method: 'POST', body: JSON.stringify(data) }),

  cancelRental: (id: string, reason?: string) =>
    request<Record<string, unknown>>(`/api/rentals/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),

  acceptRental: (id: string) =>
    request<{ rental: Record<string, unknown> }>(`/api/rentals/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'OWNER_ACCEPTED' }) }),

  rejectRental: (id: string, reason?: string) =>
    request<{ rental: Record<string, unknown> }>(`/api/rentals/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'OWNER_REJECTED', cancellationReason: reason || 'Owner rejected the rental request' }) }),

  returnRental: (id: string, data?: { inspectionResult?: string; inspectionNotes?: string }) =>
    request<{ rental: Record<string, unknown> }>(`/api/rentals/${id}/return`, { method: 'POST', body: JSON.stringify(data || {}) }),

  extendRental: (id: string, data: { requestedDays: number; reason?: string }) =>
    request<{ extension: Record<string, unknown> }>(`/api/rentals/${id}/extend`, { method: 'POST', body: JSON.stringify(data) }),

  respondExtension: (rentalId: string, extId: string, data: { approved: boolean }) =>
    request<Record<string, unknown>>(`/api/rentals/${rentalId}/extend/${extId}/respond`, { method: 'POST', body: JSON.stringify(data) }),

  // Reviews
  createReview: (data: { rentalId: string; rating: number; comment?: string }) =>
    request<{ review: Record<string, unknown> }>('/api/reviews', { method: 'POST', body: JSON.stringify(data) }),

  // Conversations
  getConversations: () =>
    request<{ conversations: Record<string, unknown>[] }>('/api/conversations'),

  createConversation: (otherUserId: string, productId?: string) =>
    request<{ conversation: Record<string, unknown> }>('/api/conversations', { method: 'POST', body: JSON.stringify({ otherUserId, productId }) }),

  getMessages: (conversationId: string) =>
    request<{ messages: Record<string, unknown>[] }>(`/api/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: string, content: string) =>
    request<Record<string, unknown>>(`/api/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),

  // Notifications
  getNotifications: () =>
    request<{ notifications: Record<string, unknown>[] }>('/api/notifications'),

  markNotificationsRead: (ids?: string[], markAll?: boolean) =>
    request<{ success: boolean }>('/api/notifications', { method: 'PATCH', body: JSON.stringify({ ids, markAll }) }),

  // Disputes
  createDispute: (data: { rentalId: string; reason: string; description: string }) =>
    request<{ dispute: Record<string, unknown> }>('/api/disputes', { method: 'POST', body: JSON.stringify(data) }),

  getDisputes: () =>
    request<{ disputes: Record<string, unknown>[] }>('/api/disputes'),

  updateDispute: (id: string, data: Record<string, unknown>) =>
    request<{ dispute: Record<string, unknown> }>(`/api/disputes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Coupons
  validateCoupon: (code: string, orderAmount: number) =>
    request<Record<string, unknown>>('/api/coupons/validate', { method: 'POST', body: JSON.stringify({ code, orderAmount }) }),

  // Dashboard
  getDashboard: () =>
    request<Record<string, unknown>>('/api/dashboard'),

  // Admin
  getAdminDashboard: () =>
    request<Record<string, unknown>>('/api/admin/dashboard'),

  getAdminUsers: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<{ users: Record<string, unknown>[]; total: number; page: number; totalPages: number }>(`/api/admin/users${qs ? `?${qs}` : ''}`);
  },

  updateAdminUser: (id: string, data: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  getAdminProducts: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<{ products: Record<string, unknown>[]; total: number; page: number; totalPages: number }>(`/api/admin/products${qs ? `?${qs}` : ''}`);
  },

  updateAdminProduct: (id: string, data: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/api/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  getAdminRentals: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<{ rentals: Record<string, unknown>[]; total: number; page: number; totalPages: number }>(`/api/admin/rentals${qs ? `?${qs}` : ''}`);
  },

  updateAdminRental: (id: string, data: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/api/admin/rentals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // KYC
  getKycStatus: () =>
    request<{ kycStatus: string; kyc: Record<string, unknown> | null }>('/api/kyc/status'),

  submitKyc: (data: Record<string, unknown>) =>
    request<{ kyc: Record<string, unknown>; message: string }>('/api/kyc/submit', { method: 'POST', body: JSON.stringify(data) }),

  saveKycDraft: (data: Record<string, unknown>) =>
    request<{ kyc: Record<string, unknown>; message: string }>('/api/kyc/submit', { method: 'PUT', body: JSON.stringify(data) }),

  reviewKyc: (id: string, data: { action: 'APPROVE' | 'REJECT'; rejectionReason?: string }) =>
    request<{ success: boolean; message: string }>(`/api/admin/kyc/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Payment Settings
  getPaymentSettings: () =>
    request<{ enabledMethods: Record<string, boolean> }>('/api/settings/payment'),

  updatePaymentSettings: (data: Partial<{
    razorpayEnabled: boolean;
    upiEnabled: boolean;
    cardEnabled: boolean;
    netbankingEnabled: boolean;
    walletEnabled: boolean;
    cashOnPickupEnabled: boolean;
  }>) =>
    request<{ message: string; enabledMethods: Record<string, boolean> }>('/api/settings/payment', { method: 'PUT', body: JSON.stringify(data) }),
};
